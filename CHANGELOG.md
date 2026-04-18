# CareerBridge — Change Log (Review Pass)

All changes applied during the architectural review and bug-fix pass.

---

## Backend — notification-service

### `src/main/java/com/jobportal/notification/dto/EventDTO.java` — **CREATED** 🔴 Critical Fix
- **Problem**: `application.yml` and `config-repo/notification-service.yml` both reference `com.jobportal.notification.dto.EventDTO` as the Kafka consumer `spring.json.default.value.type`. This class did not exist anywhere in the codebase, causing `ClassNotFoundException` at startup and preventing all Kafka event consumption.
- **Fix**: Created the missing `EventDTO` class with all fields that appear across `ApplicationEvent`, `JobEvent`, and `UserEvent` (id, action, type, email, role, userId, jobId, applicationId, recruiterId, status, title, company, subject, body).

### `config-repo/notification-service.yml` — **MODIFIED** 🔴 Critical Fix
- **Problem**: `spring.kafka.listener.type` was set to `batch`. All three `@KafkaListener` methods (`ApplicationEventListener`, `JobEventListener`, `UserEventListener`) accept a **single event object**, not a `List<Event>`. In batch mode, Spring Kafka tries to pass a list and the method signature mismatch causes `MethodArgumentTypeMismatchException`, silently dropping all events.
- **Fix**: Changed `type: batch` → `type: single` to match the listener signatures.

### `src/main/resources/application.yml` — **MODIFIED** 🟡 Medium Fix
- **Problem**: `@KafkaListener` annotations reference `${app.kafka.topics.application-events}` etc., but the local `application.yml` did not declare these keys (only the config-repo version did). In dev-mode (without Config Server) the default values in the annotations still work, but the keys were not explicitly configurable.
- **Fix**: Added `app.kafka.topics` block with all three topic keys for explicit local override capability.

### `src/main/java/com/jobportal/notification/service/NotificationStreamService.java` — **MODIFIED** 🟡 Medium Fix
- **Problem**: File had Windows CRLF line endings, causing issues in Unix-based Docker builds and git diffs.
- **Fix**: Converted to Unix LF.

---

## Frontend

### `src/store/slices/notificationsSlice.ts` — **MODIFIED** 🟡 Medium Fix
- **Problem**: File had Windows CRLF line endings.
- **Fix**: Converted to Unix LF.

### All `src/**/*.ts` and `src/**/*.tsx` — **MODIFIED** 🟢 Low Fix
- **Fix**: Bulk CRLF → LF conversion across all TypeScript source files for consistency.

---

## Backend — All Services

### All `src/**/*.java` and `src/**/*.yml` — **MODIFIED** 🟢 Low Fix
- **Fix**: Bulk CRLF → LF conversion across all Java and YAML source files.

---

## Infrastructure / Scripts

### `backend/build.sh` — **MODIFIED** 🟡 Medium Fix
- **Problem**: Script did not expose the `--profile full` flag, so notification-service and admin-service (which are in the `full` profile) could not be started easily. `docker compose ps` also missed profile services.
- **Fix**: Added `full` subcommand (`./build.sh full`), updated all `docker compose` calls to include `--profile full` where needed, improved URL output to clearly indicate which profile is active.

### `backend/start-dev.sh` — **CREATED** 🟢 Enhancement
- **Added**: New helper script to start only the infrastructure services (MySQL, Redis, Kafka, Zookeeper) in Docker for local dev mode, with readiness checks and clear instructions for starting each Spring Boot service manually.

---

## Documentation

### `README.md` (root) — **REPLACED**
- Completely rewrote with: architecture diagram, port reference table, role capabilities, environment variable reference, detailed troubleshooting section, dev mode instructions, and test commands.

### `CHANGELOG.md` — **CREATED**
- This file.

---

## What Was NOT Changed

The following were reviewed and found to be correct — no changes needed:

- **JWT role flow**: `ROLE_JOB_SEEKER` in JWT/headers vs `JOB_SEEKER` in `UserResponse` is intentional and consistent. The `UserMapper` strips the `ROLE_` prefix for the frontend, and the frontend guards compare against stripped values correctly.
- **Feign inter-service calls**: `AuthClient.getUserById()` calls `/api/v1/users/{id}` which is correctly marked as `permitAll()` in auth-service's `SecurityConfig`. Feign bypasses the API gateway, so no JWT is needed.
- **SSE token-in-query-param**: The `JwtAuthFilter` correctly handles the `/api/v1/notifications/my/stream?token=` pattern and injects `X-User-Id` into the forwarded request.
- **DataSeeder idempotency**: The `DataSeeder` checks `existsByEmail` before inserting, so it does not conflict with `init.sql`.
- **Redis OTP flow**: Rate limiting, verified-flag TTL, and fallback OTP verification logic are all correct.
- **Cloudinary upload**: The transformation-as-Map fix in `AuthService.uploadProfileImage` and CDN cache invalidation (`invalidate: true`) are correctly applied.
- **Application re-apply after withdrawal**: The `ApplicationCommandHandler` correctly handles the WITHDRAWN→APPLIED re-application case.
- **Circuit breaker fallbacks**: All Feign clients have fallback implementations that return safe empty/null values.
