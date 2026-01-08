package com.devsecops.ponggame.service;

import com.devsecops.ponggame.model.GameRoom;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for managing game rooms
 */
@Service
public class GameRoomService {
    
    private final Map<String, GameRoom> rooms = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToRoom = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    
    private final AtomicLong totalRoomsCreated = new AtomicLong(0);
    private final AtomicLong activeGames = new AtomicLong(0);

    /**
     * Create a new game room with a unique code
     */
    public GameRoom createRoom() {
        String roomCode = generateRoomCode();
        while (rooms.containsKey(roomCode)) {
            roomCode = generateRoomCode();
        }
        
        GameRoom room = new GameRoom(roomCode);
        rooms.put(roomCode, room);
        totalRoomsCreated.incrementAndGet();
        return room;
    }

    /**
     * Join an existing room
     */
    public GameRoom joinRoom(String roomCode, String sessionId, String playerName) {
        GameRoom room = rooms.get(roomCode.toUpperCase());
        if (room == null) {
            return null; // Room not found
        }
        
        if (room.isFull()) {
            return null; // Room is full
        }
        
        int playerNumber = room.addPlayer(sessionId, playerName);
        if (playerNumber > 0) {
            sessionToRoom.put(sessionId, roomCode.toUpperCase());
            if (room.isFull()) {
                activeGames.incrementAndGet();
            }
        }
        
        return room;
    }

    /**
     * Get room by code
     */
    public GameRoom getRoom(String roomCode) {
        return rooms.get(roomCode.toUpperCase());
    }

    /**
     * Get room by session ID
     */
    public GameRoom getRoomBySession(String sessionId) {
        String roomCode = sessionToRoom.get(sessionId);
        if (roomCode != null) {
            return rooms.get(roomCode);
        }
        return null;
    }

    /**
     * Register session to room mapping
     */
    public void registerSession(String sessionId, String roomCode) {
        sessionToRoom.put(sessionId, roomCode.toUpperCase());
    }

    /**
     * Remove player from room
     */
    public void leaveRoom(String sessionId) {
        String roomCode = sessionToRoom.remove(sessionId);
        if (roomCode != null) {
            GameRoom room = rooms.get(roomCode);
            if (room != null) {
                boolean wasFull = room.isFull();
                room.removePlayer(sessionId);
                
                if (wasFull) {
                    activeGames.decrementAndGet();
                }
                
                // Clean up empty rooms
                if (room.isEmpty()) {
                    rooms.remove(roomCode);
                }
            }
        }
    }

    /**
     * Generate a random 4-character room code
     */
    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
        StringBuilder code = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        return code.toString();
    }

    /**
     * Get statistics
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new ConcurrentHashMap<>();
        stats.put("totalRoomsCreated", totalRoomsCreated.get());
        stats.put("activeRooms", rooms.size());
        stats.put("activeGames", activeGames.get());
        stats.put("connectedPlayers", sessionToRoom.size());
        return stats;
    }

    /**
     * Clean up stale rooms (older than 1 hour with no activity)
     */
    public void cleanupStaleRooms() {
        long now = System.currentTimeMillis();
        long oneHour = 60 * 60 * 1000;
        
        rooms.entrySet().removeIf(entry -> {
            GameRoom room = entry.getValue();
            return room.isEmpty() && (now - room.getCreatedAt() > oneHour);
        });
    }
}
