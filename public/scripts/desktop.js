// ── Gedeelde state en DOM-referenties voor het desktop-scherm ──
const $status = document.getElementById('status');
const $statusDot = document.getElementById('statusDot');
const $cursor = document.getElementById('cursor');
const $controllerLink = document.getElementById('controllerLink');

let socket;
let peerConnection;

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

const generateMaze = () => {
    if (!$gamePlayground) return;
    const w = $gamePlayground.clientWidth;
    const h = $gamePlayground.clientHeight;
    cellSize = 60;
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

    renderMaze();
};

const renderMaze = () => {
    $gamePlayground.querySelectorAll('.maze-wall').forEach(el => el.remove());
    const t = 3; // wall thickness

    const addWall = (x, y, w, h) => {
        const wall = document.createElement('div');
        wall.className = 'maze-wall';
        wall.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
        $gamePlayground.appendChild(wall);
    };

    for (let r = 0; r < mazeRows; r++) {
        for (let c = 0; c < mazeCols; c++) {
            const cell = mazeGrid[r][c];
            const x = mazeOffsetX + c * cellSize;
            const y = mazeOffsetY + r * cellSize;
            // Top wall (horizontal)
            if (cell.top) addWall(x, y - t / 2, cellSize, t);
            // Left wall (vertical)
            if (cell.left) addWall(x - t / 2, y, t, cellSize);
            // Right wall for last column
            if (c === mazeCols - 1 && cell.right) addWall(x + cellSize - t / 2, y, t, cellSize);
            // Bottom wall for last row
            if (r === mazeRows - 1 && cell.bottom) addWall(x, y + cellSize - t / 2, cellSize, t);
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
    updateBallPosition();
};

const updateBallPosition = () => {
    if (!$gameBall) return;
    $gameBall.style.left = ballState.x + 'px';
    $gameBall.style.top = ballState.y + 'px';
};

const handleTilt = (beta, gamma) => {
    // beta = front/back tilt (-180..180), gamma = left/right (-90..90)
    if (!$gamePlayground) return;

    if (!ballInitialized) initBall();

    // Update debug HUD
    if ($tiltDebug) $tiltDebug.textContent = `Tilt: ${Math.round(beta)}° / ${Math.round(gamma)}°`;

    // Physics: tilt -> acceleration
    const sensitivity = 0.4;
    const friction = 0.92;
    const maxSpeed = 12;

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
};

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
        const channel = e.channel;
        channel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'cursor') {
                $cursor.style.display = 'block';
                $cursor.style.left = `${message.x * window.innerWidth}px`;
                $cursor.style.top = `${message.y * window.innerHeight}px`;
            } else if (message.type === 'tilt') {
                handleTilt(message.beta, message.gamma);
            } else if (message.type === 'countdown-ready') {
                startCountdown();
            }
        };
        channel.onopen = () => {
            console.log('Data channel open!');
            $statusDot.classList.add('connected');
            // Tell the controller we're connected; it may show permission screen first
            channel.send(JSON.stringify({ type: 'countdown-start' }));
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
