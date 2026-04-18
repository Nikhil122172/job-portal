#!/usr/bin/env bash
# =============================================================================
#  CareerBridge – Build & Start Monitoring Stack
#
#  Starts: Prometheus, Grafana, Loki, Promtail, SonarQube, Zipkin
#  Isolated from core services. Can run independently or alongside core.
#
#  USAGE:
#    ./build_monitoring.sh              → start monitoring stack
#    ./build_monitoring.sh down         → stop monitoring stack
#    ./build_monitoring.sh clean        → stop + prune monitoring volumes
#    ./build_monitoring.sh logs [svc]   → tail logs (optional: specific service)
#    ./build_monitoring.sh status       → show container status
#    ./build_monitoring.sh sonar-scan   → run SonarQube Maven scan against project
#
#  Prerequisites for metric scraping from core services:
#    1. Run ./build_core.sh first (creates careerbridge-network).
#    2. Optionally set in .env: TRACING_ENABLED=true
#
#  Access points:
#    Prometheus   →  http://localhost:9090
#    Grafana      →  http://localhost:3001    (admin / admin123)
#    Loki         →  http://localhost:3100
#    SonarQube    →  http://localhost:9000    (admin / admin)
#    Zipkin       →  http://localhost:9411
# =============================================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.monitoring.yml"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✗  $*${NC}" >&2; exit 1; }
header()  { echo -e "\n${CYAN}══ $* ══${NC}"; }

# ── Ensure shared core network exists (needed for Prometheus + Zipkin) ────────
ensure_core_network() {
  if ! docker network inspect careerbridge-network >/dev/null 2>&1; then
    warn "careerbridge-network not found — creating it now."
    warn "For full metric scraping, start core services first: ./build_core.sh"
    docker network create careerbridge-network >/dev/null
    info "Network careerbridge-network created (empty — no core services attached)."
  else
    info "careerbridge-network found ✓"
  fi
}

# ── vm.max_map_count check (required by SonarQube's embedded Elasticsearch) ──
check_vm_max_map_count() {
  local current
  current=$(cat /proc/sys/vm/max_map_count 2>/dev/null || echo 0)
  if [ "$current" -lt 262144 ]; then
    warn "vm.max_map_count=$current is below 262144 (required by SonarQube)."
    warn "Attempting to set it now (requires sudo)..."
    if sudo sysctl -w vm.max_map_count=262144 2>/dev/null; then
      success "vm.max_map_count set to 262144."
    else
      warn "Could not set vm.max_map_count automatically."
      warn "Run manually: sudo sysctl -w vm.max_map_count=262144"
      warn "On Windows/WSL2 add to %USERPROFILE%\\.wslconfig:"
      warn "  [wsl2]"
      warn "  kernelCommandLine = sysctl.vm.max_map_count=262144"
      warn "SonarQube may fail to start without this setting."
    fi
  fi
}

# ── URL summary ───────────────────────────────────────────────────────────────
print_urls() {
  echo ""
  echo "  📊  Prometheus    →  http://localhost:9090"
  echo "  📈  Grafana       →  http://localhost:3001    (admin / \${GRAFANA_ADMIN_PASSWORD:-admin123})"
  echo "  📋  Loki          →  http://localhost:3100"
  echo "  🔬  SonarQube     →  http://localhost:9000    (admin / admin — change on first login)"
  echo "  🔍  Zipkin        →  http://localhost:9411"
  echo ""
  echo "  ℹ️   Grafana dashboards are pre-provisioned under 'CareerBridge' folder."
  echo "  ℹ️   To enable distributed tracing add to .env and restart core:"
  echo "      TRACING_ENABLED=true"
  echo "      TRACING_SAMPLING_PROBABILITY=1.0"
  echo "      ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans"
  echo ""
  echo "  Commands:"
  echo "    ./build_monitoring.sh logs [service]   tail logs"
  echo "    ./build_monitoring.sh status           container status"
  echo "    ./build_monitoring.sh down             stop monitoring"
  echo "    ./build_monitoring.sh sonar-scan       run Maven SonarQube analysis"
}

# ── SonarQube Maven scan ──────────────────────────────────────────────────────
run_sonar_scan() {
  local sonar_token="${SONAR_TOKEN:-}"
  local project_key="${SONAR_PROJECT_KEY:-careerbridge}"
  local sonar_url="http://localhost:9000"

  info "Waiting for SonarQube to be ready..."
  local retries=0
  until curl -sf "$sonar_url/api/system/status" | grep -q '"status":"UP"' || [ $retries -ge 20 ]; do
    sleep 10
    retries=$((retries+1))
    echo -n "."
  done
  echo ""

  if ! curl -sf "$sonar_url/api/system/status" | grep -q '"status":"UP"'; then
    error "SonarQube is not ready at $sonar_url. Is the monitoring stack running?"
  fi

  info "Running SonarQube Maven scan (project: $project_key)..."
  cd backend
  mvn sonar:sonar \
    -Dsonar.projectKey="$project_key" \
    -Dsonar.projectName="CareerBridge" \
    -Dsonar.host.url="$sonar_url" \
    ${sonar_token:+-Dsonar.token="$sonar_token"} \
    -Dsonar.java.binaries=target/classes \
    -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml \
    --no-transfer-progress
  cd ..

  success "SonarQube scan complete. View results at: $sonar_url/dashboard?id=$project_key"
}

# ── Status ────────────────────────────────────────────────────────────────────
show_status() {
  header "Monitoring containers"
  docker compose -f "$COMPOSE_FILE" ps
  header "Docker disk usage"
  docker system df
}

# ── Command dispatcher ────────────────────────────────────────────────────────
case "${1:-}" in

  down)
    info "Stopping monitoring stack..."
    docker compose -f "$COMPOSE_FILE" down
    success "Monitoring stack stopped."
    ;;

  clean)
    warn "This will stop monitoring containers AND remove their volumes (metrics + dashboards data will be lost)."
    read -rp "Continue? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }
    docker compose -f "$COMPOSE_FILE" down -v
    success "Monitoring stack stopped and volumes removed."
    ;;

  logs)
    shift || true
    docker compose -f "$COMPOSE_FILE" logs -f --tail=200 "${@}"
    ;;

  status)
    show_status
    ;;

  sonar-scan)
    run_sonar_scan
    ;;

  *)
    header "Building Monitoring Stack (Grafana, Loki, Prometheus, SonarQube, Zipkin)"
    ensure_core_network
    check_vm_max_map_count

    info "Pulling/building monitoring images..."
    docker compose -f "$COMPOSE_FILE" pull --ignore-pull-failures 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" up --build -d

    success "Monitoring stack started."
    print_urls
    ;;

esac
