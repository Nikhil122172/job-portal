#!/usr/bin/env bash
# =============================================================================
#  CareerBridge – Docker Disk Maintenance Script
#
#  USAGE:
#    chmod +x docker-prune.sh
#    ./docker-prune.sh           → safe clean  (dangling images + stopped containers)
#    ./docker-prune.sh --build   → also clear BuildKit build cache (re-downloads deps)
#    ./docker-prune.sh --all     → nuclear: remove ALL unused data (keep named volumes)
#    ./docker-prune.sh --status  → show current disk usage breakdown
#
#  WHAT IS SAFE TO DELETE:
#    ✅ Dangling images   — untagged intermediate images from failed/old builds
#    ✅ Stopped containers — containers that exited or were replaced
#    ✅ Unused networks    — bridge networks with no containers attached
#    ✅ Build cache        — safe to delete; next build re-downloads deps (slower)
#    ⚠️  Named volumes    — contain your MySQL/Redis/Kafka data; NOT deleted here
#    ❌ Running containers — never deleted by this script
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
header()  { echo -e "\n${CYAN}══ $* ══${NC}"; }

show_status() {
  header "Docker disk usage"
  docker system df -v 2>/dev/null || docker system df
  echo ""
  header "CareerBridge images"
  docker images --filter "reference=careerbridge/*" \
    --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}" 2>/dev/null || true
}

case "${1:---safe}" in

  --status)
    show_status
    ;;

  --safe)
    header "Safe clean — removing dangling images, stopped containers, unused networks"
    warn "This will NOT touch running containers or named volumes."
    echo ""
    info "Removing stopped containers..."
    docker container prune -f
    info "Removing dangling (untagged) images..."
    docker image prune -f
    info "Removing unused networks..."
    docker network prune -f
    echo ""
    success "Safe clean complete."
    show_status
    ;;

  --build)
    header "Build cache clean"
    warn "This clears the BuildKit cache (~/.m2 Maven cache mount)."
    warn "The next 'docker compose build' will re-download all Maven dependencies (~500 MB per service)."
    warn "Only do this if you are running out of disk space."
    read -rp "Continue? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }
    docker builder prune -af
    docker container prune -f
    docker image prune -f
    docker network prune -f
    success "Build cache cleared."
    show_status
    ;;

  --all)
    header "NUCLEAR CLEAN — removes all unused Docker data"
    warn "This removes: ALL unused images (not just dangling), stopped containers,"
    warn "unused networks, and the entire BuildKit cache."
    warn ""
    warn "YOUR NAMED VOLUMES ARE PRESERVED:"
    warn "  careerbridge-mysql-data, careerbridge-redis-data,"
    warn "  careerbridge-kafka-data, careerbridge-zookeeper-data"
    warn ""
    warn "Running containers and their images are NOT affected."
    echo ""
    read -rp "Type 'yes' to confirm nuclear clean: " confirm
    [[ "$confirm" == "yes" ]] || { info "Aborted."; exit 0; }
    docker system prune -af
    success "Nuclear clean complete. Named volumes preserved."
    show_status
    ;;

  *)
    echo "Usage: $0 [--status | --safe | --build | --all]"
    echo ""
    echo "  --status   Show current Docker disk usage"
    echo "  --safe     Remove dangling images, stopped containers (DEFAULT)"
    echo "  --build    Also clear BuildKit cache (slower next build)"
    echo "  --all      Remove ALL unused data (keep named volumes)"
    exit 1
    ;;
esac
