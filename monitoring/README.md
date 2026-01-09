# 📊 Monitoring Stack for DevSecOps Pong

This folder contains Prometheus + Grafana configuration for monitoring the Pong game.

## 🚀 Quick Start

### 1. Start the Monitoring Stack
```bash
cd monitoring
docker-compose up -d
```

### 2. Access the Dashboards
| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://140.245.23.142:3000 | admin / pong123 |
| **Prometheus** | http://140.245.23.142:9090 | - |

### 3. View the Pong Dashboard
1. Open Grafana at http://140.245.23.142:3000
2. Login with `admin` / `pong123`
3. Navigate to **Dashboards** → **Pong Game** folder
4. Click on **🎮 DevSecOps Pong - Game Dashboard**

## 📁 Folder Structure
```
monitoring/
├── docker-compose.yml          # Docker Compose for Prometheus + Grafana
├── prometheus/
│   ├── prometheus.yml          # Prometheus scrape configuration
│   └── alerts.yml              # Alert rules
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml # Auto-configure Prometheus
    │   └── dashboards/
    │       └── dashboards.yml  # Auto-load dashboards
    └── dashboards/
        └── pong-dashboard.json # Pre-built Pong dashboard
```

## 📈 Available Metrics

### Game Metrics (Custom)
| Metric | Description |
|--------|-------------|
| `pong_active_rooms` | Current number of active game rooms |
| `pong_connected_players` | Current number of connected players |
| `pong_active_games` | Number of games in progress |
| `pong_games_started_total` | Total games started |
| `pong_games_completed_total` | Total games completed |
| `pong_powerups_collected_total` | Total power-ups collected |
| `pong_chat_messages_total` | Total chat messages sent |
| `pong_player1_wins_total` | Total wins by Player 1 (host) |
| `pong_player2_wins_total` | Total wins by Player 2 |

### JVM Metrics (Spring Boot Actuator)
| Metric | Description |
|--------|-------------|
| `jvm_memory_used_bytes` | JVM memory usage |
| `jvm_threads_live_threads` | Number of live threads |
| `process_uptime_seconds` | Application uptime |

## 🚨 Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| ApplicationDown | App unreachable for 1 min | Critical |
| HighMemoryUsage | Heap > 85% for 5 min | Warning |
| NoPlayersConnected | 0 players for 5 min | Warning |
| NoActiveGames | 0 games for 10 min | Info |
| UnusualGameActivity | >10 games/min | Warning |

## 🛠️ Commands

```bash
# Start monitoring
docker-compose up -d

# View logs
docker-compose logs -f

# Stop monitoring
docker-compose down

# Stop and remove data
docker-compose down -v
```

## 🔧 Configuration

### Change Grafana Password
Edit `docker-compose.yml`:
```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=your-new-password
```

### Add More Scrape Targets
Edit `prometheus/prometheus.yml` and add new `static_configs`.

### Customize Alerts
Edit `prometheus/alerts.yml` to add or modify alert rules.
