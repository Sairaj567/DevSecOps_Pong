package com.devsecops.ponggame.model;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Represents a game room for multiplayer Pong
 */
public class GameRoom {
    private final String roomCode;
    private String player1SessionId;
    private String player2SessionId;
    private String player1Name;
    private String player2Name;
    private GameState gameState;
    private long createdAt;
    private AtomicLong player1LastPing;
    private AtomicLong player2LastPing;
    private AtomicLong player1Latency;
    private AtomicLong player2Latency;

    public GameRoom(String roomCode) {
        this.roomCode = roomCode;
        this.gameState = new GameState();
        this.createdAt = System.currentTimeMillis();
        this.player1LastPing = new AtomicLong(0);
        this.player2LastPing = new AtomicLong(0);
        this.player1Latency = new AtomicLong(0);
        this.player2Latency = new AtomicLong(0);
    }

    public String getRoomCode() {
        return roomCode;
    }

    public boolean isFull() {
        return player1SessionId != null && player2SessionId != null;
    }

    public boolean isEmpty() {
        return player1SessionId == null && player2SessionId == null;
    }

    public int getPlayerCount() {
        int count = 0;
        if (player1SessionId != null) count++;
        if (player2SessionId != null) count++;
        return count;
    }

    public int addPlayer(String sessionId, String playerName) {
        if (player1SessionId == null) {
            player1SessionId = sessionId;
            player1Name = playerName;
            return 1;
        } else if (player2SessionId == null) {
            player2SessionId = sessionId;
            player2Name = playerName;
            return 2;
        }
        return -1; // Room full
    }

    public void removePlayer(String sessionId) {
        if (sessionId.equals(player1SessionId)) {
            player1SessionId = null;
            player1Name = null;
        } else if (sessionId.equals(player2SessionId)) {
            player2SessionId = null;
            player2Name = null;
        }
    }

    public int getPlayerNumber(String sessionId) {
        if (sessionId.equals(player1SessionId)) return 1;
        if (sessionId.equals(player2SessionId)) return 2;
        return -1;
    }

    public String getOpponentSessionId(String sessionId) {
        if (sessionId.equals(player1SessionId)) return player2SessionId;
        if (sessionId.equals(player2SessionId)) return player1SessionId;
        return null;
    }

    public String getPlayer1SessionId() { return player1SessionId; }
    public String getPlayer2SessionId() { return player2SessionId; }
    public String getPlayer1Name() { return player1Name; }
    public String getPlayer2Name() { return player2Name; }
    public GameState getGameState() { return gameState; }
    public long getCreatedAt() { return createdAt; }
    
    public void setPlayer1Latency(long latency) { player1Latency.set(latency); }
    public void setPlayer2Latency(long latency) { player2Latency.set(latency); }
    public long getPlayer1Latency() { return player1Latency.get(); }
    public long getPlayer2Latency() { return player2Latency.get(); }
    
    public void updatePing(int playerNumber, long timestamp) {
        if (playerNumber == 1) player1LastPing.set(timestamp);
        else if (playerNumber == 2) player2LastPing.set(timestamp);
    }
}
