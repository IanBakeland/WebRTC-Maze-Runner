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
const ballState = { x: 0, y: 0, vx: 0, vy: 0 };
let ballInitialized = false;

const initBall = () => {
    const pg = document.getElementById('gamePlayground');
    if (!pg) return;
    ballState.x = pg.clientWidth / 2;
    ballState.y = pg.clientHeight / 2;
    ballState.vx = 0;
    ballState.vy = 0;
    ballInitialized = true;
    updateBallPosition();
};

const updateBallPosition = () => {
    const ball = document.getElementById('gameBall');
    if (!ball) return;
    ball.style.left = ballState.x + 'px';
    ball.style.top = ballState.y + 'px';
};

const handleTilt = (beta, gamma) => {
    // beta = front/back tilt (-180..180), gamma = left/right (-90..90)
    const pg = document.getElementById('gamePlayground');
    if (!pg) return;

    if (!ballInitialized) initBall();

    // Update debug HUD
    const dbg = document.getElementById('tiltDebug');
    if (dbg) dbg.textContent = `Tilt: ${Math.round(beta)}° / ${Math.round(gamma)}°`;

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

    // Clamp to playground bounds
    const pad = 12;
    ballState.x = Math.max(pad, Math.min(pg.clientWidth - pad, ballState.x));
    ballState.y = Math.max(pad, Math.min(pg.clientHeight - pad, ballState.y));

    updateBallPosition();
};

// ── Countdown-overlay voor het desktop-scherm ──
const startCountdown = (channel) => {
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
                startCountdown(channel);
            }
        };
        channel.onopen = () => {
            console.log('Data channel open!');
            $status.textContent = 'Controller verbonden!';
            $statusDot.classList.add('connected');
            // Tell the controller we're connected; it may show permission screen first
            channel.send(JSON.stringify({ type: 'countdown-start' }));
            $status.textContent = 'Wachten op controller…';
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
