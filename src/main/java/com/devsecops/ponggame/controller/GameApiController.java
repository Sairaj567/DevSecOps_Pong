package com.devsecops.ponggame.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * REST API Controller for Game Information
 */
@RestController
@RequestMapping("/api")
public class GameApiController {

    /**
     * Get game information
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getGameInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "DevSecOps Pong Game");
        info.put("version", "1.0.0");
        info.put("author", "DevSecOps Team");
        info.put("timestamp", LocalDateTime.now().toString());
        info.put("status", "running");
        return ResponseEntity.ok(info);
    }

    /**
     * Simple health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("application", "Pong Game");
        return ResponseEntity.ok(health);
    }
}
