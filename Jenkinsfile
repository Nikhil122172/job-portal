def runCommand(String unixCommand, String windowsCommand = null) {
    if (isUnix()) {
        sh unixCommand
    } else {
        bat(windowsCommand ?: unixCommand)
    }
}

def commandExists(String commandName) {
    if (isUnix()) {
        return sh(script: "command -v ${commandName} >/dev/null 2>&1", returnStatus: true) == 0
    }

    return bat(script: "@where ${commandName} >NUL 2>&1", returnStatus: true) == 0
}

def requireCommand(String commandName, String installHint) {
    if (!commandExists(commandName)) {
        error("${commandName} is not available on this Jenkins agent. ${installHint}")
    }
}

def dockerImagesForProfile(String profile) {
    def coreImages = [
        'careerbridge/eureka-server:latest',
        'careerbridge/config-server:latest',
        'careerbridge/api-gateway:latest',
        'careerbridge/auth-service:latest',
        'careerbridge/job-service:latest',
        'careerbridge/application-service:latest',
        'careerbridge/file-service:latest',
        'careerbridge/frontend:latest'
    ]

    if (profile == 'full') {
        coreImages.add('careerbridge/notification-service:latest')
        coreImages.add('careerbridge/admin-service:latest')
    }

    return coreImages
}

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    parameters {
        booleanParam(name: 'RUN_FRONTEND_TESTS', defaultValue: true, description: 'Run frontend lint, tests, and build steps')
        booleanParam(name: 'BUILD_DOCKER_IMAGES', defaultValue: true, description: 'Build Docker images with docker-compose.core.yml')
        booleanParam(name: 'PUSH_DOCKER_IMAGES', defaultValue: false, description: 'Push built Docker images to registry')
        choice(name: 'DEPLOY_PROFILE', choices: ['none', 'core', 'full'], description: 'Deploy stack after CI/CD stages')
        string(name: 'DOCKER_CREDENTIALS_ID', defaultValue: '', description: 'Jenkins Username/Password credentials ID for Docker registry (required only when pushing images)')
    }

    environment {
        COMPOSE_FILE = 'docker-compose.core.yml'
        MAVEN_CLI_OPTS = '-B -ntp'
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Toolchain') {
            steps {
                script {
                    requireCommand('java', 'Install JDK 17+ on the agent or run this job on a node that already has it.')
                    requireCommand('mvn', 'Install Maven 3.9+ on the agent, or configure the job to use a node image that includes Maven.')
                    requireCommand('node', 'Install Node.js 20+ on the agent if frontend CI is enabled.')
                    requireCommand('npm', 'Install npm together with Node.js on the agent if frontend CI is enabled.')

                    if (params.BUILD_DOCKER_IMAGES || params.PUSH_DOCKER_IMAGES || params.DEPLOY_PROFILE != 'none') {
                        requireCommand('docker', 'Install Docker and Docker Compose v2 on the agent, or disable build/push/deploy parameters for this job.')
                    }

                    runCommand('java -version')
                    runCommand('mvn -version')
                    runCommand('node -v')
                    runCommand('npm -v')

                    if (commandExists('docker')) {
                        runCommand('docker version')
                    }
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    script {
                        runCommand("mvn ${env.MAVEN_CLI_OPTS} clean test")
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Frontend CI') {
            when {
                expression { return params.RUN_FRONTEND_TESTS }
            }
            steps {
                dir('frontend') {
                    script {
                        runCommand('npm ci')
                        runCommand('npm run lint')
                        runCommand('npm run test -- --run')
                        runCommand('npm run build')
                    }
                }
            }
        }

        stage('Build Docker Images') {
            when {
                expression { return params.BUILD_DOCKER_IMAGES }
            }
            steps {
                script {
                    if (params.DEPLOY_PROFILE == 'full') {
                        runCommand("docker compose -f ${env.COMPOSE_FILE} --profile full build --parallel")
                    } else {
                        runCommand("docker compose -f ${env.COMPOSE_FILE} build --parallel")
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                allOf {
                    expression { return params.BUILD_DOCKER_IMAGES }
                    expression { return params.PUSH_DOCKER_IMAGES }
                }
            }
            steps {
                script {
                    if (!params.DOCKER_CREDENTIALS_ID?.trim()) {
                        error('DOCKER_CREDENTIALS_ID is required when PUSH_DOCKER_IMAGES=true')
                    }

                    def images = dockerImagesForProfile(params.DEPLOY_PROFILE == 'full' ? 'full' : 'core')

                    withCredentials([usernamePassword(credentialsId: params.DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        runCommand('echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin', 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin')

                        images.each { image ->
                            runCommand("docker push ${image}")
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { return params.DEPLOY_PROFILE != 'none' }
            }
            steps {
                script {
                    if (params.DEPLOY_PROFILE == 'full') {
                        runCommand("docker compose -f ${env.COMPOSE_FILE} --profile full up -d --remove-orphans")
                    } else {
                        runCommand("docker compose -f ${env.COMPOSE_FILE} up -d --remove-orphans")
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs and test reports.'
        }
        always {
            script {
                if (commandExists('docker')) {
                    runCommand('docker logout || true', 'docker logout')
                }
            }
        }
    }
}
