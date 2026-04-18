# TalentBridge – Docker Optimisation Guide

## 🎯 Disk Usage: Before vs After

| Component | Before | After | Saving |
|---|---|---|---|
| Each Spring Boot image (JDK) | ~450 MB | ~185 MB (JRE-alpine) | -265 MB |
| 9 Spring Boot images total | ~4,050 MB | ~1,665 MB | **-2.4 GB** |
| Frontend image (Node) | ~450 MB | ~35 MB (nginx-alpine) | -415 MB |
| Maven dep downloads (9× each) | ~9 GB total | ~1 GB shared (BuildKit cache) | **-8 GB** |
| Build-stage leftovers in image | ~300 MB each | 0 (multi-stage) | -2.7 GB |
| Log overflow | Unbounded | Capped (max 150 MB/service) | ∞ saved |
| **Total images on disk** | **~70-80 GB** | **~8-10 GB** | **~70 GB** |

---

## ⚡ Optimisation #1 — BuildKit Cache Mounts (Biggest Win)

**The problem:** Without BuildKit, each of the 9 services runs `mvn dependency:go-offline`
independently. Each service downloads ~500 MB of Maven jars. Total = **4.5 GB downloaded per build**.

**The fix:** Add `# syntax=docker/dockerfile:1.7` at the top of every Dockerfile
and use `--mount=type=cache,target=/root/.m2` in every `RUN mvn ...` command.

```dockerfile
# syntax=docker/dockerfile:1.7        ← enables BuildKit syntax
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn dependency:go-offline -q
```

**What happens:** The Maven local repo (`~/.m2`) is stored in a BuildKit cache on the host,
shared across ALL service builds. Dependencies are downloaded **once** and reused on every
subsequent build of every service.

**Must also set:**
```bash
export DOCKER_BUILDKIT=1          # in shell or build.sh
export COMPOSE_DOCKER_CLI_BUILD=1 # makes docker compose use BuildKit
```

---

## ⚡ Optimisation #2 — JRE-Alpine Runtime Image (-75% per image)

```dockerfile
# BEFORE: Full JDK — 340 MB, includes compiler, tools, headers you never use
FROM eclipse-temurin:17-alpine

# AFTER: JRE only — ~85 MB, just what's needed to run .class files
FROM eclipse-temurin:17-jre-alpine
```

Saving: **~255 MB × 9 services = ~2.3 GB** off total image disk usage.

---

## ⚡ Optimisation #3 — Spring Boot Layertools (Smart Caching on Rebuild)

Spring Boot's layertools splits the fat JAR into 4 ordered Docker layers:

```
dependencies/          ← Spring, Hibernate, etc. — changes rarely (months)
spring-boot-loader/    ← Boot launcher — almost never changes
snapshot-dependencies/ ← SNAPSHOT jars — changes occasionally
application/           ← Your code + config — changes every commit (~1-5 MB)
```

Each is a separate `COPY` in the Dockerfile → a separate Docker layer.

**Result:** On every code change, only the tiny `application/` layer
(~1–5 MB) is rebuilt, re-pushed, and re-pulled. The 3 stable layers are
served from the local Docker layer cache instantly.

```dockerfile
# Extract layers during build stage
RUN java -Djarmode=layertools -jar target/*.jar extract --destination extracted

# Copy in stable → volatile order (maximises cache hits)
COPY --from=builder /build/extracted/dependencies/          ./
COPY --from=builder /build/extracted/spring-boot-loader/    ./
COPY --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --from=builder /build/extracted/application/           ./
```

---

## ⚡ Optimisation #4 — Multi-Stage Builds (Zero Build Tools in Final Image)

```
Stage 1 (deps)     → maven:3.9-eclipse-temurin-17-alpine   downloads deps
Stage 2 (builder)  → same image                             compiles + extracts layers
Stage 3 (runtime)  → eclipse-temurin:17-jre-alpine          runs the app
```

The final image contains **zero Maven**, **zero JDK**, **zero source code** —
only the JRE and the extracted JAR layers. The builder stages are discarded.

---

## ⚡ Optimisation #5 — nginx:alpine Frontend (-86%)

```
node:20-alpine + npm build  →  nginx:alpine + /dist
     ~180 MB                        ~25 MB + ~3 MB assets = ~28 MB
```

The Vite build output (`dist/`) is ~2–5 MB of static files.
nginx:alpine is 25 MB and serves them with zero Node.js runtime overhead.

---

## ⚡ Optimisation #6 — .dockerignore (Smaller Build Context)

A tight `.dockerignore` prevents large directories from being sent to the
Docker daemon on every build:

```
target/        ← can be 200-500 MB of compiled output
node_modules/  ← can be 500 MB+ of packages
.git/          ← can be large; never needed inside the image
.idea/         ← IDE files, not needed
```

Without `.dockerignore`, Docker sends **the entire project directory** to the
daemon before building. With it, only `pom.xml` and `src/` are sent.

---

## ⚡ Optimisation #7 — Log Size Caps

Docker's default `json-file` log driver has **no size limit**. Long-running
services can fill your disk with logs over days/weeks.

```yaml
logging:
  driver: json-file
  options:
    max-size: "50m"   # rotate when file hits 50 MB
    max-file: "3"     # keep at most 3 rotated files = 150 MB max per service
```

At 13 services × 150 MB = **1.95 GB max** total log disk usage (vs unbounded).

---

## ⚡ Optimisation #8 — Kafka Retention Limits

Kafka defaults to **7-day log retention** with **no size limit**. In a busy
system this can fill hundreds of GBs.

```yaml
KAFKA_LOG_RETENTION_HOURS: 24          # keep messages 24 hours only
KAFKA_LOG_RETENTION_BYTES: 536870912   # hard cap at 512 MB per partition
KAFKA_HEAP_OPTS: "-Xmx512m -Xms256m"  # prevent Kafka from taking 1 GB heap
```

---

## ⚡ Optimisation #9 — cache_from in docker-compose

```yaml
build:
  context: ./auth-service
  cache_from:
    - talentbridge/auth-service:latest
```

When you pull the previously built image before building (e.g., in CI),
Docker reuses its layers as a cache source — avoiding a full rebuild even
after clearing the local layer cache.

---

## 🧹 Docker Maintenance Commands

```bash
# Show what's taking up space
docker system df

# Remove dangling images (untagged intermediate layers)
docker image prune -f

# Remove all stopped containers
docker container prune -f

# Remove unused volumes (CAUTION: deletes DB data if containers are stopped)
docker volume prune -f

# Nuclear: remove everything unused (images, containers, networks, cache)
docker system prune -af --volumes

# Use the built-in script helper
./build.sh clean    # removes dangling images + unused volumes
./build.sh prune    # nuclear (asks for confirmation)
./build.sh status   # shows image sizes and container status
```

---

## 🚀 First-Time Setup

```bash
cd talentbridge-full/backend

# 1. Create your environment file
cp .env.example .env
# Edit .env with your real values (DB password, JWT secret, mail, Cloudinary)
nano .env

# 2. Build and start everything
./build.sh

# 3. Verify all services are healthy
./build.sh status
docker compose ps

# 4. Access the app
open http://localhost:3000      # React frontend
open http://localhost:8080      # API Gateway
open http://localhost:8761      # Eureka dashboard
```

---

## 📐 Container Memory Allocation Guide

| Service | Limit | Why |
|---|---|---|
| mysql | 512 MB | InnoDB buffer pool |
| redis | 192 MB | 128 MB maxmemory + overhead |
| zookeeper | 384 MB | capped heap 256 MB |
| kafka | 768 MB | capped heap 512 MB |
| eureka-server | 384 MB | lightweight, just registry |
| config-server | 384 MB | lightweight, just config |
| api-gateway | 640 MB | reactive, handles all traffic |
| auth-service | 640 MB | crypto + DB heavy |
| job-service | 640 MB | DB + Redis cache |
| application-service | 640 MB | DB + Kafka |
| file-service | 512 MB | Cloudinary proxy |
| notification-service | 512 MB | Kafka consumer + SMTP |
| admin-service | 512 MB | lightweight aggregator |
| frontend | 64 MB | nginx static file server |
| **Total** | **~7 GB** | (fits on 8–16 GB host) |
