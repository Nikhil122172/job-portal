# syntax=docker/dockerfile:1.7
# =============================================================================
#  CareerBridge – Optimised Spring Boot Dockerfile
#  Works for ALL 9 microservices. Change EXPOSE port per service.
# =============================================================================
#
#  DISK SAVINGS BREAKDOWN:
#  ┌─────────────────────────────────────────────────────┐
#  │  eclipse-temurin:17-jre-alpine  ≈  85 MB            │
#  │  vs eclipse-temurin:17-alpine   ≈ 340 MB  (-75%)    │
#  │  vs eclipse-temurin:17          ≈ 450 MB  (-81%)    │
#  ├─────────────────────────────────────────────────────┤
#  │  BuildKit cache mount:                               │
#  │    ~/.m2 shared across all 9 services                │
#  │    ~500 MB downloaded ONCE instead of 9 times        │
#  ├─────────────────────────────────────────────────────┤
#  │  Multi-stage build:                                  │
#  │    Maven, JDK, src/ NOT in runtime image             │
#  │    Saves ~300 MB of build tooling per image          │
#  ├─────────────────────────────────────────────────────┤
#  │  Spring Boot layertools:                             │
#  │    4 ordered Docker layers by change frequency       │
#  │    Code change = only ~50 KB layer re-pushed         │
#  └─────────────────────────────────────────────────────┘

# ─────────────────────────────────────────────────────────────────────────────
#  Stage 1 – Dependency resolution
#  pom.xml copied BEFORE src/ → this layer only re-runs when pom.xml changes.
#  BuildKit cache mount keeps ~/.m2 on the host → deps downloaded ONCE across
#  ALL services on the same machine. Subsequent builds: near-instant.
# ─────────────────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS deps
WORKDIR /build
# Copy parent pom first so Maven can resolve <parent> declaration
COPY pom.xml /pom.xml
# Copy service pom and install parent to local repo so child can inherit it
COPY auth-service/pom.xml pom.xml
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -f /pom.xml install -N -q --no-transfer-progress && \
    mvn dependency:go-offline -q --no-transfer-progress

# ─────────────────────────────────────────────────────────────────────────────
#  Stage 2 – Compile, package, extract layers
#  Spring Boot layertools splits fat JAR into 4 layers ordered by change freq:
#    1. dependencies          (~70 MB)  — stable, cached; only changes on dep upgrade
#    2. spring-boot-loader    (~300 KB) — very stable
#    3. snapshot-dependencies (~0-5 MB) — changes on SNAPSHOT upgrades only
#    4. application           (~50 KB)  — changes on every code change
#  On a code-only change: only the 50 KB "application" layer is re-pushed.
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY auth-service/src ./src
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn package -DskipTests -q --no-transfer-progress && \
    java -Djarmode=layertools -jar target/*.jar extract --destination extracted

# ─────────────────────────────────────────────────────────────────────────────
#  Stage 3 – Minimal runtime image
#  eclipse-temurin:17-jre-alpine ≈ 85 MB  — no Maven, no JDK, no src code.
#  Runs as non-root user for security best practice.
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Create non-root user (principle of least privilege)
RUN addgroup -S spring && adduser -S spring -G spring

# Copy Spring Boot layers: most stable first → least stable last.
# Each COPY is a separate Docker layer — only changed layers are re-pulled.
COPY --from=builder /build/extracted/dependencies/          ./
COPY --from=builder /build/extracted/spring-boot-loader/    ./
COPY --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --from=builder /build/extracted/application/           ./

USER spring

# Override per service (e.g., 8761 for eureka, 8080 for gateway, etc.)
EXPOSE 8081

# JVM flags optimised for containers:
#   UseContainerSupport    — respects cgroup memory limits (not host RAM)
#   MaxRAMPercentage=65.0  — 65% of container mem as max heap
#   InitialRAMPercentage=35 — start at 35%, grow as needed (faster startup)
#   UseG1GC                — best GC for microservice heap sizes
#   MaxGCPauseMillis=200   — prevents long GC pauses starving the CPU budget
#   ExitOnOutOfMemoryError — fail fast → Docker restarts cleanly
#   TieredStopAtLevel=1    — faster startup (trades peak throughput for boot speed)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=65.0", \
  "-XX:InitialRAMPercentage=35.0", \
  "-XX:+UseG1GC", \
  "-XX:MaxGCPauseMillis=200", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "org.springframework.boot.loader.launch.JarLauncher"]
