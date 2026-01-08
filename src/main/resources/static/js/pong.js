/**
 * DevSecOps Pong Game v2.0
 * Two-Player Mode with Real-Time DevOps Metrics
 */

// ============================================
// Game Configuration
// ============================================
const CONFIG = {
    WINNING_SCORE: 10,
    BALL_SPEED: 5,
    BALL_SPEED_INCREMENT: 0.3,
    PADDLE_SPEED: 7,
    PADDLE_HEIGHT: 90,
    PADDLE_WIDTH: 12,
    BALL_SIZE: 10,
    COLORS: {
        background: '#000000',
        paddle1: '#00d4ff',
        paddle2: '#e94560',
        ball: '#ffffff',
        centerLine: '#333333',
        text: '#ffffff'
    }
};

// ============================================
// Game State
// ============================================
let gameState = {
    isRunning: false,
    isPaused: false,
    player1Score: 0,
    player2Score: 0,
    gameMode: 'two-player' // Always two-player now
};

// ============================================
// Canvas Setup
// ============================================
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// ============================================
// Game Objects
// ============================================
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: CONFIG.BALL_SPEED,
    dy: CONFIG.BALL_SPEED,
    size: CONFIG.BALL_SIZE,
    speed: CONFIG.BALL_SPEED
};

const player1 = {
    x: 20,
    y: canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2,
    width: CONFIG.PADDLE_WIDTH,
    height: CONFIG.PADDLE_HEIGHT,
    dy: 0,
    color: CONFIG.COLORS.paddle1,
    name: 'Player 1'
};

const player2 = {
    x: canvas.width - 20 - CONFIG.PADDLE_WIDTH,
    y: canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2,
    width: CONFIG.PADDLE_WIDTH,
    height: CONFIG.PADDLE_HEIGHT,
    dy: 0,
    color: CONFIG.COLORS.paddle2,
    name: 'Player 2'
};

// ============================================
// Key States - Two Player Controls
// ============================================
const keys = {
    // Player 1: W and S
    w: false,
    s: false,
    W: false,
    S: false,
    // Player 2: Arrow keys
    ArrowUp: false,
    ArrowDown: false
};

// ============================================
// DOM Elements
// ============================================
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const player1ScoreEl = document.getElementById('player1-score');
const player2ScoreEl = document.getElementById('player2-score');

// ============================================
// Event Listeners
// ============================================
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

// ============================================
// Game Functions
// ============================================
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBall();
        gameLoop();
    }
}

function togglePause() {
    if (gameState.isRunning) {
        gameState.isPaused = !gameState.isPaused;
        pauseBtn.textContent = gameState.isPaused ? 'Resume' : 'Pause';
        if (!gameState.isPaused) {
            gameLoop();
        }
    }
}

function resetGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    
    updateScoreDisplay();
    resetBall();
    resetPaddles();
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    
    draw();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = CONFIG.BALL_SPEED;
    
    // Random direction
    const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
    const direction = Math.random() > 0.5 ? 1 : -1;
    ball.dx = direction * ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
}

function resetPaddles() {
    player1.y = canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;
    player2.y = canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;
}

function updateScoreDisplay() {
    player1ScoreEl.textContent = gameState.player1Score;
    player2ScoreEl.textContent = gameState.player2Score;
}

// ============================================
// Update Function - Two Player Logic
// ============================================
function update() {
    // Player 1 Movement (W/S keys)
    if (keys.w || keys.W) {
        player1.y -= CONFIG.PADDLE_SPEED;
    }
    if (keys.s || keys.S) {
        player1.y += CONFIG.PADDLE_SPEED;
    }
    
    // Player 2 Movement (Arrow keys)
    if (keys.ArrowUp) {
        player2.y -= CONFIG.PADDLE_SPEED;
    }
    if (keys.ArrowDown) {
        player2.y += CONFIG.PADDLE_SPEED;
    }
    
    // Keep player 1 in bounds
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
    
    // Keep player 2 in bounds
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
    
    // Ball Movement
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball collision with top/bottom walls
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = ball.y - ball.size < 0 ? ball.size : canvas.height - ball.size;
    }
    
    // Ball collision with paddles
    if (checkPaddleCollision(player1)) {
        handlePaddleCollision(player1);
    } else if (checkPaddleCollision(player2)) {
        handlePaddleCollision(player2);
    }
    
    // Scoring
    if (ball.x < 0) {
        gameState.player2Score++;
        updateScoreDisplay();
        checkWinner();
        resetBall();
    } else if (ball.x > canvas.width) {
        gameState.player1Score++;
        updateScoreDisplay();
        checkWinner();
        resetBall();
    }
}

function checkPaddleCollision(paddle) {
    return ball.x - ball.size < paddle.x + paddle.width &&
           ball.x + ball.size > paddle.x &&
           ball.y - ball.size < paddle.y + paddle.height &&
           ball.y + ball.size > paddle.y;
}

function handlePaddleCollision(paddle) {
    // Calculate where on the paddle the ball hit
    const hitPos = (ball.y - paddle.y) / paddle.height;
    const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degree angle
    
    // Increase speed slightly
    ball.speed = Math.min(ball.speed + CONFIG.BALL_SPEED_INCREMENT, CONFIG.BALL_SPEED * 2.5);
    
    // Calculate new velocity
    const direction = paddle === player1 ? 1 : -1;
    ball.dx = direction * ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
    
    // Move ball outside paddle to prevent multiple collisions
    if (paddle === player1) {
        ball.x = paddle.x + paddle.width + ball.size;
    } else {
        ball.x = paddle.x - ball.size;
    }
}

function checkWinner() {
    if (gameState.player1Score >= CONFIG.WINNING_SCORE) {
        endGame('Player 1 Wins!', 'player1');
    } else if (gameState.player2Score >= CONFIG.WINNING_SCORE) {
        endGame('Player 2 Wins!', 'player2');
    }
}

function endGame(message, winner) {
    gameState.isRunning = false;
    
    // Record game result
    recordGameResult(winner);
    
    // Show game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = winner === 'player1' ? CONFIG.COLORS.paddle1 : CONFIG.COLORS.paddle2;
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${gameState.player1Score} - ${gameState.player2Score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Click Reset to play again', canvas.width / 2, canvas.height / 2 + 55);
    
    startBtn.disabled = true;
    pauseBtn.disabled = true;
}

// ============================================
// Draw Functions
// ============================================
function draw() {
    // Clear canvas
    ctx.fillStyle = CONFIG.COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = CONFIG.COLORS.centerLine;
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    drawPaddle(player1);
    drawPaddle(player2);
    
    // Draw ball
    drawBall();
    
    // Draw center circle
    ctx.strokeStyle = CONFIG.COLORS.centerLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPaddle(paddle) {
    ctx.fillStyle = paddle.color;
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 15;
    
    // Rounded rectangle
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = CONFIG.COLORS.ball;
    ctx.shadowColor = CONFIG.COLORS.ball;
    ctx.shadowBlur = 12;
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

// ============================================
// Game Loop
// ============================================
function gameLoop() {
    if (gameState.isRunning && !gameState.isPaused) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// ============================================
// DevOps Metrics Dashboard
// ============================================
const MetricsDashboard = {
    updateInterval: 2000, // 2 seconds
    isRunning: false,
    
    init() {
        this.isRunning = true;
        this.fetchMetrics();
        this.startPolling();
    },
    
    startPolling() {
        setInterval(() => {
            if (this.isRunning) {
                this.fetchMetrics();
            }
        }, this.updateInterval);
    },
    
    async fetchMetrics() {
        try {
            const startTime = performance.now();
            const response = await fetch('/api/metrics/devops');
            const endTime = performance.now();
            
            if (!response.ok) throw new Error('Failed to fetch metrics');
            
            const data = await response.json();
            
            // Calculate client-side latency
            const clientLatency = (endTime - startTime).toFixed(1);
            
            this.updateUI(data, clientLatency);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            this.handleError();
        }
    },
    
    updateUI(data, clientLatency) {
        // Latency
        const latencyEl = document.getElementById('latency-value');
        const latencyIndicator = document.getElementById('latency-indicator');
        latencyEl.textContent = clientLatency;
        
        // Set latency indicator color
        const latencyMs = parseFloat(clientLatency);
        if (latencyMs < 50) {
            latencyIndicator.className = 'status-indicator';
        } else if (latencyMs < 200) {
            latencyIndicator.className = 'status-indicator warning';
        } else {
            latencyIndicator.className = 'status-indicator danger';
        }
        
        // Memory
        if (data.memory) {
            const memoryPercent = data.memory.heapUsagePercent;
            document.getElementById('memory-bar').style.width = `${memoryPercent}%`;
            document.getElementById('memory-value').textContent = 
                `${data.memory.heapUsedMB} / ${data.memory.heapMaxMB} MB`;
            document.getElementById('memory-percent').textContent = `${memoryPercent}%`;
        }
        
        // CPU
        if (data.cpu) {
            const loadAvg = data.cpu.systemLoadAverage;
            document.getElementById('cpu-value').textContent = 
                loadAvg >= 0 ? loadAvg.toFixed(2) : 'N/A';
            document.getElementById('cpu-cores').textContent = 
                `${data.cpu.availableProcessors} cores`;
            document.getElementById('os-name').textContent = data.cpu.osName || '--';
            document.getElementById('os-arch').textContent = data.cpu.arch || '--';
        }
        
        // Uptime
        if (data.jvm) {
            document.getElementById('uptime-value').textContent = 
                data.jvm.uptimeFormatted || '--';
            document.getElementById('jvm-version').textContent = 
                data.jvm.jvmVersion ? data.jvm.jvmVersion.split('+')[0] : '--';
        }
        
        // Requests
        if (data.application) {
            document.getElementById('requests-value').textContent = 
                this.formatNumber(data.application.totalRequests);
            document.getElementById('games-value').textContent = 
                data.application.gamesPlayed || 0;
            document.getElementById('games-wins').textContent = 
                `P1: ${data.application.player1Wins || 0} | P2: ${data.application.player2Wins || 0}`;
        }
        
        // Threads
        if (data.threads) {
            document.getElementById('threads-value').textContent = 
                data.threads.activeThreads;
            document.getElementById('threads-peak').textContent = 
                `Peak: ${data.threads.peakThreads}`;
        }
    },
    
    handleError() {
        document.getElementById('latency-value').textContent = 'ERR';
        document.getElementById('latency-indicator').className = 'status-indicator danger';
    },
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
};

// Record game result to server
async function recordGameResult(winner) {
    try {
        await fetch(`/api/game/record?winner=${winner}`);
        // Refresh metrics after game ends
        MetricsDashboard.fetchMetrics();
    } catch (error) {
        console.error('Failed to record game result:', error);
    }
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initial draw
    draw();
    
    // Start metrics dashboard
    MetricsDashboard.init();
    
    // Console info
    console.log('%c🎮 DevSecOps Pong v2.0 - Two Player Mode!', 
        'color: #00d4ff; font-size: 20px; font-weight: bold;');
    console.log('%cPlayer 1: W/S keys | Player 2: Arrow keys', 
        'color: #7b2cbf; font-size: 14px;');
    console.log('%cReal-time DevOps metrics enabled', 
        'color: #00ff88; font-size: 12px;');
});

// Initial Draw
draw();
