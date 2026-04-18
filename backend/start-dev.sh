#!/usr/bin/env bash
# =============================================================================
#  TalentBridge — Dev mode startup helper
#  Starts only infrastructure (MySQL, Redis, Kafka, Zookeeper) in Docker,
#  so you can run Spring Boot services locally with your IDE or mvn.
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}ℹ  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }

[ ! -f .env ] && { warn ".env not found — copying .env.example"; cp .env.example .env; }

info "Starting infrastructure services (MySQL, Redis, Kafka, Zookeeper)..."
docker compose up -d mysql redis zookeeper kafka

info "Waiting for MySQL to be ready..."
until docker exec talentbridge-mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  printf '.'; sleep 2
done
echo ""
info "MySQL ready."

info "Waiting for Kafka to be ready..."
until docker exec talentbridge-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 &>/dev/null; do
  printf '.'; sleep 3
done
echo ""
info "Kafka ready."

echo ""
echo "  Infrastructure is running. Start services in this order:"
echo ""
echo "  1.  cd eureka-server   && mvn spring-boot:run"
echo "  2.  cd config-server   && mvn spring-boot:run"
echo "  3.  cd auth-service    && mvn spring-boot:run"
echo "  4.  cd job-service     && mvn spring-boot:run"
echo "  5.  cd application-service && mvn spring-boot:run"
echo "  6.  cd file-service    && mvn spring-boot:run"
echo "  7.  cd notification-service && mvn spring-boot:run  (optional)"
echo "  8.  cd admin-service   && mvn spring-boot:run        (optional)"
echo "  9.  cd api-gateway     && mvn spring-boot:run"
echo ""
echo "  Then in a separate terminal:"
echo "    cd ../frontend && npm run dev"
echo ""
echo "  Frontend:    http://localhost:3000"
echo "  API Gateway: http://localhost:8080"
echo "  Eureka:      http://localhost:8761"
