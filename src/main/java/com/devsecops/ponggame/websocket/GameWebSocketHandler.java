package com.devsecops.ponggame.websocket;

import com.devsecops.ponggame.config.PrometheusMetricsConfig;
import com.devsecops.ponggame.model.GameRoom;
import com.devsecops.ponggame.model.GameState;
import com.devsecops.ponggame.service.GameRoomService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket Handler for real-time Pong multiplayer
 */
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(GameWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Autowired
    private GameRoomService gameRoomService;
    
    @Autowired(required = false)
    private PrometheusMetricsConfig metricsConfig;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        logger.info("WebSocket connected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode json = objectMapper.readTree(message.getPayload());
            if (json == null || !json.has("type")) {
                logger.warn("Message missing type field");
                return;
            }
            String type = json.get("type").asText();

            switch (type) {
                case "create_room":
                    handleCreateRoom(session, json);
                    break;
                case "join_room":
                    handleJoinRoom(session, json);
                    break;
                case "paddle_move":
                    handlePaddleMove(session, json);
                    break;
                case "game_start":
                    handleGameStart(session);
                    break;
                case "game_state":
                    handleGameState(session, json);
                    break;
                case "ping":
                    handlePing(session, json);
                    break;
                case "score_update":
                    handleScoreUpdate(session, json);
                    break;
                case "game_over":
                    handleGameOver(session, json);
                    break;
                case "chat":
                    handleChat(session, json);
                    break;
                case "spawn_powerup":
                    handleSpawnPowerup(session, json);
                    break;
                case "collect_powerup":
                    handleCollectPowerup(session, json);
                    break;
                default:
                    logger.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            logger.error("Error handling message: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            // Don't rethrow - keep connection alive
        }
    }

    private void handleCreateRoom(WebSocketSession session, JsonNode json) throws IOException {
        String playerName = json.has("playerName") ? json.get("playerName").asText() : "Player 1";
        
        GameRoom room = gameRoomService.createRoom();
        room.addPlayer(session.getId(), playerName);
        gameRoomService.registerSession(session.getId(), room.getRoomCode());
        
        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", "room_created");
        response.put("roomCode", room.getRoomCode());
        response.put("playerNumber", 1);
        response.put("playerName", playerName);
        
        sendMessage(session, response.toString());
        logger.info("Room created: {} by {}", room.getRoomCode(), playerName);
    }

    private void handleJoinRoom(WebSocketSession session, JsonNode json) throws IOException {
        String roomCode = json.get("roomCode").asText().toUpperCase();
        String playerName = json.has("playerName") ? json.get("playerName").asText() : "Player 2";
        
        GameRoom room = gameRoomService.getRoom(roomCode);
        
        if (room == null) {
            sendError(session, "Room not found: " + roomCode);
            return;
        }
        
        if (room.isFull()) {
            sendError(session, "Room is full");
            return;
        }
        
        int playerNumber = room.addPlayer(session.getId(), playerName);
        gameRoomService.registerSession(session.getId(), roomCode);
        
        // Send confirmation to joining player
        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", "room_joined");
        response.put("roomCode", roomCode);
        response.put("playerNumber", playerNumber);
        response.put("playerName", playerName);
        response.put("opponentName", room.getPlayer1Name());
        sendMessage(session, response.toString());
        
        // Notify player 1 that player 2 joined
        String player1SessionId = room.getPlayer1SessionId();
        if (player1SessionId != null) {
            WebSocketSession player1Session = sessions.get(player1SessionId);
            if (player1Session != null && player1Session.isOpen()) {
                ObjectNode notification = objectMapper.createObjectNode();
                notification.put("type", "opponent_joined");
                notification.put("opponentName", playerName);
                notification.put("roomFull", true);
                sendMessage(player1Session, notification.toString());
            }
        }
        
        logger.info("Player {} joined room {}", playerName, roomCode);
    }

    private void handlePaddleMove(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null || !room.isFull()) return;
        
        double paddleY = json.get("paddleY").asDouble();
        int playerNumber = room.getPlayerNumber(session.getId());
        long timestamp = System.currentTimeMillis();
        
        // Update game state
        GameState state = room.getGameState();
        if (playerNumber == 1) {
            state.setPlayer1Y(paddleY);
        } else {
            state.setPlayer2Y(paddleY);
        }
        
        // Forward to opponent
        String opponentSessionId = room.getOpponentSessionId(session.getId());
        WebSocketSession opponentSession = sessions.get(opponentSessionId);
        
        if (opponentSession != null && opponentSession.isOpen()) {
            ObjectNode message = objectMapper.createObjectNode();
            message.put("type", "opponent_paddle");
            message.put("paddleY", paddleY);
            message.put("timestamp", timestamp);
            sendMessage(opponentSession, message.toString());
        }
    }

    private void handleGameStart(WebSocketSession session) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null || !room.isFull()) {
            sendError(session, "Cannot start: Room not full");
            return;
        }
        
        room.getGameState().setRunning(true);
        room.getGameState().reset();
        
        // Track metrics
        if (metricsConfig != null) {
            metricsConfig.incrementGamesStarted();
        }
        
        // Notify both players
        ObjectNode message = objectMapper.createObjectNode();
        message.put("type", "game_started");
        message.put("timestamp", System.currentTimeMillis());
        
        broadcastToRoom(room, message.toString());
        logger.info("Game started in room {}", room.getRoomCode());
    }

    private void handleGameState(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null || !room.isFull()) return;
        
        int playerNumber = room.getPlayerNumber(session.getId());
        
        // Only player 1 controls the ball (authoritative)
        if (playerNumber == 1) {
            // Validate all required fields exist
            if (!json.has("ballX") || !json.has("ballY") || !json.has("ballDx") || !json.has("ballDy")) {
                return;
            }
            
            GameState state = room.getGameState();
            if (state == null) return;
            
            state.setBallX(json.get("ballX").asDouble());
            state.setBallY(json.get("ballY").asDouble());
            state.setBallDx(json.get("ballDx").asDouble());
            state.setBallDy(json.get("ballDy").asDouble());
            state.setLastUpdate(System.currentTimeMillis());
            
            // Forward ball state to player 2
            String player2SessionId = room.getPlayer2SessionId();
            if (player2SessionId == null) return;
            
            WebSocketSession player2Session = sessions.get(player2SessionId);
            
            if (player2Session != null && player2Session.isOpen()) {
                ObjectNode message = objectMapper.createObjectNode();
                message.put("type", "ball_state");
                message.put("ballX", state.getBallX());
                message.put("ballY", state.getBallY());
                message.put("ballDx", state.getBallDx());
                message.put("ballDy", state.getBallDy());
                message.put("timestamp", state.getLastUpdate());
                sendMessage(player2Session, message.toString());
            }
        }
    }

    private void handlePing(WebSocketSession session, JsonNode json) throws IOException {
        long clientTimestamp = json.get("timestamp").asLong();
        long serverTimestamp = System.currentTimeMillis();
        
        // Get client-measured RTT if provided (from previous pong response)
        long clientRtt = json.has("rtt") ? json.get("rtt").asLong() : 0;
        
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room != null) {
            int playerNumber = room.getPlayerNumber(session.getId());
            
            // Store the client's measured RTT
            if (playerNumber == 1) {
                room.setPlayer1Latency(clientRtt);
            } else {
                room.setPlayer2Latency(clientRtt);
            }
        }
        
        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", "pong");
        response.put("clientTimestamp", clientTimestamp);
        response.put("serverTimestamp", serverTimestamp);
        
        if (room != null) {
            response.put("player1Latency", room.getPlayer1Latency());
            response.put("player2Latency", room.getPlayer2Latency());
        }
        
        sendMessage(session, response.toString());
    }

    private void handleScoreUpdate(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null) return;
        
        int scorer = json.get("scorer").asInt();
        GameState state = room.getGameState();
        
        if (scorer == 1) {
            state.incrementPlayer1Score();
        } else {
            state.incrementPlayer2Score();
        }
        
        // Broadcast score to both players
        ObjectNode message = objectMapper.createObjectNode();
        message.put("type", "score_updated");
        message.put("player1Score", state.getPlayer1Score());
        message.put("player2Score", state.getPlayer2Score());
        message.put("scorer", scorer);
        
        broadcastToRoom(room, message.toString());
    }

    private void handleGameOver(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null) return;
        
        int winner = json.get("winner").asInt();
        room.getGameState().setRunning(false);
        
        // Track metrics
        if (metricsConfig != null) {
            metricsConfig.incrementGamesCompleted();
            metricsConfig.incrementPlayerWin(winner);
        }
        
        ObjectNode message = objectMapper.createObjectNode();
        message.put("type", "game_ended");
        message.put("winner", winner);
        message.put("player1Score", room.getGameState().getPlayer1Score());
        message.put("player2Score", room.getGameState().getPlayer2Score());
        
        broadcastToRoom(room, message.toString());
        logger.info("Game ended in room {}. Winner: Player {}", room.getRoomCode(), winner);
    }

    // ============================================
    // Chat Handler
    // ============================================
    private void handleChat(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null) return;
        
        // Track metrics
        if (metricsConfig != null) {
            metricsConfig.incrementChatMessages();
        }
        
        String sender = json.has("sender") ? json.get("sender").asText() : "Unknown";
        String chatMessage = json.has("message") ? json.get("message").asText() : "";
        
        // Sanitize message (basic)
        chatMessage = chatMessage.substring(0, Math.min(chatMessage.length(), 100));
        
        // Forward to opponent only (sender already has it)
        String opponentSessionId = room.getOpponentSessionId(session.getId());
        if (opponentSessionId != null) {
            WebSocketSession opponentSession = sessions.get(opponentSessionId);
            if (opponentSession != null && opponentSession.isOpen()) {
                ObjectNode response = objectMapper.createObjectNode();
                response.put("type", "chat_message");
                response.put("sender", sender);
                response.put("message", chatMessage);
                sendMessage(opponentSession, response.toString());
            }
        }
    }

    // ============================================
    // Power-up Handlers
    // ============================================
    private void handleSpawnPowerup(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null) return;
        
        // Only host can spawn power-ups
        if (room.getPlayerNumber(session.getId()) != 1) return;
        
        String powerupType = json.get("powerupType").asText();
        double x = json.get("x").asDouble();
        double y = json.get("y").asDouble();
        long id = json.get("id").asLong();
        
        ObjectNode message = objectMapper.createObjectNode();
        message.put("type", "powerup_spawn");
        message.put("powerupType", powerupType);
        message.put("x", x);
        message.put("y", y);
        message.put("id", id);
        
        broadcastToRoom(room, message.toString());
    }

    private void handleCollectPowerup(WebSocketSession session, JsonNode json) throws IOException {
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room == null) return;
        
        // Track metrics
        if (metricsConfig != null) {
            metricsConfig.incrementPowerupsCollected();
        }
        
        int playerNumber = room.getPlayerNumber(session.getId());
        String powerupType = json.has("powerupType") ? json.get("powerupType").asText() : "SPEED_BOOST";
        
        ObjectNode message = objectMapper.createObjectNode();
        message.put("type", "powerup_collected");
        message.put("playerNumber", playerNumber);
        message.put("powerupType", powerupType);
        
        broadcastToRoom(room, message.toString());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
        
        GameRoom room = gameRoomService.getRoomBySession(session.getId());
        if (room != null) {
            String opponentSessionId = room.getOpponentSessionId(session.getId());
            
            // Notify opponent
            if (opponentSessionId != null) {
                WebSocketSession opponentSession = sessions.get(opponentSessionId);
                if (opponentSession != null && opponentSession.isOpen()) {
                    try {
                        ObjectNode message = objectMapper.createObjectNode();
                        message.put("type", "opponent_disconnected");
                        sendMessage(opponentSession, message.toString());
                    } catch (IOException e) {
                        logger.error("Error notifying opponent of disconnect", e);
                    }
                }
            }
            
            gameRoomService.leaveRoom(session.getId());
        }
        
        logger.info("WebSocket disconnected: {}", session.getId());
    }

    private void sendMessage(WebSocketSession session, String message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }

    private void sendError(WebSocketSession session, String error) throws IOException {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", "error");
        response.put("message", error);
        sendMessage(session, response.toString());
    }

    private void broadcastToRoom(GameRoom room, String message) throws IOException {
        String p1Id = room.getPlayer1SessionId();
        String p2Id = room.getPlayer2SessionId();
        
        if (p1Id != null) {
            WebSocketSession p1 = sessions.get(p1Id);
            if (p1 != null && p1.isOpen()) {
                sendMessage(p1, message);
            }
        }
        
        if (p2Id != null) {
            WebSocketSession p2 = sessions.get(p2Id);
            if (p2 != null && p2.isOpen()) {
                sendMessage(p2, message);
            }
        }
    }
}
