import { createParticles } from './particles.js';

// ── Gedeelde state en DOM-referenties voor het desktop-scherm ──
const $status = document.getElementById('status');
const $statusDot = document.getElementById('statusDot');
const $cursor = document.getElementById('cursor');
const $controllerLink = document.getElementById('controllerLink');

createParticles(25);

let socket;
let peerConnection;
let dataChannel;
let roomCode = '----';

const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// ── Bal-physics en tilt-afhandeling ──
const $gamePlayground = document.getElementById('gamePlayground');
const $gameBall = document.getElementById('gameBall');
const $tiltDebug = document.getElementById('tiltDebug');
const ballState = { x: 0, y: 0, vx: 0, vy: 0 };
let ballInitialized = false;

// ── Doolhof-generatie (recursive backtracker) ──
let mazeGrid = [];
let mazeCols = 0;
let mazeRows = 0;
let cellSize = 0;
let mazeOffsetX = 0;
let mazeOffsetY = 0;

const ENEMY_COUNT = 2;
const ENEMY_RADIUS = 12;
const ENEMY_SPEED = 1.1;
let enemies = [];
let enemyAnimId = null;
let gameOver = false;
let gamePaused = false;
const ORB_COUNT = 8;
const ORB_RADIUS = 16;
let orbs = [];
let orbsCollected = 0;
const $orbCounter = document.getElementById('orbCounter');
const $victoryOverlay = document.getElementById('victoryOverlay');
const $gameOverOverlay = document.getElementById('gameOverOverlay');
const collectSound = new Audio('/assets/collect.mp3');
const selectSound = new Audio('/assets/select.mp3');
const bgMusic = new Audio('/assets/backgroundmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.6;
let audioUnlocked = false;
let soundEnabled = false;
const $soundToggle = document.getElementById('soundToggle');

const unlockAudio = () => {
    if (audioUnlocked) return;
    collectSound.play().then(() => { collectSound.pause(); collectSound.currentTime = 0; }).catch(() => { });
    audioUnlocked = true;
};

if ($soundToggle) {
    $soundToggle.addEventListener('click', () => {
        unlockAudio();
        setSoundEnabled(!soundEnabled);
    });
}

const setSoundEnabled = (enabled) => {
    soundEnabled = enabled;
    if ($soundToggle) {
        $soundToggle.classList.toggle('muted', !soundEnabled);
        const label = $soundToggle.querySelector('.sound-label');
        if (label) label.textContent = soundEnabled ? 'Geluid aan' : 'Geluid uit';
    }
    if (soundEnabled) {
        selectSound.currentTime = 0;
        selectSound.play().catch(() => { });
        if (!gameOver && !gamePaused) bgMusic.play().catch(() => { });
    } else {
        bgMusic.pause();
    }
    sendToController({ type: 'sound-state', enabled: soundEnabled });
};

const generateMaze = () => {
    if (!$gamePlayground) return;
    const w = $gamePlayground.clientWidth;
    const h = $gamePlayground.clientHeight;
    cellSize = 120;
    mazeCols = Math.floor(w / cellSize);
    mazeRows = Math.floor(h / cellSize);
    if (mazeCols < 2) mazeCols = 2;
    if (mazeRows < 2) mazeRows = 2;
    mazeOffsetX = (w - mazeCols * cellSize) / 2;
    mazeOffsetY = (h - mazeRows * cellSize) / 2;

    // Init grid — all walls present
    mazeGrid = [];
    for (let r = 0; r < mazeRows; r++) {
        mazeGrid[r] = [];
        for (let c = 0; c < mazeCols; c++) {
            mazeGrid[r][c] = { top: true, right: true, bottom: true, left: true, visited: false };
        }
    }

    // Recursive backtracker
    const stack = [{ r: 0, c: 0 }];
    mazeGrid[0][0].visited = true;

    while (stack.length > 0) {
        const cur = stack[stack.length - 1];
        const nb = [];
        if (cur.r > 0 && !mazeGrid[cur.r - 1][cur.c].visited) nb.push({ r: cur.r - 1, c: cur.c });
        if (cur.r < mazeRows - 1 && !mazeGrid[cur.r + 1][cur.c].visited) nb.push({ r: cur.r + 1, c: cur.c });
        if (cur.c > 0 && !mazeGrid[cur.r][cur.c - 1].visited) nb.push({ r: cur.r, c: cur.c - 1 });
        if (cur.c < mazeCols - 1 && !mazeGrid[cur.r][cur.c + 1].visited) nb.push({ r: cur.r, c: cur.c + 1 });

        if (nb.length === 0) {
            stack.pop();
        } else {
            const next = nb[Math.floor(Math.random() * nb.length)];
            const dr = next.r - cur.r;
            const dc = next.c - cur.c;
            if (dr === -1) { mazeGrid[cur.r][cur.c].top = false; mazeGrid[next.r][next.c].bottom = false; }
            if (dr === 1) { mazeGrid[cur.r][cur.c].bottom = false; mazeGrid[next.r][next.c].top = false; }
            if (dc === -1) { mazeGrid[cur.r][cur.c].left = false; mazeGrid[next.r][next.c].right = false; }
            if (dc === 1) { mazeGrid[cur.r][cur.c].right = false; mazeGrid[next.r][next.c].left = false; }
            mazeGrid[next.r][next.c].visited = true;
            stack.push(next);
        }
    }

    // Remove extra walls to create loops (multiple paths)
    const extraOpenings = Math.floor(mazeRows * mazeCols * 0.35);
    for (let i = 0; i < extraOpenings; i++) {
        const r = Math.floor(Math.random() * mazeRows);
        const c = Math.floor(Math.random() * mazeCols);
        const dir = Math.floor(Math.random() * 4);
        if (dir === 0 && r > 0) { mazeGrid[r][c].top = false; mazeGrid[r - 1][c].bottom = false; }
        if (dir === 1 && r < mazeRows - 1) { mazeGrid[r][c].bottom = false; mazeGrid[r + 1][c].top = false; }
        if (dir === 2 && c > 0) { mazeGrid[r][c].left = false; mazeGrid[r][c - 1].right = false; }
        if (dir === 3 && c < mazeCols - 1) { mazeGrid[r][c].right = false; mazeGrid[r][c + 1].left = false; }
    }

    renderMaze();
    spawnOrbs();
    spawnEnemies();
};

const spawnOrbs = () => {
    $gamePlayground.querySelectorAll('.maze-orb').forEach(el => el.remove());
    orbs = [];
    orbsCollected = 0;
    if ($orbCounter) $orbCounter.textContent = `0 / ${ORB_COUNT}`;

    const centerCol = Math.floor(mazeCols / 2);
    const centerRow = Math.floor(mazeRows / 2);
    const usedCells = new Set();
    usedCells.add(`${centerRow},${centerCol}`);

    while (orbs.length < ORB_COUNT && usedCells.size < mazeRows * mazeCols) {
        const r = Math.floor(Math.random() * mazeRows);
        const c = Math.floor(Math.random() * mazeCols);
        const key = `${r},${c}`;
        if (usedCells.has(key)) continue;
        usedCells.add(key);

        const x = mazeOffsetX + c * cellSize + cellSize / 2;
        const y = mazeOffsetY + r * cellSize + cellSize / 2;

        const el = document.createElement('div');
        el.className = 'maze-orb';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        $gamePlayground.appendChild(el);

        orbs.push({ x, y, el, collected: false });
    }
};

const checkOrbCollision = () => {
    const ballRadius = 12;
    for (const orb of orbs) {
        if (orb.collected) continue;
        const dx = ballState.x - orb.x;
        const dy = ballState.y - orb.y;
        if (dx * dx + dy * dy < (ballRadius + ORB_RADIUS) * (ballRadius + ORB_RADIUS)) {
            orb.collected = true;
            orb.el.classList.add('collected');
            if (soundEnabled) {
                collectSound.currentTime = 0;
                collectSound.play().catch(() => { });
            }

            orbsCollected++;
            if ($orbCounter) $orbCounter.textContent = `${orbsCollected} / ${ORB_COUNT}`;
            sendToController({ type: 'orbs-updated', count: orbsCollected, total: ORB_COUNT });
            if (orbsCollected >= ORB_COUNT) showVictory();
        }
    }
};

const sendToController = (msg) => {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(msg));
    }
};

const showVictory = () => {
    if (!$victoryOverlay) return;
    gameOver = true;
    if (enemyAnimId) { cancelAnimationFrame(enemyAnimId); enemyAnimId = null; }
    $victoryOverlay.classList.add('active');
    spawnConfetti();
    sendToController({ type: 'victory' });
};

const spawnConfetti = () => {
    const container = $victoryOverlay.querySelector('.victory-particles');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#ffd600', '#ff6d00', '#00e5ff', '#7c4dff', '#ff5252', '#69f0ae'];
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'victory-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = -10 + Math.random() * 20 + '%';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDelay = Math.random() * 1.2 + 's';
        p.style.animationDuration = 1.8 + Math.random() * 1.5 + 's';
        container.appendChild(p);
    }
};

const resetGame = () => {
    if ($victoryOverlay) $victoryOverlay.classList.remove('active');
    if ($gameOverOverlay) $gameOverOverlay.classList.remove('active');
    const $pauseOverlay = document.getElementById('pauseOverlay');
    if ($pauseOverlay) $pauseOverlay.classList.remove('active');
    gameOver = false;
    gamePaused = false;
    ballInitialized = false;
    initBall();
};

// ── Pause / Resume ──
const $pauseOverlay = document.getElementById('pauseOverlay');

const pauseGame = () => {
    if (gameOver || gamePaused) return;
    gamePaused = true;
    if (enemyAnimId) { cancelAnimationFrame(enemyAnimId); enemyAnimId = null; }
    bgMusic.pause();
    if ($pauseOverlay) $pauseOverlay.classList.add('active');
    sendToController({ type: 'paused' });
};

const resumeGame = () => {
    if (!gamePaused) return;
    gamePaused = false;
    if ($pauseOverlay) $pauseOverlay.classList.remove('active');
    startEnemyLoop();
    if (soundEnabled) {
        bgMusic.play().catch(() => { });
    }
    sendToController({ type: 'resumed' });
};





// ── Enemies (rode bolletjes) ──
const spawnEnemies = () => {
    // Remove old enemy elements
    $gamePlayground.querySelectorAll('.maze-enemy').forEach(el => el.remove());
    enemies = [];
    if (enemyAnimId) { cancelAnimationFrame(enemyAnimId); enemyAnimId = null; }

    const centerCol = Math.floor(mazeCols / 2);
    const centerRow = Math.floor(mazeRows / 2);
    const usedCells = new Set();
    usedCells.add(`${centerRow},${centerCol}`);
    // Also avoid cells adjacent to center
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            usedCells.add(`${centerRow + dr},${centerCol + dc}`);
        }
    }

    while (enemies.length < ENEMY_COUNT) {
        const r = Math.floor(Math.random() * mazeRows);
        const c = Math.floor(Math.random() * mazeCols);
        const key = `${r},${c}`;
        if (usedCells.has(key)) continue;
        usedCells.add(key);

        const x = mazeOffsetX + c * cellSize + cellSize / 2;
        const y = mazeOffsetY + r * cellSize + cellSize / 2;

        const el = document.createElement('div');
        el.className = 'maze-enemy';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        $gamePlayground.appendChild(el);

        enemies.push({ x, y, el });
    }

    startEnemyLoop();
};

const getOpenNeighbors = (row, col) => {
    const nb = [];
    const cell = mazeGrid[row][col];
    if (!cell.top && row > 0) nb.push({ r: row - 1, c: col });
    if (!cell.bottom && row < mazeRows - 1) nb.push({ r: row + 1, c: col });
    if (!cell.left && col > 0) nb.push({ r: row, c: col - 1 });
    if (!cell.right && col < mazeCols - 1) nb.push({ r: row, c: col + 1 });
    return nb;
};

const moveEnemyTowardPlayer = (enemy) => {
    // Get current grid cell of enemy and player
    const eCol = Math.floor((enemy.x - mazeOffsetX) / cellSize);
    const eRow = Math.floor((enemy.y - mazeOffsetY) / cellSize);
    const pCol = Math.floor((ballState.x - mazeOffsetX) / cellSize);
    const pRow = Math.floor((ballState.y - mazeOffsetY) / cellSize);
    const safeECol = Math.max(0, Math.min(mazeCols - 1, eCol));
    const safeERow = Math.max(0, Math.min(mazeRows - 1, eRow));

    // BFS to find direction toward player
    const target = `${pRow},${pCol}`;
    const start = `${safeERow},${safeECol}`;
    if (start === target) {
        // Same cell — move directly toward ball
        const dx = ballState.x - enemy.x;
        const dy = ballState.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        enemy.x += (dx / dist) * ENEMY_SPEED;
        enemy.y += (dy / dist) * ENEMY_SPEED;
        return;
    }

    const visited = new Set();
    const queue = [{ r: safeERow, c: safeECol, firstR: -1, firstC: -1 }];
    visited.add(start);

    let nextR = safeERow;
    let nextC = safeECol;

    while (queue.length > 0) {
        const cur = queue.shift();
        if (`${cur.r},${cur.c}` === target) {
            nextR = cur.firstR;
            nextC = cur.firstC;
            break;
        }
        for (const nb of getOpenNeighbors(cur.r, cur.c)) {
            const key = `${nb.r},${nb.c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            queue.push({
                r: nb.r, c: nb.c,
                firstR: cur.firstR === -1 ? nb.r : cur.firstR,
                firstC: cur.firstC === -1 ? nb.c : cur.firstC
            });
        }
    }

    // Move toward center of next cell
    const targetX = mazeOffsetX + nextC * cellSize + cellSize / 2;
    const targetY = mazeOffsetY + nextR * cellSize + cellSize / 2;
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    enemy.x += (dx / dist) * ENEMY_SPEED;
    enemy.y += (dy / dist) * ENEMY_SPEED;
};

const startEnemyLoop = () => {
    const MIN_DIST = ENEMY_RADIUS * 3; // minimum separation between enemies
    const tick = () => {
        if (gameOver || gamePaused || !ballInitialized) return;
        for (const enemy of enemies) {
            moveEnemyTowardPlayer(enemy);
        }
        // Push enemies apart if overlapping
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const a = enemies[i];
                const b = enemies[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
                if (dist < MIN_DIST) {
                    const overlap = (MIN_DIST - dist) / 2;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    a.x -= nx * overlap;
                    a.y -= ny * overlap;
                    b.x += nx * overlap;
                    b.y += ny * overlap;
                }
            }
        }
        for (const enemy of enemies) {
            enemy.el.style.left = enemy.x + 'px';
            enemy.el.style.top = enemy.y + 'px';
        }
        enemyAnimId = requestAnimationFrame(tick);
    };
    enemyAnimId = requestAnimationFrame(tick);
};

const checkEnemyCollision = () => {
    if (gameOver) return;
    const ballRadius = 12;
    for (const enemy of enemies) {
        const dx = ballState.x - enemy.x;
        const dy = ballState.y - enemy.y;
        if (dx * dx + dy * dy < (ballRadius + ENEMY_RADIUS) * (ballRadius + ENEMY_RADIUS)) {
            triggerGameOver();
            return;
        }
    }
};

const triggerGameOver = () => {
    gameOver = true;
    if (enemyAnimId) { cancelAnimationFrame(enemyAnimId); enemyAnimId = null; }
    bgMusic.pause();
    if ($gameOverOverlay) $gameOverOverlay.classList.add('active');
    sendToController({ type: 'game-over' });
};

const renderMaze = () => {
    const canvas = document.getElementById('mazeCanvas');
    if (!canvas) return;
    const w = $gamePlayground.clientWidth;
    const h = $gamePlayground.clientHeight;
    canvas.width = w;
    canvas.height = h;
    canvas.style.cssText = 'position:absolute;inset:0;z-index:5;';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(124, 77, 255, 0.55)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    for (let r = 0; r < mazeRows; r++) {
        for (let c = 0; c < mazeCols; c++) {
            const cell = mazeGrid[r][c];
            const x = mazeOffsetX + c * cellSize;
            const y = mazeOffsetY + r * cellSize;
            if (cell.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
            if (cell.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
            if (c === mazeCols - 1 && cell.right) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
            if (r === mazeRows - 1 && cell.bottom) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
        }
    }
};

// ── Collision met doolhof muren ──
const checkMazeCollision = (newX, newY, radius) => {
    if (mazeGrid.length === 0) return { x: newX, y: newY };

    let x = newX;
    let y = newY;

    // Clamp to maze outer bounds
    const left = mazeOffsetX + radius;
    const right = mazeOffsetX + mazeCols * cellSize - radius;
    const top = mazeOffsetY + radius;
    const bottom = mazeOffsetY + mazeRows * cellSize - radius;
    x = Math.max(left, Math.min(right, x));
    y = Math.max(top, Math.min(bottom, y));

    // Grid cell the ball center is in
    const col = Math.floor((x - mazeOffsetX) / cellSize);
    const row = Math.floor((y - mazeOffsetY) / cellSize);
    const safeCol = Math.max(0, Math.min(mazeCols - 1, col));
    const safeRow = Math.max(0, Math.min(mazeRows - 1, row));
    const cell = mazeGrid[safeRow][safeCol];

    const cellLeft = mazeOffsetX + safeCol * cellSize;
    const cellTop = mazeOffsetY + safeRow * cellSize;
    const cellRight = cellLeft + cellSize;
    const cellBottom = cellTop + cellSize;

    // Push ball away from walls
    if (cell.top && y - radius < cellTop) y = cellTop + radius;
    if (cell.bottom && y + radius > cellBottom) y = cellBottom - radius;
    if (cell.left && x - radius < cellLeft) x = cellLeft + radius;
    if (cell.right && x + radius > cellRight) x = cellRight - radius;

    return { x, y };
};

const initBall = () => {
    if (!$gamePlayground) return;
    generateMaze();
    // Place ball in center cell
    const centerCol = Math.floor(mazeCols / 2);
    const centerRow = Math.floor(mazeRows / 2);
    ballState.x = mazeOffsetX + centerCol * cellSize + cellSize / 2;
    ballState.y = mazeOffsetY + centerRow * cellSize + cellSize / 2;
    ballState.vx = 0;
    ballState.vy = 0;
    ballInitialized = true;
    gameOver = false;
    updateBallPosition();
};

const updateBallPosition = () => {
    if (!$gameBall) return;
    $gameBall.style.left = ballState.x + 'px';
    $gameBall.style.top = ballState.y + 'px';
};

const handleTilt = (() => {
    let lastTiltTime = 0;
    const TILT_INTERVAL = 16; // ~60fps cap

    return (beta, gamma) => {
        const now = performance.now();
        if (now - lastTiltTime < TILT_INTERVAL) return;
        lastTiltTime = now;

        if (!$gamePlayground) return;
        if (gameOver || gamePaused) return;
        if (!ballInitialized) return;

        // Update debug HUD
        if ($tiltDebug) $tiltDebug.textContent = `Tilt: ${Math.round(beta)}° / ${Math.round(gamma)}°`;

        // Physics: tilt -> acceleration
        const sensitivity = 0.18;
        const friction = 0.89;
        const maxSpeed = 6;

        // gamma controls X (left/right), beta controls Y (forward/back)
        const ax = gamma * sensitivity;
        const ay = (beta - 30) * sensitivity; // offset: phone held at ~30° = neutral

        ballState.vx = Math.max(-maxSpeed, Math.min(maxSpeed, (ballState.vx + ax) * friction));
        ballState.vy = Math.max(-maxSpeed, Math.min(maxSpeed, (ballState.vy + ay) * friction));

        ballState.x += ballState.vx;
        ballState.y += ballState.vy;

        // Maze wall collision
        const ballRadius = 12;
        const clamped = checkMazeCollision(ballState.x, ballState.y, ballRadius);
        if (clamped.x !== ballState.x) ballState.vx = 0;
        if (clamped.y !== ballState.y) ballState.vy = 0;
        ballState.x = clamped.x;
        ballState.y = clamped.y;

        // Clamp to playground bounds
        const pad = 12;
        ballState.x = Math.max(pad, Math.min($gamePlayground.clientWidth - pad, ballState.x));
        ballState.y = Math.max(pad, Math.min($gamePlayground.clientHeight - pad, ballState.y));

        updateBallPosition();
        checkOrbCollision();
        checkEnemyCollision();
    };
})();

// ── Countdown-overlay voor het desktop-scherm ──
const startCountdown = () => {
    const overlay = document.getElementById('countdownOverlay');
    const numEl = document.getElementById('countdownNumber');
    const circle = document.getElementById('countdownCircle');
    const circumference = 2 * Math.PI * 109; // ~685

    overlay.classList.add('active');
    let count = 3;
    numEl.textContent = count;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = '0';

    const tick = () => {
        count--;
        if (count > 0) {
            numEl.style.animation = 'none';
            void numEl.offsetWidth; // reflow
            numEl.style.animation = 'countPop .5s ease-out';
            numEl.textContent = count;
            circle.style.strokeDashoffset = String(circumference * (1 - count / 3));
            setTimeout(tick, 1000);
        } else {
            numEl.style.animation = 'none';
            void numEl.offsetWidth;
            numEl.style.animation = 'countPop .5s ease-out';
            numEl.textContent = 'GO!';
            circle.style.strokeDashoffset = String(circumference);
            setTimeout(() => {
                overlay.classList.remove('active');
                document.getElementById('gameScreen').classList.add('active');
                initBall();
                if (soundEnabled) {
                    bgMusic.play().catch(() => { });
                }
            }, 800);
        }
    };
    setTimeout(tick, 1000);
};

// ── WebRTC verbinding, signalling en init voor het desktop-scherm ──
const handleDisconnect = () => {
    console.log('Controller disconnected!');
    const overlay = document.getElementById('disconnectOverlay');
    const timerEl = document.getElementById('disconnectTimer');
    overlay.classList.add('active');

    let sec = 4;
    timerEl.textContent = `Terug in ${sec}s…`;
    const iv = setInterval(() => {
        sec--;
        if (sec > 0) {
            timerEl.textContent = `Terug in ${sec}s…`;
        } else {
            clearInterval(iv);
            // Reset everything
            overlay.classList.remove('active');
            document.getElementById('countdownOverlay').classList.remove('active');
            document.getElementById('gameScreen').classList.remove('active');
            bgMusic.pause();
            bgMusic.currentTime = 0;
            $cursor.style.display = 'none';
            $statusDot.classList.remove('connected');
            $status.textContent = 'Wachten op controller…';
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
            ballInitialized = false;
        }
    }, 1000);
};

const answerPeerOffer = async (offer, peerId) => {
    if (peerConnection) peerConnection.close();
    peerConnection = new RTCPeerConnection(servers);

    peerConnection.onicecandidate = (e) => {
        socket.emit('peerIce', peerId, e.candidate);
    };

    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('Connection state:', state);
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            handleDisconnect();
        }
    };

    peerConnection.ondatachannel = (e) => {
        console.log('Data channel received:', e.channel.label);
        dataChannel = e.channel;
        dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'cursor') {
                $cursor.style.display = 'block';
                $cursor.style.left = `${message.x * window.innerWidth}px`;
                $cursor.style.top = `${message.y * window.innerHeight}px`;
            } else if (message.type === 'tilt') {
                handleTilt(message.beta, message.gamma);
            } else if (message.type === 'countdown-ready') {
                startCountdown();
            } else if (message.type === 'pause') {
                pauseGame();
            } else if (message.type === 'resume') {
                resumeGame();
            } else if (message.type === 'play-again') {
                resetGame();
            } else if (message.type === 'toggle-sound') {
                unlockAudio();
                setSoundEnabled(!soundEnabled);
            }
        };
        dataChannel.onopen = () => {
            console.log('Data channel open!');
            $statusDot.classList.add('connected');
            // Tell the controller we're connected; it may show permission screen first
            dataChannel.send(JSON.stringify({ type: 'countdown-start' }));
            dataChannel.send(JSON.stringify({ type: 'sound-state', enabled: soundEnabled }));
            dataChannel.send(JSON.stringify({ type: 'room-code', code: roomCode }));
            $status.textContent = 'Controller verbonden!';
        };
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('peerAnswer', peerId, answer);
};

const init = () => {
    socket = io.connect('/');

    socket.on('connect', () => {
        console.log(`Connected: ${socket.id}`);
        $status.textContent = 'Wachten op controller…';

        const url = `${new URL(`/controller.html?id=${socket.id}`, window.location)}`;
        $controllerLink.href = url;
        $controllerLink.textContent = url;

        const typeNumber = 4;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(url);
        qr.make();
        document.getElementById('qr').innerHTML = qr.createImgTag(6);
    });

    socket.on('room-code', (code) => {
        roomCode = code;
        const $roomCode = document.getElementById('roomCode');
        if ($roomCode) $roomCode.textContent = `Room: ${code}`;
        const $gameRoomCode = document.getElementById('gameRoomCode');
        if ($gameRoomCode) $gameRoomCode.textContent = `Room: ${code}`;
    });

    socket.on('peerOffer', async (myId, offer, peerId) => {
        console.log(`Received peerOffer from ${peerId}`);
        await answerPeerOffer(offer, peerId);
    });

    socket.on('peerAnswer', async (myId, answer, peerId) => {
        console.log(`Received peerAnswer from ${peerId}`);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    socket.on('peerIce', async (myId, candidate, peerId) => {
        if (!candidate || !peerConnection) return;
        console.log(`Received peerIce from ${peerId}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
};

init();
