/**
 * DevSecOps Pong Game
 * HTML5 Canvas Implementation
 */

// Game Configuration
const CONFIG = {
    WINNING_SCORE: 10,
    BALL_SPEED: 5,
    BALL_SPEED_INCREMENT: 0.5,
    PADDLE_SPEED: 8,
    AI_DIFFICULTY: 0.08, // Lower = harder (0.05-0.15)
    PADDLE_HEIGHT: 100,
    PADDLE_WIDTH: 15,
    BALL_SIZE: 12,
    COLORS: {
        background: '#000000',
        paddle1: '#00d4ff',
        paddle2: '#e94560',
        ball: '#ffffff',
        centerLine: '#333333',
        text: '#ffffff'
    }
};

// Game State
let gameState = {
    isRunning: false,
    isPaused: false,
    player1Score: 0,
    player2Score: 0
};

// Canvas Setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
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
    color: CONFIG.COLORS.paddle1
};

const player2 = {
    x: canvas.width - 20 - CONFIG.PADDLE_WIDTH,
    y: canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2,
    width: CONFIG.PADDLE_WIDTH,
    height: CONFIG.PADDLE_HEIGHT,
    dy: 0,
    color: CONFIG.COLORS.paddle2
};

// Key States
const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};

// DOM Elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const player1ScoreEl = document.getElementById('player1-score');
const player2ScoreEl = document.getElementById('player2-score');

// Event Listeners
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

// Game Functions
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

function update() {
    // Player 1 Movement
    if (keys.w || keys.ArrowUp) {
        player1.y -= CONFIG.PADDLE_SPEED;
    }
    if (keys.s || keys.ArrowDown) {
        player1.y += CONFIG.PADDLE_SPEED;
    }
    
    // Keep player 1 in bounds
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
    
    // AI Movement (Player 2)
    const targetY = ball.y - player2.height / 2;
    const diff = targetY - player2.y;
    player2.y += diff * CONFIG.AI_DIFFICULTY;
    
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
    ball.speed = Math.min(ball.speed + CONFIG.BALL_SPEED_INCREMENT, CONFIG.BALL_SPEED * 2);
    
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
        endGame('Player 1 Wins!', true);
    } else if (gameState.player2Score >= CONFIG.WINNING_SCORE) {
        endGame('CPU Wins!', false);
    }
}

function endGame(message, playerWon) {
    gameState.isRunning = false;
    
    // Show game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = playerWon ? CONFIG.COLORS.paddle1 : CONFIG.COLORS.paddle2;
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Click Reset to play again', canvas.width / 2, canvas.height / 2 + 50);
    
    startBtn.disabled = true;
    pauseBtn.disabled = true;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = CONFIG.COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = CONFIG.COLORS.centerLine;
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
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
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPaddle(paddle) {
    ctx.fillStyle = paddle.color;
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 20;
    
    // Rounded rectangle
    const radius = 5;
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
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (gameState.isRunning && !gameState.isPaused) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Initial Draw
draw();

// Console info for DevSecOps demo
console.log('%c🎮 DevSecOps Pong Game Loaded!', 'color: #00d4ff; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with Spring Boot + Jenkins CI/CD Pipeline', 'color: #7b2cbf; font-size: 14px;');
