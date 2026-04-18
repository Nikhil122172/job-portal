#!/usr/bin/env bash
# =============================================================================
#  CareerBridge – Build & Start Core Services
#
#  USAGE:
#    ./build_core.sh               → build + start core services (default profile)
#    ./build_core.sh full          → build + start ALL services incl. notification & admin
#    ./build_core.sh --no-cache    → force full rebuild (core profile)
#    ./build_core.sh --no-cache full → force full rebuild (all services)
#    ./build_core.sh down          → stop all core containers
#    ./build_core.sh clean         → stop + prune dangling images & volumes
#    ./build_core.sh logs [svc]    → tail logs (optional: specific service)
#    ./build_core.sh status        → container status + image sizes + disk usage
#    ./build_core.sh rebuild <svc> → rebuild and restart a single service
# =============================================================================
set -euo pipefail

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

COMPOSE_FILE="docker-compose.core.yml"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✗  $*${NC}" >&2; exit 1; }
header()  { echo -e "\n${CYAN}══ $* ══${NC}"; }

# ── .env check ────────────────────────────────────────────────────────────────
check_env() {
  if [ ! -f .env ]; then
    warn ".env file not found."
    if [ -f .env.example ]; then
      cp .env.example .env
      warn "Copied .env.example → .env. Please fill in your secrets, then re-run."
      exit 1
    else
      error ".env not found and no .env.example to copy. Create .env manually."
    fi
  fi
}

# ── Ensure the shared network exists ─────────────────────────────────────────
ensure_core_network() {
  if ! docker network inspect careerbridge-network >/dev/null 2>&1; then
    info "Creating shared network careerbridge-network..."
    docker network create careerbridge-network >/dev/null
  fi
}

# ── Status ────────────────────────────────────────────────────────────────────
show_status() {
  header "Core containers"
  docker compose -f "$COMPOSE_FILE" --profile full ps
  header "CareerBridge images"
  docker images --filter "reference=careerbridge/*" \
    --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}" | sort
  header "Docker disk usage"
  docker system df
}

# ── URL summary ───────────────────────────────────────────────────────────────
print_urls() {
  local full=${1:-false}
  echo ""
  echo "  🌐  Frontend          →  http://localhost:3000"
  echo "  🔀  API Gateway       →  http://localhost:8080"
  echo "  📋  Eureka Dashboard  →  http://localhost:8761"
  echo "  ⚙️   Config Server    →  http://localhost:8888"
  if [ "$full" = "true" ]; then
    echo "  🔔  Notification Svc  →  http://localhost:8085"
    echo "  🛡️   Admin Service    →  http://localhost:8086"
  else
    echo ""
    warn "notification-service and admin-service are NOT started."
    warn "Run './build_core.sh full' to include them."
  fi
  echo ""
  echo "  💡  To enable Zipkin tracing add to .env:"
  echo "      TRACING_ENABLED=true"
  echo "      TRACING_SAMPLING_PROBABILITY=1.0"
  echo "      ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans"
  echo ""
  echo "  Commands:"
  echo "    ./build_core.sh logs [service]    tail logs"
  echo "    ./build_core.sh status            container status"
  echo "    ./build_core.sh rebuild <svc>     rebuild one service"
  echo "    ./build_core.sh down              stop everything"
}

# ── Command dispatcher ────────────────────────────────────────────────────────
case "${1:-}" in

  down)
    info "Stopping all core containers..."
    docker compose -f "$COMPOSE_FILE" --profile full down
    success "Core containers stopped."
    ;;

  clean)
    info "Stopping core containers + pruning dangling images and unused volumes..."
    docker compose -f "$COMPOSE_FILE" --profile full down
    docker image prune -f
    docker volume prune -f
    docker builder prune -f
    success "Cleanup complete."
    docker system df
    ;;

  logs)
    shift || true
    docker compose -f "$COMPOSE_FILE" --profile full logs -f --tail=200 "${@}"
    ;;

  status)
    show_status
    ;;

  rebuild)
    SERVICE="${2:-}"
    [ -z "$SERVICE" ] && error "Usage: ./build_core.sh rebuild <service-name>"
    check_env
    ensure_core_network
    info "Rebuilding service: $SERVICE..."
    DOCKER_BUILDKIT=1 docker compose -f "$COMPOSE_FILE" --profile full build "$SERVICE"
    docker compose -f "$COMPOSE_FILE" --profile full up -d --no-deps "$SERVICE"
    success "Service $SERVICE rebuilt and restarted."
    ;;

  --no-cache)
    check_env
    ensure_core_network
    PROFILE="${2:-}"
    if [ "$PROFILE" = "full" ]; then
      info "Building ALL core images (no-cache)..."
      docker compose -f "$COMPOSE_FILE" --profile full build --no-cache --parallel
      info "Starting ALL core services..."
      docker compose -f "$COMPOSE_FILE" --profile full up -d
      success "All core services started (no-cache build)."
      print_urls true
    else
      info "Building core images (no-cache)..."
      docker compose -f "$COMPOSE_FILE" build --no-cache --parallel
      info "Starting core services..."
      docker compose -f "$COMPOSE_FILE" up -d
      success "Core services started (no-cache build)."
      print_urls false
    fi
    show_status
    ;;

  full)
    check_env
    ensure_core_network
    info "Building ALL core images (incl. notification-service, admin-service)..."
    docker compose -f "$COMPOSE_FILE" --profile full build --parallel
    info "Starting ALL core services..."
    docker compose -f "$COMPOSE_FILE" --profile full up -d
    success "All core services started."
    print_urls true
    ;;

  *)
    check_env
    ensure_core_network
    info "Building CareerBridge core services..."
    docker compose -f "$COMPOSE_FILE" build --parallel
    info "Starting core services in detached mode..."
    docker compose -f "$COMPOSE_FILE" up -d
    success "Core services started."
    print_urls false
    ;;

esac
