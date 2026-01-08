package com.devsecops.ponggame.model;

/**
 * Represents the current state of a Pong game
 */
public class GameState {
    private double ballX;
    private double ballY;
    private double ballDx;
    private double ballDy;
    private double player1Y;
    private double player2Y;
    private int player1Score;
    private int player2Score;
    private boolean isRunning;
    private boolean isPaused;
    private long lastUpdate;

    public GameState() {
        reset();
    }

    public void reset() {
        this.ballX = 400;
        this.ballY = 225;
        this.ballDx = 5;
        this.ballDy = 5;
        this.player1Y = 180;
        this.player2Y = 180;
        this.player1Score = 0;
        this.player2Score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.lastUpdate = System.currentTimeMillis();
    }

    // Getters and Setters
    public double getBallX() { return ballX; }
    public void setBallX(double ballX) { this.ballX = ballX; }
    
    public double getBallY() { return ballY; }
    public void setBallY(double ballY) { this.ballY = ballY; }
    
    public double getBallDx() { return ballDx; }
    public void setBallDx(double ballDx) { this.ballDx = ballDx; }
    
    public double getBallDy() { return ballDy; }
    public void setBallDy(double ballDy) { this.ballDy = ballDy; }
    
    public double getPlayer1Y() { return player1Y; }
    public void setPlayer1Y(double player1Y) { this.player1Y = player1Y; }
    
    public double getPlayer2Y() { return player2Y; }
    public void setPlayer2Y(double player2Y) { this.player2Y = player2Y; }
    
    public int getPlayer1Score() { return player1Score; }
    public void setPlayer1Score(int player1Score) { this.player1Score = player1Score; }
    
    public int getPlayer2Score() { return player2Score; }
    public void setPlayer2Score(int player2Score) { this.player2Score = player2Score; }
    
    public boolean isRunning() { return isRunning; }
    public void setRunning(boolean running) { isRunning = running; }
    
    public boolean isPaused() { return isPaused; }
    public void setPaused(boolean paused) { isPaused = paused; }
    
    public long getLastUpdate() { return lastUpdate; }
    public void setLastUpdate(long lastUpdate) { this.lastUpdate = lastUpdate; }

    public void incrementPlayer1Score() { this.player1Score++; }
    public void incrementPlayer2Score() { this.player2Score++; }
}
