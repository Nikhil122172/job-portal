# Jenkins CI/CD for CareerBridge

This document explains how to run CI/CD for this repository with Jenkins using the root `Jenkinsfile`.

## What the pipeline does

1. Checks out code from SCM.
2. Validates Java, Maven, Node, and npm availability.
3. Runs backend tests from `backend/` with Maven.
4. Optionally runs frontend lint, tests, and build from `frontend/`.
5. Optionally builds Docker images using `docker-compose.core.yml`.
6. Optionally pushes Docker images to a container registry.
7. Optionally deploys `core` or `full` profile with Docker Compose.

## Jenkins prerequisites

Install these tools on the Jenkins agent:

- JDK 17+
- Maven 3.9+
- Node.js 20+ and npm
- Docker + Docker Compose v2

The pipeline uses `agent any`, so Jenkins may schedule it on any available worker. Make sure that worker already has the required tools installed, or restrict the job to a labeled node that does.

Recommended Jenkins plugins:

- Pipeline
- Git
- Credentials Binding
- JUnit

## Create the Jenkins job

1. Create a new Pipeline job (or Multibranch Pipeline).
2. Configure SCM to this repository.
3. Set pipeline definition to `Pipeline script from SCM`.
4. Script path: `Jenkinsfile`.

## Pipeline parameters

- `RUN_FRONTEND_TESTS`: Run frontend CI steps.
- `BUILD_DOCKER_IMAGES`: Build Docker images with Compose.
- `PUSH_DOCKER_IMAGES`: Push images to registry.
- `DEPLOY_PROFILE`: `none`, `core`, or `full`.
- `DOCKER_CREDENTIALS_ID`: Jenkins credentials ID for Docker registry auth.

## Credentials setup (for push)

If `PUSH_DOCKER_IMAGES=true`:

1. Go to Jenkins Credentials.
2. Add a `Username with password` credential.
3. Use the credential ID in `DOCKER_CREDENTIALS_ID`.

## Deployment behavior

- `DEPLOY_PROFILE=core` deploys default services from `docker-compose.core.yml`.
- `DEPLOY_PROFILE=full` deploys with `--profile full` (adds notification/admin services).

The deploy stage runs on the same Jenkins agent machine. For remote deployment, add an SSH-based deploy stage or run this pipeline on the target host.

## Webhook trigger (recommended)

For GitHub:

1. In Jenkins job config, enable `GitHub hook trigger for GITScm polling` (or equivalent webhook trigger plugin option).
2. In GitHub repo settings, add webhook:
   - Payload URL: `http(s)://<jenkins-host>/github-webhook/`
   - Content type: `application/json`
   - Events: `Just the push event` (and PR events if needed)

## Notes

- Backend test reports are published from `backend/**/target/surefire-reports/*.xml`.
- Frontend tests use `vitest` in non-watch mode.
- If your registry namespace differs from `careerbridge/*`, update image names in `Jenkinsfile`.
- If the pipeline stops at `Validate Toolchain` with a missing `mvn` or `docker` error, the Jenkins agent itself is missing the tool. Install it on that node or run the job on a different labeled worker.
