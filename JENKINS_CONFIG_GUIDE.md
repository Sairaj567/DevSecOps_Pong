# =============================================================
# DevSecOps Pong Game - Jenkins Pipeline Configuration Guide
# =============================================================

## 📋 Table of Contents
1. [Jenkins Credentials Setup](#jenkins-credentials-setup)
2. [Jenkins Global Tool Configuration](#jenkins-global-tool-configuration)
3. [Jenkins Plugin Requirements](#jenkins-plugin-requirements)
4. [SonarQube Configuration](#sonarqube-configuration)
5. [Nexus Configuration](#nexus-configuration)
6. [Docker Configuration](#docker-configuration)
7. [Email Configuration](#email-configuration)
8. [Prometheus & Grafana Setup](#prometheus--grafana-setup)

---

## 🔐 Jenkins Credentials Setup

Navigate to: **Manage Jenkins → Credentials → System → Global credentials**

| Credential ID       | Type                    | Description                          | Required Fields                     |
|---------------------|-------------------------|--------------------------------------|-------------------------------------|
| `git-cred`          | Username with password  | GitHub/GitLab authentication         | Username, Password/Token            |
| `sonar-token`       | Secret text             | SonarQube authentication token       | Secret (SonarQube token)            |
| `docker-cred`       | Username with password  | DockerHub authentication             | Username, Password/Access Token     |
| `nexus-cred`        | Username with password  | Nexus repository authentication      | Username, Password                  |
| `email-cred`        | Username with password  | SMTP email authentication            | Email, App Password                 |

### How to Create Each Credential:

#### 1. Git Credentials (`git-cred`)
```
Kind: Username with password
Scope: Global
Username: your-github-username
Password: your-personal-access-token (not password!)
ID: git-cred
Description: GitHub Credentials for Pong Game
```

#### 2. SonarQube Token (`sonar-token`)
```
Kind: Secret text
Scope: Global
Secret: squ_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ID: sonar-token
Description: SonarQube Authentication Token
```
*Generate from: SonarQube → My Account → Security → Generate Tokens*

#### 3. Docker Hub Credentials (`docker-cred`)
```
Kind: Username with password
Scope: Global
Username: your-dockerhub-id
Password: your-dockerhub-access-token
ID: docker-cred
Description: DockerHub Registry Credentials
```

#### 4. Nexus Credentials (`nexus-cred`)
```
Kind: Username with password
Scope: Global
Username: admin (or your nexus user)
Password: your-nexus-password
ID: nexus-cred
Description: Nexus Repository Credentials
```

---

## 🛠️ Jenkins Global Tool Configuration

Navigate to: **Manage Jenkins → Tools**

### JDK Installation
```
Name: jdk17
☑ Install automatically
  - Installer: Adoptium.net
  - Version: jdk-17.0.x+x
```

### Maven Installation
```
Name: maven3
☑ Install automatically
  - Version: 3.9.6
```

### SonarQube Scanner
```
Name: sonar-scanner
☑ Install automatically
  - Version: SonarQube Scanner 5.x
```

### Docker Installation
```
Name: docker
☑ Install automatically
  - Docker version: latest
```

---

## 🔌 Jenkins Plugin Requirements

Install these plugins from: **Manage Jenkins → Plugins → Available plugins**

| Plugin Name                        | Purpose                                    |
|------------------------------------|--------------------------------------------|
| Pipeline                           | Declarative Pipeline support               |
| Git                                | Git SCM integration                        |
| Maven Integration                  | Maven build support                        |
| SonarQube Scanner                  | SonarQube analysis integration             |
| Docker Pipeline                    | Docker build/push support                  |
| Docker Commons                     | Docker common utilities                    |
| Config File Provider               | Maven settings.xml management              |
| Pipeline Utility Steps             | Pipeline utilities                         |
| Email Extension                    | Enhanced email notifications               |
| Prometheus metrics                 | Prometheus monitoring                      |
| Blue Ocean                         | Modern pipeline visualization              |
| Pipeline Stage View                | Stage visualization                        |

---

## 🔍 SonarQube Configuration

### In SonarQube:
1. Create a new project:
   - Project Key: `PongGame`
   - Project Name: `Pong Game`
   
2. Generate token:
   - Go to: **My Account → Security → Generate Tokens**
   - Name: `jenkins-token`
   - Copy the generated token

3. Configure Quality Gate:
   - Go to: **Quality Gates**
   - Create or modify a gate with your desired rules

### In Jenkins:
Navigate to: **Manage Jenkins → System → SonarQube servers**

```
Name: sonar
Server URL: http://your-sonarqube-server:9000
Server authentication token: sonar-token (credential ID)
```

---

## 📦 Nexus Configuration

### In Nexus:
1. Create repositories:
   - `maven-releases` (hosted, release)
   - `maven-snapshots` (hosted, snapshot)

2. Create deployment user or use admin

### Maven Settings (Jenkins)
Navigate to: **Manage Jenkins → Managed files → Add → Global Maven settings.xml**

**ID:** `global-maven-settings`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 
          https://maven.apache.org/xsd/settings-1.2.0.xsd">
    
    <servers>
        <server>
            <id>nexus-releases</id>
            <username>admin</username>
            <password>your-nexus-password</password>
        </server>
        <server>
            <id>nexus-snapshots</id>
            <username>admin</username>
            <password>your-nexus-password</password>
        </server>
    </servers>
    
    <mirrors>
        <mirror>
            <id>nexus</id>
            <mirrorOf>*</mirrorOf>
            <url>http://your-nexus-server:8081/repository/maven-public/</url>
        </mirror>
    </mirrors>
    
</settings>
```

---

## 🐳 Docker Configuration

### Install Docker on Jenkins Server:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io -y
sudo usermod -aG docker jenkins
sudo systemctl restart docker
sudo systemctl restart jenkins
```

### Install Trivy:
```bash
# Ubuntu/Debian
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy -y
```

---

## 📧 Email Configuration

Navigate to: **Manage Jenkins → System → Extended E-mail Notification**

```
SMTP server: smtp.gmail.com (or your SMTP)
SMTP Port: 465
☑ Use SSL
Credentials: email-cred
Default Content Type: HTML (text/html)
Default Recipients: devops-team@yourcompany.com
```

### Gmail App Password:
1. Enable 2FA on Google Account
2. Go to: **Google Account → Security → App passwords**
3. Generate app password for "Mail"
4. Use this as the SMTP password

---

## 📊 Prometheus & Grafana Setup

### Jenkins Prometheus Plugin Configuration:
Navigate to: **Manage Jenkins → System → Prometheus**

```
☑ Collect metrics
Path: /prometheus
Default Namespace: default
Collecting metrics period: 120 seconds
```

### Prometheus Configuration (prometheus.yml):
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'jenkins'
    metrics_path: '/prometheus'
    static_configs:
      - targets: ['your-jenkins-server:8080']
```

### Grafana Dashboard:
1. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   
2. Import Jenkins dashboard:
   - Dashboard ID: `9964` (Jenkins Performance and Health Overview)
   - Or: `12646` (Jenkins Statistics)

---

## ✅ Pre-Flight Checklist

Before running the pipeline, verify:

- [ ] All credentials created with correct IDs
- [ ] JDK 17 configured as `jdk17`
- [ ] Maven configured as `maven3`
- [ ] SonarQube Scanner configured as `sonar-scanner`
- [ ] Docker installed and Jenkins user in docker group
- [ ] Trivy installed on Jenkins server
- [ ] SonarQube server configured as `sonar`
- [ ] Global Maven settings with Nexus credentials
- [ ] Email plugin configured with SMTP
- [ ] All required plugins installed

---

## 🚀 Running the Pipeline

1. Create a new Pipeline job in Jenkins
2. Configure Pipeline:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: `https://github.com/your-username/pong-game.git`
   - Credentials: `git-cred`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. Save and click "Build Now"

---

## 📁 Project Structure

```
pong-game/
├── Jenkinsfile                          # CI/CD Pipeline
├── Dockerfile                           # Docker image build
├── pom.xml                              # Maven configuration
├── JENKINS_CONFIG_GUIDE.md              # This file
└── src/
    ├── main/
    │   ├── java/com/devsecops/ponggame/
    │   │   ├── PongGameApplication.java
    │   │   └── controller/
    │   │       ├── GameController.java
    │   │       └── GameApiController.java
    │   └── resources/
    │       ├── application.properties
    │       ├── templates/
    │       │   └── index.html
    │       └── static/
    │           ├── css/style.css
    │           └── js/pong.js
    └── test/
        └── java/com/devsecops/ponggame/
            ├── PongGameApplicationTests.java
            └── controller/
                └── GameApiControllerTest.java
```

---

## 📞 Troubleshooting

### Common Issues:

1. **Docker permission denied**
   ```bash
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

2. **SonarQube Quality Gate timeout**
   - Increase timeout in Jenkinsfile
   - Check SonarQube webhook configuration

3. **Nexus deploy fails**
   - Verify server IDs match in pom.xml and settings.xml
   - Check Nexus user permissions

4. **Trivy command not found**
   - Install Trivy on Jenkins server
   - Or use Docker: `docker run aquasec/trivy`

---

*Generated for DevSecOps Pong Game Pipeline*
