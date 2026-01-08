pipeline {
    agent any
    
    tools {
        jdk 'jdk17'
        maven 'maven3'
    }
    
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_IMAGE = 'your-dockerhub-id/pong-game'
        DOCKER_TAG = 'latest'
    }
    
    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main', 
                    credentialsId: 'git-creds', 
                    url: 'https://github.com/Sairaj567/DevSecOps_Pong.git'
            }
        }
        
        stage('Compile') {
            steps {
                sh 'mvn compile'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('File System Scan') {
            steps {
                sh 'trivy fs --format table -o trivy-fs-report.txt .'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh '''
                        $SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=PongGame \
                        -Dsonar.projectKey=PongGame \
                        -Dsonar.java.binaries=target/classes
                    '''
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'sonar-token'
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn package -DskipTests'
            }
        }
        
        stage('Publish to Nexus') {
            steps {
                withMaven(globalMavenSettingsConfig: 'global-maven-settings', jdk: 'jdk17', maven: 'maven3') {
                    sh 'mvn deploy -DskipTests'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', toolName: 'docker') {
                        sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                    }
                }
            }
        }
        
        stage('Docker Image Scan') {
            steps {
                sh "trivy image --format table -o trivy-image-report.txt ${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', toolName: 'docker') {
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    }
                }
            }
        }
        
        stage('Deploy to Container') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', toolName: 'docker') {
                        sh '''
                            docker stop pong-game-container || true
                            docker rm pong-game-container || true
                            docker run -d --name pong-game-container -p 8080:8080 ${DOCKER_IMAGE}:${DOCKER_TAG}
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.result ?: 'UNKNOWN'
                def bannerColor = pipelineStatus.toUpperCase() == 'SUCCESS' ? 'green' : 'red'
                def statusEmoji = pipelineStatus.toUpperCase() == 'SUCCESS' ? '✅' : '❌'
                
                def body = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background-color: ${bannerColor}; color: white; padding: 30px; text-align: center; }
                        .header h1 { margin: 0; font-size: 28px; }
                        .header p { margin: 10px 0 0 0; opacity: 0.9; }
                        .content { padding: 30px; }
                        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; background-color: ${bannerColor}; color: white; font-weight: bold; margin-bottom: 20px; }
                        .details { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
                        .details table { width: 100%; border-collapse: collapse; }
                        .details td { padding: 10px 0; border-bottom: 1px solid #e9ecef; }
                        .details td:first-child { font-weight: bold; color: #495057; width: 40%; }
                        .details tr:last-child td { border-bottom: none; }
                        .footer { background-color: #343a40; color: #adb5bd; padding: 20px; text-align: center; font-size: 12px; }
                        .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                        .attachments { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin-top: 20px; }
                        .attachments h3 { margin: 0 0 10px 0; color: #856404; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${statusEmoji} Pipeline ${pipelineStatus}</h1>
                            <p>DevSecOps Pipeline Notification</p>
                        </div>
                        <div class="content">
                            <span class="status-badge">${pipelineStatus}</span>
                            <div class="details">
                                <table>
                                    <tr>
                                        <td>Job Name:</td>
                                        <td>${jobName}</td>
                                    </tr>
                                    <tr>
                                        <td>Build Number:</td>
                                        <td>#${buildNumber}</td>
                                    </tr>
                                    <tr>
                                        <td>Build URL:</td>
                                        <td><a href="${BUILD_URL}">${BUILD_URL}</a></td>
                                    </tr>
                                    <tr>
                                        <td>Docker Image:</td>
                                        <td>${DOCKER_IMAGE}:${DOCKER_TAG}</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="attachments">
                                <h3>📎 Attached Security Reports:</h3>
                                <ul>
                                    <li>trivy-fs-report.txt (Filesystem Scan)</li>
                                    <li>trivy-image-report.txt (Docker Image Scan)</li>
                                </ul>
                            </div>
                            <center>
                                <a href="${BUILD_URL}console" class="btn">View Console Output</a>
                            </center>
                        </div>
                        <div class="footer">
                            <p>This is an automated email from Jenkins DevSecOps Pipeline</p>
                            <p>Pong Game Application - Build ${buildNumber}</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                emailext (
                    subject: "${statusEmoji} Pipeline ${pipelineStatus}: ${jobName} - Build #${buildNumber}",
                    body: body,
                    to: 'devops-team@yourcompany.com',
                    from: 'jenkins@yourcompany.com',
                    replyTo: 'devops-team@yourcompany.com',
                    mimeType: 'text/html',
                    attachmentsPattern: 'trivy-fs-report.txt,trivy-image-report.txt'
                )
            }
        }
        
        success {
            echo 'Pipeline completed successfully!'
        }
        
        failure {
            echo 'Pipeline failed! Check the logs for details.'
        }
        
        cleanup {
            cleanWs()
        }
    }
}
