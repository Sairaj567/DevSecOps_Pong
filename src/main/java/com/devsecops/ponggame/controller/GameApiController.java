package com.devsecops.ponggame.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * REST API Controller for Game Information & DevOps Metrics
 */
@RestController
@RequestMapping("/api")
public class GameApiController {

    private final Instant startTime = Instant.now();
    private final AtomicLong requestCounter = new AtomicLong(0);
    private final AtomicLong totalGamesPlayed = new AtomicLong(0);
    private final AtomicLong player1Wins = new AtomicLong(0);
    private final AtomicLong player2Wins = new AtomicLong(0);

    /**
     * Get game information
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getGameInfo() {
        requestCounter.incrementAndGet();
        Map<String, Object> info = new HashMap<>();
        info.put("name", "DevSecOps Pong Game");
        info.put("version", "2.0.0");
        info.put("author", "DevSecOps Team");
        info.put("timestamp", LocalDateTime.now().toString());
        info.put("status", "running");
        info.put("mode", "Two-Player");
        return ResponseEntity.ok(info);
    }

    /**
     * Real-time DevOps metrics endpoint
     */
    @GetMapping("/metrics/devops")
    public ResponseEntity<Map<String, Object>> getDevOpsMetrics() {
        long startNano = System.nanoTime();
        requestCounter.incrementAndGet();
        
        Map<String, Object> metrics = new HashMap<>();
        
        // Memory Metrics
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long heapUsed = memoryBean.getHeapMemoryUsage().getUsed();
        long heapMax = memoryBean.getHeapMemoryUsage().getMax();
        long nonHeapUsed = memoryBean.getNonHeapMemoryUsage().getUsed();
        
        Map<String, Object> memory = new HashMap<>();
        memory.put("heapUsedMB", heapUsed / (1024 * 1024));
        memory.put("heapMaxMB", heapMax / (1024 * 1024));
        memory.put("heapUsagePercent", Math.round((double) heapUsed / heapMax * 100));
        memory.put("nonHeapUsedMB", nonHeapUsed / (1024 * 1024));
        metrics.put("memory", memory);
        
        // CPU Metrics
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        Map<String, Object> cpu = new HashMap<>();
        cpu.put("availableProcessors", osBean.getAvailableProcessors());
        cpu.put("systemLoadAverage", Math.round(osBean.getSystemLoadAverage() * 100.0) / 100.0);
        cpu.put("arch", osBean.getArch());
        cpu.put("osName", osBean.getName());
        cpu.put("osVersion", osBean.getVersion());
        metrics.put("cpu", cpu);
        
        // JVM Metrics
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        Duration uptime = Duration.ofMillis(runtimeBean.getUptime());
        Map<String, Object> jvm = new HashMap<>();
        jvm.put("uptimeSeconds", uptime.getSeconds());
        jvm.put("uptimeFormatted", formatDuration(uptime));
        jvm.put("jvmName", runtimeBean.getVmName());
        jvm.put("jvmVersion", runtimeBean.getVmVersion());
        jvm.put("startTime", runtimeBean.getStartTime());
        metrics.put("jvm", jvm);
        
        // Application Metrics
        Map<String, Object> app = new HashMap<>();
        app.put("totalRequests", requestCounter.get());
        app.put("gamesPlayed", totalGamesPlayed.get());
        app.put("player1Wins", player1Wins.get());
        app.put("player2Wins", player2Wins.get());
        metrics.put("application", app);
        
        // Thread Metrics
        Map<String, Object> threads = new HashMap<>();
        threads.put("activeThreads", Thread.activeCount());
        threads.put("peakThreads", ManagementFactory.getThreadMXBean().getPeakThreadCount());
        threads.put("totalStartedThreads", ManagementFactory.getThreadMXBean().getTotalStartedThreadCount());
        metrics.put("threads", threads);
        
        // Response Time (latency)
        long latencyNano = System.nanoTime() - startNano;
        Map<String, Object> performance = new HashMap<>();
        performance.put("latencyMs", Math.round(latencyNano / 1_000_000.0 * 100.0) / 100.0);
        performance.put("latencyUs", latencyNano / 1000);
        performance.put("timestamp", System.currentTimeMillis());
        metrics.put("performance", performance);
        
        return ResponseEntity.ok(metrics);
    }

    /**
     * Ping endpoint for latency measurement
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        requestCounter.incrementAndGet();
        Map<String, Object> response = new HashMap<>();
        response.put("pong", true);
        response.put("timestamp", System.currentTimeMillis());
        response.put("serverTime", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Record game result
     */
    @GetMapping("/game/record")
    public ResponseEntity<Map<String, Object>> recordGame(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String winner) {
        requestCounter.incrementAndGet();
        totalGamesPlayed.incrementAndGet();
        
        if ("player1".equalsIgnoreCase(winner)) {
            player1Wins.incrementAndGet();
        } else if ("player2".equalsIgnoreCase(winner)) {
            player2Wins.incrementAndGet();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("recorded", true);
        response.put("totalGames", totalGamesPlayed.get());
        response.put("player1Wins", player1Wins.get());
        response.put("player2Wins", player2Wins.get());
        return ResponseEntity.ok(response);
    }

    /**
     * Simple health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        requestCounter.incrementAndGet();
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("application", "Pong Game");
        return ResponseEntity.ok(health);
    }

    private String formatDuration(Duration duration) {
        long days = duration.toDays();
        long hours = duration.toHours() % 24;
        long minutes = duration.toMinutes() % 60;
        long seconds = duration.getSeconds() % 60;
        
        if (days > 0) {
            return String.format("%dd %dh %dm %ds", days, hours, minutes, seconds);
        } else if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }
}
