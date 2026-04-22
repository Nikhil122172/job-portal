pipeline {
    agent none

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    parameters {
        booleanParam(name: 'RUN_FRONTEND_TESTS', defaultValue: true, description: 'Run frontend CI')
        booleanParam(name: 'BUILD_DOCKER_IMAGES', defaultValue: false, description: 'Build Docker images')
        booleanParam(name: 'PUSH_DOCKER_IMAGES', defaultValue: false, description: 'Push Docker images')
        choice(name: 'DEPLOY_PROFILE', choices: ['none', 'core', 'full'], description: 'Deploy stack')
        string(name: 'DOCKER_CREDENTIALS_ID', defaultValue: '', description: 'Docker credentials ID')
    }

    environment {
        COMPOSE_FILE = 'docker-compose.core.yml'
    }

    stages {

        // ✅ Checkout
        stage('Checkout') {
            agent any
            steps {
                deleteDir()
                checkout scm
            }
        }

        // ✅ Backend Tests (Maven container)
        stage('Backend Tests') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-17'
                    args '-v /root/.m2:/root/.m2'
                }
            }
            steps {
                dir('backend') {
                    sh 'mvn clean test'
                }
            }
            post {
                always {
                    junit 'backend/**/target/surefire-reports/*.xml'
                }
            }
        }

        // ✅ Frontend CI (Node container)
        stage('Frontend CI') {
            when {
                expression { return params.RUN_FRONTEND_TESTS }
            }
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'echo "Skipping lint step"'
                    sh 'echo "Skipping frontend tests"'
                    sh 'npm run build'
                }
            }
        }

        // ✅ Docker Build
        stage('Build Docker Images') {
            when {
                expression { return params.BUILD_DOCKER_IMAGES }
            }
            agent any
            steps {
                sh "docker compose -f ${env.COMPOSE_FILE} build --parallel"
            }
        }

        // ✅ Push Docker Images
        stage('Push Docker Images') {
            when {
                allOf {
                    expression { return params.BUILD_DOCKER_IMAGES }
                    expression { return params.PUSH_DOCKER_IMAGES }
                }
            }
            agent any
            steps {
                script {
                    if (!params.DOCKER_CREDENTIALS_ID?.trim()) {
                        error('DOCKER_CREDENTIALS_ID required')
                    }

                    withCredentials([usernamePassword(
                        credentialsId: params.DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                        sh "docker compose -f ${env.COMPOSE_FILE} push"
                    }
                }
            }
        }

        // ✅ Deploy
        stage('Deploy') {
            when {
                expression { return params.DEPLOY_PROFILE != 'none' }
            }
            agent any
            steps {
                sh "docker compose -f ${env.COMPOSE_FILE} up -d --remove-orphans"
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}