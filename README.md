# 🎮 DevSecOps Pong Game

A Java Spring Boot web application serving an HTML5 Pong game, built with a complete DevSecOps CI/CD pipeline using Jenkins.

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.1-brightgreen)
![Java](https://img.shields.io/badge/Java-17-orange)
![Jenkins](https://img.shields.io/badge/Jenkins-Pipeline-blue)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![SonarQube](https://img.shields.io/badge/SonarQube-SAST-yellow)
![Trivy](https://img.shields.io/badge/Trivy-Security-red)

## 🚀 Features

- **HTML5 Canvas Pong Game** - Classic arcade game with modern styling
- **Spring Boot Backend** - RESTful API with health checks and metrics
- **Complete CI/CD Pipeline** - Automated build, test, scan, and deploy
- **Security Scanning** - Trivy filesystem and container image scanning
- **Code Quality** - SonarQube analysis with quality gates
- **Container Ready** - Multi-stage Docker build with security hardening
- **Monitoring Ready** - Prometheus metrics exposed for Grafana

## 📋 Tech Stack

| Category | Technology |
|----------|------------|
| Backend | Spring Boot 3.2.1 |
| Language | Java 17 |
| Build Tool | Maven |
| CI/CD | Jenkins (Declarative Pipeline) |
| SAST | SonarQube |
| Security | Trivy |
| Artifacts | Nexus |
| Container | Docker |
| Registry | DockerHub |
| Monitoring | Prometheus + Grafana |

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move paddle up |
| `S` / `↓` | Move paddle down |

**Objective:** First player to score 10 points wins!

## 🏃 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/pong-game.git
cd pong-game

# Build and run
mvn spring-boot:run

# Access the game
open http://localhost:8080
```

### Docker

```bash
# Build the image
docker build -t pong-game:latest .

# Run the container
docker run -d -p 8080:8080 --name pong-game pong-game:latest

# Access the game
open http://localhost:8080
```

## 📁 Project Structure

```
pong-game/
├── Jenkinsfile                 # CI/CD Pipeline definition
├── Dockerfile                  # Multi-stage Docker build
├── pom.xml                     # Maven configuration
├── JENKINS_CONFIG_GUIDE.md     # Jenkins setup instructions
└── src/
    ├── main/
    │   ├── java/.../
    │   │   ├── PongGameApplication.java
    │   │   └── controller/
    │   │       ├── GameController.java
    │   │       └── GameApiController.java
    │   └── resources/
    │       ├── application.properties
    │       ├── templates/index.html
    │       └── static/
    │           ├── css/style.css
    │           └── js/pong.js
    └── test/...
```

## 🔧 Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Git Checkout                                                     │
│  2. Compile                                                          │
│  3. Test                                                             │
│  4. File System Scan (Trivy)                                        │
│  5. SonarQube Analysis                                              │
│  6. Quality Gate                                                     │
│  7. Build (mvn package)                                             │
│  8. Publish to Nexus                                                │
│  9. Docker Build                                                     │
│ 10. Docker Image Scan (Trivy)                                       │
│ 11. Push Docker Image                                               │
│ 12. Deploy to Container                                             │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔐 Jenkins Credentials Required

| ID | Type | Purpose |
|----|------|---------|
| `git-cred` | Username/Password | GitHub authentication |
| `sonar-token` | Secret text | SonarQube token |
| `docker-cred` | Username/Password | DockerHub |
| `nexus-cred` | Username/Password | Nexus repository |

See [JENKINS_CONFIG_GUIDE.md](JENKINS_CONFIG_GUIDE.md) for detailed setup instructions.

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Pong game page |
| `/api/info` | GET | Application info |
| `/api/health` | GET | Health check |
| `/actuator/health` | GET | Spring Actuator health |
| `/actuator/prometheus` | GET | Prometheus metrics |

## 🛡️ Security Features

- **Multi-stage Docker build** - Minimal attack surface
- **Non-root container user** - Principle of least privilege
- **Alpine-based images** - Smaller image size, fewer vulnerabilities
- **Trivy scanning** - Both filesystem and image vulnerability scanning
- **SonarQube analysis** - Code quality and security hotspot detection

## 📈 Monitoring

The application exposes Prometheus metrics at `/actuator/prometheus`:

- JVM metrics (memory, GC, threads)
- HTTP request metrics
- Custom application metrics

## 📝 License

This project is for educational and demonstration purposes.

---

**Built with ❤️ for DevSecOps learning**
