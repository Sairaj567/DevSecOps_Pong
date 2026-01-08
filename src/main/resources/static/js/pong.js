/**
 * DevSecOps Pong v3.0 - Online Multiplayer
 * WebSocket-based real-time gameplay with latency monitoring
 */

// ============================================
// Game Configuration
// ============================================
const CONFIG = {
    WINNING_SCORE: 10,
    BALL_SPEED: 5,
    BALL_SPEED_INCREMENT: 0.3,
    PADDLE_SPEED: 8,
    PADDLE_HEIGHT: 90,
    PADDLE_WIDTH: 12,
    BALL_SIZE: 10,
    PING_INTERVAL: 1000,
    COLORS: {
        background: '#000000',
        paddle1: '#00d4ff',
        paddle2: '#e94560',
        ball: '#ffffff',
        centerLine: '#333333'
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
    playerNumber: 0,
    roomCode: '',
    opponentName: '',
    myName: '',
    isHost: false
};

let latencyState = {
    myLatency: 0,
    opponentLatency: 0,
    lastPingTime: 0
};

// ============================================
// WebSocket Connection
// ============================================
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let lastGameStateTime = 0;
const GAME_STATE_THROTTLE = 50; // Send game state max every 50ms

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/game-ws`;
    
    try {
        socket = new WebSocket(wsUrl);
    } catch (error) {
        console.error('WebSocket creation failed:', error);
        scheduleReconnect();
        return;
    }
    
    socket.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        updateConnectionStatus(true);
        startPingLoop();
    };
    
    socket.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        updateConnectionStatus(false);
        
        // Try to reconnect if game is running
        if (gameState.isRunning || gameState.roomCode) {
            scheduleReconnect();
        }
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    socket.onmessage = (event) => {
        try {
            handleServerMessage(JSON.parse(event.data));
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    };
}

function scheduleReconnect() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * reconnectAttempts, 5000);
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
        setTimeout(connectWebSocket, delay);
    } else {
        showLobbyError('Connection lost. Please refresh the page.');
    }
}

function sendMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        try {
            socket.send(JSON.stringify(data));
        } catch (e) {
            console.error('Error sending message:', e);
        }
    }
}

// Throttled game state sender for ball sync
function sendGameState() {
    const now = Date.now();
    if (now - lastGameStateTime < GAME_STATE_THROTTLE) return;
    lastGameStateTime = now;
    
    sendMessage({
        type: 'game_state',
        ballX: ball.x,
        ballY: ball.y,
        ballDx: ball.dx,
        ballDy: ball.dy
    });
}

// ============================================
// Message Handlers
// ============================================
function handleServerMessage(data) {
    switch (data.type) {
        case 'room_created':
            handleRoomCreated(data);
            break;
        case 'room_joined':
            handleRoomJoined(data);
            break;
        case 'opponent_joined':
            handleOpponentJoined(data);
            break;
        case 'game_started':
            handleGameStarted(data);
            break;
        case 'opponent_paddle':
            handleOpponentPaddle(data);
            break;
        case 'ball_state':
            handleBallState(data);
            break;
        case 'score_updated':
            handleScoreUpdated(data);
            break;
        case 'game_ended':
            handleGameEnded(data);
            break;
        case 'opponent_disconnected':
            handleOpponentDisconnected();
            break;
        case 'pong':
            handlePong(data);
            break;
        case 'error':
            showLobbyError(data.message);
            break;
    }
}

function handleRoomCreated(data) {
    gameState.roomCode = data.roomCode;
    gameState.playerNumber = data.playerNumber;
    gameState.myName = data.playerName;
    gameState.isHost = true;
    
    document.getElementById('displayRoomCode').textContent = data.roomCode;
    showScreen('waiting-screen');
}

function handleRoomJoined(data) {
    gameState.roomCode = data.roomCode;
    gameState.playerNumber = data.playerNumber;
    gameState.myName = data.playerName;
    gameState.opponentName = data.opponentName;
    gameState.isHost = false;
    
    setupGameScreen();
    showScreen('game-screen');
}

function handleOpponentJoined(data) {
    gameState.opponentName = data.opponentName;
    
    setupGameScreen();
    showScreen('game-screen');
    
    // Host can now start the game
    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = 'Start Game';
}

function handleGameStarted(data) {
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    
    resetBall();
    resetPaddles();
    updateScoreDisplay();
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('startBtn').textContent = 'Playing...';
    document.getElementById('pauseBtn').disabled = false;
    
    if (gameState.isHost) {
        gameLoop();
    } else {
        nonHostLoop();
    }
}

function handleOpponentPaddle(data) {
    if (gameState.playerNumber === 1) {
        player2.y = data.paddleY;
    } else {
        player1.y = data.paddleY;
    }
}

function handleBallState(data) {
    if (!gameState.isHost) {
        ball.x = data.ballX;
        ball.y = data.ballY;
        ball.dx = data.ballDx;
        ball.dy = data.ballDy;
    }
}

function handleScoreUpdated(data) {
    gameState.player1Score = data.player1Score;
    gameState.player2Score = data.player2Score;
    updateScoreDisplay();
}

function handleGameEnded(data) {
    gameState.isRunning = false;
    
    const winnerText = data.winner === gameState.playerNumber ? 'You Win!' : 'You Lose!';
    const winnerColor = data.winner === gameState.playerNumber ? '#00ff88' : '#e94560';
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = winnerColor;
    ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${data.player1Score} - ${data.player2Score}`, canvas.width / 2, canvas.height / 2 + 25);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = 'Play Again';
}

function handleOpponentDisconnected() {
    gameState.isRunning = false;
    alert('Opponent disconnected!');
    showScreen('lobby-screen');
}

function handlePong(data) {
    const now = Date.now();
    latencyState.myLatency = now - data.clientTimestamp;
    latencyState.opponentLatency = gameState.playerNumber === 1 ? data.player2Latency : data.player1Latency;
    
    updateLatencyDisplay();
}

// ============================================
// Canvas Setup
// ============================================
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
    color: CONFIG.COLORS.paddle1
};

const player2 = {
    x: canvas.width - 20 - CONFIG.PADDLE_WIDTH,
    y: canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2,
    width: CONFIG.PADDLE_WIDTH,
    height: CONFIG.PADDLE_HEIGHT,
    color: CONFIG.COLORS.paddle2
};

// Key States
const keys = { w: false, s: false, W: false, S: false, ArrowUp: false, ArrowDown: false };

// ============================================
// Event Listeners
// ============================================
document.addEventListener('keydown', (e) => {
    // Don't capture keys when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    // Don't capture keys when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Lobby buttons
document.getElementById('createRoomBtn').addEventListener('click', createRoom);
document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);
document.getElementById('cancelWaitBtn').addEventListener('click', cancelWait);
document.getElementById('copyCodeBtn').addEventListener('click', copyRoomCode);

// Game buttons
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('leaveBtn').addEventListener('click', leaveGame);

// Room code input - auto uppercase
document.getElementById('roomCodeInput').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// ============================================
// Lobby Functions
// ============================================
function createRoom() {
    const playerName = document.getElementById('playerName').value.trim() || 'Player 1';
    gameState.myName = playerName;
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        connectWebSocket();
        setTimeout(() => {
            sendMessage({ type: 'create_room', playerName });
        }, 500);
    } else {
        sendMessage({ type: 'create_room', playerName });
    }
}

function joinRoom() {
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    const playerName = document.getElementById('playerName').value.trim() || 'Player 2';
    
    if (roomCode.length !== 4) {
        showLobbyError('Please enter a 4-character room code');
        return;
    }
    
    gameState.myName = playerName;
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        connectWebSocket();
        setTimeout(() => {
            sendMessage({ type: 'join_room', roomCode, playerName });
        }, 500);
    } else {
        sendMessage({ type: 'join_room', roomCode, playerName });
    }
}

function cancelWait() {
    if (socket) {
        socket.close();
    }
    showScreen('lobby-screen');
}

function copyRoomCode() {
    const code = document.getElementById('displayRoomCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        document.getElementById('copyCodeBtn').textContent = '✓';
        setTimeout(() => {
            document.getElementById('copyCodeBtn').textContent = '📋';
        }, 2000);
    });
}

function showLobbyError(message) {
    const status = document.getElementById('lobby-status');
    status.textContent = message;
    status.className = 'lobby-status error';
    setTimeout(() => {
        status.textContent = '';
        status.className = 'lobby-status';
    }, 3000);
}

// ============================================
// Game Functions
// ============================================
function setupGameScreen() {
    document.getElementById('game-room-code').textContent = gameState.roomCode;
    
    if (gameState.playerNumber === 1) {
        document.getElementById('p1-name').textContent = gameState.myName + ' (You)';
        document.getElementById('p2-name').textContent = gameState.opponentName;
    } else {
        document.getElementById('p1-name').textContent = gameState.opponentName;
        document.getElementById('p2-name').textContent = gameState.myName + ' (You)';
    }
    
    if (gameState.isHost) {
        document.getElementById('startBtn').textContent = 'Start Game';
        document.getElementById('startBtn').disabled = false;
    } else {
        document.getElementById('startBtn').textContent = 'Waiting for host...';
        document.getElementById('startBtn').disabled = true;
    }
    
    draw();
}

function startGame() {
    if (gameState.isHost) {
        sendMessage({ type: 'game_start' });
    }
}

function togglePause() {
    // TODO: Implement pause sync
}

function leaveGame() {
    if (socket) {
        socket.close();
    }
    gameState = {
        isRunning: false,
        isPaused: false,
        player1Score: 0,
        player2Score: 0,
        playerNumber: 0,
        roomCode: '',
        opponentName: '',
        myName: '',
        isHost: false
    };
    showScreen('lobby-screen');
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = CONFIG.BALL_SPEED;
    
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
    document.getElementById('player1-score').textContent = gameState.player1Score;
    document.getElementById('player2-score').textContent = gameState.player2Score;
}

// ============================================
// Game Loop (Host only controls ball)
// ============================================
function update() {
    // My paddle movement
    const myPaddle = gameState.playerNumber === 1 ? player1 : player2;
    let moved = false;
    
    if (keys.w || keys.W || keys.ArrowUp) {
        myPaddle.y -= CONFIG.PADDLE_SPEED;
        moved = true;
    }
    if (keys.s || keys.S || keys.ArrowDown) {
        myPaddle.y += CONFIG.PADDLE_SPEED;
        moved = true;
    }
    
    myPaddle.y = Math.max(0, Math.min(canvas.height - myPaddle.height, myPaddle.y));
    
    if (moved) {
        sendMessage({ type: 'paddle_move', paddleY: myPaddle.y });
    }
    
    // Only host controls ball physics
    if (gameState.isHost) {
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Wall collision
        if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
            ball.dy = -ball.dy;
            ball.y = ball.y - ball.size < 0 ? ball.size : canvas.height - ball.size;
        }
        
        // Paddle collision
        if (checkPaddleCollision(player1)) {
            handlePaddleCollision(player1);
        } else if (checkPaddleCollision(player2)) {
            handlePaddleCollision(player2);
        }
        
        // Scoring
        if (ball.x < 0) {
            gameState.player2Score++;
            sendMessage({ type: 'score_update', scorer: 2 });
            checkWinner();
            resetBall();
        } else if (ball.x > canvas.width) {
            gameState.player1Score++;
            sendMessage({ type: 'score_update', scorer: 1 });
            checkWinner();
            resetBall();
        }
        
        // Sync ball state to player 2 (throttled)
        sendGameState();
    }
}

function checkPaddleCollision(paddle) {
    return ball.x - ball.size < paddle.x + paddle.width &&
           ball.x + ball.size > paddle.x &&
           ball.y - ball.size < paddle.y + paddle.height &&
           ball.y + ball.size > paddle.y;
}

function handlePaddleCollision(paddle) {
    const hitPos = (ball.y - paddle.y) / paddle.height;
    const angle = (hitPos - 0.5) * Math.PI / 3;
    
    ball.speed = Math.min(ball.speed + CONFIG.BALL_SPEED_INCREMENT, CONFIG.BALL_SPEED * 2.5);
    
    const direction = paddle === player1 ? 1 : -1;
    ball.dx = direction * ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
    
    if (paddle === player1) {
        ball.x = paddle.x + paddle.width + ball.size;
    } else {
        ball.x = paddle.x - ball.size;
    }
}

function checkWinner() {
    if (gameState.player1Score >= CONFIG.WINNING_SCORE) {
        sendMessage({ type: 'game_over', winner: 1 });
    } else if (gameState.player2Score >= CONFIG.WINNING_SCORE) {
        sendMessage({ type: 'game_over', winner: 2 });
    }
}

// ============================================
// Drawing
// ============================================
function draw() {
    ctx.fillStyle = CONFIG.COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center line
    ctx.strokeStyle = CONFIG.COLORS.centerLine;
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Paddles
    drawPaddle(player1);
    drawPaddle(player2);
    
    // Ball
    drawBall();
}

function drawPaddle(paddle) {
    ctx.fillStyle = paddle.color;
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 4);
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

function gameLoop() {
    if (gameState.isRunning && !gameState.isPaused) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Non-host also needs to run update (for paddle input) and render
function nonHostLoop() {
    if (gameState.isRunning && !gameState.isPaused && !gameState.isHost) {
        updateMyPaddle();
        draw();
        requestAnimationFrame(nonHostLoop);
    }
}

// Separate paddle update for non-host to avoid ball physics
function updateMyPaddle() {
    const myPaddle = gameState.playerNumber === 1 ? player1 : player2;
    let moved = false;
    
    if (keys.w || keys.W || keys.ArrowUp) {
        myPaddle.y -= CONFIG.PADDLE_SPEED;
        moved = true;
    }
    if (keys.s || keys.S || keys.ArrowDown) {
        myPaddle.y += CONFIG.PADDLE_SPEED;
        moved = true;
    }
    
    myPaddle.y = Math.max(0, Math.min(canvas.height - myPaddle.height, myPaddle.y));
    
    if (moved) {
        sendMessage({ type: 'paddle_move', paddleY: myPaddle.y });
    }
}

// ============================================
// Latency & Metrics
// ============================================
function startPingLoop() {
    setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Send our last measured RTT so server can share it with opponent
            sendMessage({ 
                type: 'ping', 
                timestamp: Date.now(),
                rtt: latencyState.myLatency || 0
            });
        }
    }, CONFIG.PING_INTERVAL);
}

function updateLatencyDisplay() {
    const myLatencyEl = document.getElementById('my-latency-value');
    const oppLatencyEl = document.getElementById('opponent-latency-value');
    const myIndicator = document.getElementById('my-latency-indicator');
    const oppIndicator = document.getElementById('opponent-latency-indicator');
    
    myLatencyEl.textContent = latencyState.myLatency;
    oppLatencyEl.textContent = latencyState.opponentLatency || '--';
    
    // Update player badges
    if (gameState.playerNumber === 1) {
        document.getElementById('p1-latency').textContent = `${latencyState.myLatency} ms`;
        document.getElementById('p2-latency').textContent = `${latencyState.opponentLatency || '--'} ms`;
    } else {
        document.getElementById('p2-latency').textContent = `${latencyState.myLatency} ms`;
        document.getElementById('p1-latency').textContent = `${latencyState.opponentLatency || '--'} ms`;
    }
    
    // Color indicators
    setLatencyIndicator(myIndicator, latencyState.myLatency);
    setLatencyIndicator(oppIndicator, latencyState.opponentLatency);
}

function setLatencyIndicator(element, latency) {
    if (latency < 50) {
        element.className = 'status-indicator';
    } else if (latency < 150) {
        element.className = 'status-indicator warning';
    } else {
        element.className = 'status-indicator danger';
    }
}

function updateConnectionStatus(connected) {
    const el = document.getElementById('connection-status');
    if (el) {
        el.textContent = connected ? '● Connected' : '○ Disconnected';
        el.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
    }
}

// DevOps Metrics
const MetricsDashboard = {
    init() {
        this.fetchMetrics();
        setInterval(() => this.fetchMetrics(), 3000);
    },
    
    async fetchMetrics() {
        try {
            const start = performance.now();
            const [metricsRes, roomsRes] = await Promise.all([
                fetch('/api/metrics/devops'),
                fetch('/api/rooms/stats')
            ]);
            const apiLatency = (performance.now() - start).toFixed(1);
            
            const metrics = await metricsRes.json();
            const rooms = await roomsRes.json();
            
            document.getElementById('latency-value').textContent = apiLatency;
            
            if (metrics.memory) {
                document.getElementById('memory-bar').style.width = `${metrics.memory.heapUsagePercent}%`;
                document.getElementById('memory-value').textContent = `${metrics.memory.heapUsedMB} / ${metrics.memory.heapMaxMB} MB`;
                document.getElementById('memory-percent').textContent = `${metrics.memory.heapUsagePercent}%`;
            }
            
            if (metrics.jvm) {
                document.getElementById('uptime-value').textContent = metrics.jvm.uptimeFormatted;
            }
            
            document.getElementById('active-rooms').textContent = rooms.activeRooms || 0;
            document.getElementById('online-players').textContent = rooms.connectedPlayers || 0;
            
        } catch (e) {
            console.error('Metrics error:', e);
        }
    }
};

// ============================================
// Screen Management
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    draw();
    MetricsDashboard.init();
    console.log('%c🎮 DevSecOps Pong v3.0 - Online Multiplayer!', 'color: #00d4ff; font-size: 20px;');
});
