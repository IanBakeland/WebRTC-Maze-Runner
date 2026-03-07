// ── Gedeelde state en DOM-referenties voor de controller ──
let socket, peerConnection, dataChannel, targetSocketId;

const $status = document.getElementById('status');
const $statusDot = document.getElementById('statusDot');
const $statusText = document.getElementById('statusText');

const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const getUrlParameter = name => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// ── Gyroscoop / oriëntatie-afhandeling ──
let orientationActive = false;
let orientationHandler = null;

const requestOrientationPermission = () => {
    return new Promise((resolve) => {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => resolve(response === 'granted'))
                .catch(() => resolve(false));
        } else {
            // Android / desktop — no permission needed
            resolve(true);
        }
    });
};

const startOrientation = () => {
    if (orientationActive) return;
    orientationActive = true;

    orientationHandler = (e) => {
        const beta = e.beta;   // front/back tilt -180..180
        const gamma = e.gamma; // left/right tilt -90..90
        if (beta === null || gamma === null) return;

        // Visualize on tilt dot
        const dot = document.getElementById('tiltDot');
        if (dot) {
            const dx = Math.max(-1, Math.min(1, gamma / 45)) * 50;
            const dy = Math.max(-1, Math.min(1, (beta - 30) / 45)) * 50;
            dot.style.transform = `translate(${dx}px, ${dy}px)`;
        }

        // Send via data channel
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'tilt', beta, gamma }));
        }
    };

    window.addEventListener('deviceorientation', orientationHandler);
};

const stopOrientation = () => {
    if (orientationHandler) {
        window.removeEventListener('deviceorientation', orientationHandler);
        orientationHandler = null;
    }
    orientationActive = false;
};

// ── Permissie-flow en countdown voor de controller ──
const needsPermission = typeof DeviceOrientationEvent.requestPermission === 'function';
let permissionGranted = false;

const onConnected = () => {
    if (needsPermission && !permissionGranted) {
        showScreen('permScreen');
    } else {
        startCountdown();
    }
};

document.getElementById('permBtn').addEventListener('click', async () => {
    const granted = await requestOrientationPermission();
    permissionGranted = granted;
    startCountdown();
});

const startCountdown = () => {
    // Tell desktop to start its countdown now
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'countdown-ready' }));
    }

    showScreen('countdownScreen');
    const numEl = document.getElementById('countdownNumber');
    const circle = document.getElementById('countdownCircle');
    const circumference = 2 * Math.PI * 89; // ~559

    let count = 3;
    numEl.textContent = count;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = '0';

    const tick = () => {
        count--;
        if (count > 0) {
            numEl.style.animation = 'none';
            void numEl.offsetWidth;
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
                showScreen('controlsScreen');
                startOrientation();
            }, 800);
        }
    };
    setTimeout(tick, 1000);
};

// ── WebRTC verbinding, signalling en init voor de controller ──
const handleDisconnect = () => {
    console.log('Desktop disconnected!');
    showScreen('disconnectScreen');
    $statusDot.classList.remove('connected');
    $statusText.textContent = 'Verbroken';

    let sec = 4;
    const timerEl = document.getElementById('disconnectTimer');
    timerEl.textContent = `Terug in ${sec}s…`;
    const iv = setInterval(() => {
        sec--;
        if (sec > 0) {
            timerEl.textContent = `Terug in ${sec}s…`;
        } else {
            clearInterval(iv);
            // Reset and go back to connect screen
            showScreen('connectScreen');
            $status.textContent = 'Opnieuw verbinden…';
            $statusText.textContent = 'Verbinden…';
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
            dataChannel = null;
            stopOrientation();
            // Re-attempt connection
            callPeer(targetSocketId);
        }
    }, 1000);
};

const callPeer = async (peerId) => {
    if (peerConnection) peerConnection.close();
    peerConnection = new RTCPeerConnection(servers);

    dataChannel = peerConnection.createDataChannel('control');
    dataChannel.onopen = () => {
        console.log('Data channel open!');
        $statusText.textContent = 'Verbonden';
        $statusDot.classList.add('connected');
    };

    dataChannel.onclose = () => {
        console.log('Data channel closed');
        handleDisconnect();
    };

    dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'countdown-start') {
            onConnected();
        }
    };

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

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('peerOffer', peerId, offer);
};

const sendCursorData = (x, y) => {
    if (!dataChannel || dataChannel.readyState !== 'open') return;
    dataChannel.send(JSON.stringify({ type: 'cursor', x, y }));
};

const init = () => {
    targetSocketId = getUrlParameter('id');
    if (!targetSocketId) {
        $status.textContent = 'Geen desktop-ID gevonden';
        return;
    }

    socket = io.connect('/');

    socket.on('connect', () => {
        console.log(`Connected: ${socket.id}`);
        $status.textContent = 'Verbinden met desktop…';
        $statusText.textContent = 'Signalling…';
        callPeer(targetSocketId);
    });

    socket.on('peerAnswer', async (myId, answer, peerId) => {
        console.log(`Received peerAnswer from ${peerId}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('peerIce', async (myId, candidate, peerId) => {
        if (!candidate) return;
        console.log(`Received peerIce from ${peerId}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    window.addEventListener('mousemove', e => {
        sendCursorData(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    });

    window.addEventListener('touchmove', e => {
        e.preventDefault();
        sendCursorData(
            e.touches[0].clientX / window.innerWidth,
            e.touches[0].clientY / window.innerHeight
        );
    }, { passive: false });
};

init();
