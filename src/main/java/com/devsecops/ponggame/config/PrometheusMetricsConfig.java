package com.devsecops.ponggame.config;

import com.devsecops.ponggame.service.GameRoomService;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

/**
 * Custom Prometheus metrics for the Pong game
 * Exposes game-specific metrics at /actuator/prometheus
 */
@Configuration
public class PrometheusMetricsConfig {

    private final MeterRegistry meterRegistry;
    private final GameRoomService gameRoomService;
    
    // Counters for game events
    private Counter gamesStartedCounter;
    private Counter gamesCompletedCounter;
    private Counter powerupsCollectedCounter;
    private Counter chatMessagesSentCounter;
    private Counter player1WinsCounter;
    private Counter player2WinsCounter;

    @Autowired
    public PrometheusMetricsConfig(MeterRegistry meterRegistry, GameRoomService gameRoomService) {
        this.meterRegistry = meterRegistry;
        this.gameRoomService = gameRoomService;
    }

    @PostConstruct
    public void initMetrics() {
        // Gauges (current state)
        Gauge.builder("pong_active_rooms", gameRoomService, 
                service -> service.getStats().get("activeRooms") != null ? 
                    ((Number) service.getStats().get("activeRooms")).doubleValue() : 0)
            .description("Number of active game rooms")
            .register(meterRegistry);
        
        Gauge.builder("pong_connected_players", gameRoomService,
                service -> service.getStats().get("connectedPlayers") != null ?
                    ((Number) service.getStats().get("connectedPlayers")).doubleValue() : 0)
            .description("Number of connected players")
            .register(meterRegistry);
        
        Gauge.builder("pong_active_games", gameRoomService,
                service -> service.getStats().get("activeGames") != null ?
                    ((Number) service.getStats().get("activeGames")).doubleValue() : 0)
            .description("Number of games currently in progress")
            .register(meterRegistry);

        // Counters (cumulative)
        gamesStartedCounter = Counter.builder("pong_games_started_total")
            .description("Total number of games started")
            .register(meterRegistry);
        
        gamesCompletedCounter = Counter.builder("pong_games_completed_total")
            .description("Total number of games completed")
            .register(meterRegistry);
        
        powerupsCollectedCounter = Counter.builder("pong_powerups_collected_total")
            .description("Total number of power-ups collected")
            .register(meterRegistry);
        
        chatMessagesSentCounter = Counter.builder("pong_chat_messages_total")
            .description("Total number of chat messages sent")
            .register(meterRegistry);
        
        player1WinsCounter = Counter.builder("pong_player1_wins_total")
            .description("Total wins by Player 1 (host)")
            .register(meterRegistry);
        
        player2WinsCounter = Counter.builder("pong_player2_wins_total")
            .description("Total wins by Player 2")
            .register(meterRegistry);
    }
    
    public void incrementGamesStarted() {
        gamesStartedCounter.increment();
    }
    
    public void incrementGamesCompleted() {
        gamesCompletedCounter.increment();
    }
    
    public void incrementPowerupsCollected() {
        powerupsCollectedCounter.increment();
    }
    
    public void incrementChatMessages() {
        chatMessagesSentCounter.increment();
    }
    
    public void incrementPlayerWin(int playerNumber) {
        if (playerNumber == 1) {
            player1WinsCounter.increment();
        } else {
            player2WinsCounter.increment();
        }
    }
}
