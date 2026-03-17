import { createParticles } from './particles.js';

// ── Gedeelde state en DOM-referenties voor de controller ──
let socket, peerConnection, dataChannel, targetSocketId;

const $status = document.getElementById('status');
const $statusDot = document.getElementById('statusDot');
const $statusText = document.getElementById('statusText');

createParticles(15);

const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};



const getUrlParameter = name => new URLSearchParams(location.search).get(name) || false;

const showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// ── Gyroscoop / oriëntatie-afhandeling ──
const $tiltDot = document.getElementById('tiltDot');
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

    let lastSendTime = 0;
    const SEND_INTERVAL = 33; // ~30fps max over datachannel

    orientationHandler = (e) => {
        const beta = e.beta;   // front/back tilt -180..180
        const gamma = e.gamma; // left/right tilt -90..90
        if (beta === null || gamma === null) return;

        // Visualize on tilt dot
        if ($tiltDot) {
            const dx = Math.max(-1, Math.min(1, gamma / 45)) * 50;
            const dy = Math.max(-1, Math.min(1, (beta - 30) / 45)) * 50;
            $tiltDot.style.transform = `translate(${dx}px, ${dy}px)`;
        }

        // Throttle data channel sends
        const now = performance.now();
        if (now - lastSendTime < SEND_INTERVAL) return;
        lastSendTime = now;

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

const onConnected = async () => {
    await initFreezeAbility();
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
                // Speech recognition already initialized, just restart
                setFreezeState('ready');
                startRecognition();
            }, 800);
        }
    };
    setTimeout(tick, 1000);
};

// ── Freeze ability: voice command detection ──
const FREEZE_COOLDOWN = 10000;  // 10s cooldown
const FREEZE_ACTIVE = 4000;     // 4s freeze
const RING_CIRCUMFERENCE = 2 * Math.PI * 36; // ~226.2

let freezeState = 'idle'; // idle | ready | active | cooldown
let freezeCooldownStart = 0;
let recognition = null;

const $blowAbility = document.getElementById('blowAbility');
const $blowLabel = document.getElementById('blowLabel');
const $blowRingFill = document.getElementById('blowRingFill');

const setFreezeState = (state) => {
    freezeState = state;
    $blowAbility.classList.remove('ready', 'active', 'cooldown');

    if (state === 'ready') {
        $blowAbility.classList.add('ready');
        $blowLabel.textContent = 'Zeg "Stop"';
        $blowRingFill.style.strokeDashoffset = '0';
    } else if (state === 'active') {
        $blowAbility.classList.add('active');
        $blowLabel.textContent = 'Bevroren! ❄️';
        $blowRingFill.style.strokeDashoffset = '0';
    } else if (state === 'cooldown') {
        $blowAbility.classList.add('cooldown');
        $blowRingFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
        freezeCooldownStart = performance.now();
        animateCooldownRing();
    }
};

const animateCooldownRing = () => {
    const elapsed = performance.now() - freezeCooldownStart;
    const remaining = Math.max(0, FREEZE_COOLDOWN - elapsed);
    const progress = 1 - remaining / FREEZE_COOLDOWN;
    $blowRingFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));
    const sec = Math.ceil(remaining / 1000);
    $blowLabel.textContent = `Cooldown ${sec}s`;

    if (remaining > 0) {
        requestAnimationFrame(animateCooldownRing);
    } else {
        setFreezeState('ready');
        startRecognition();
    }
};

const triggerFreeze = () => {
    if (freezeState !== 'ready') return;
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'blow' }));
    }
    setFreezeState('active');
    setTimeout(() => {
        setFreezeState('cooldown');
    }, FREEZE_ACTIVE);
};

const startRecognition = () => {
    if (!recognition) return;
    try {
        recognition.start();
    } catch (e) {
        // Already started — ignore
    }
};

const stopRecognition = () => {
    if (!recognition) return;
    try {
        recognition.stop();
    } catch (e) {
        // Not started — ignore
    }
};

const initFreezeAbility = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        $blowLabel.textContent = 'Spraak niet ondersteund';
        return;
    }

    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'nl-NL';

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                if (transcript.includes('stop') || transcript.includes('stap') || transcript.includes('top')) {
                    triggerFreeze();
                    break;
                }
            }
        };

        recognition.onend = () => {
            // Auto-restart if ability is ready
            if (freezeState === 'ready') {
                startRecognition();
            }
        };

        recognition.onerror = (e) => {
            console.warn('Speech recognition error:', e.error);
            if (e.error === 'not-allowed') {
                $blowLabel.textContent = 'Microfoon geweigerd';
                return;
            }
            // Restart on transient errors
            if (freezeState === 'ready') {
                setTimeout(startRecognition, 500);
            }
        };
    }

    setFreezeState('ready');
    startRecognition();
};

const stopFreezeMonitoring = () => {
    stopRecognition();
    freezeState = 'idle';
};

const resetFreezeAbility = () => {
    stopRecognition();
    freezeState = 'idle';
    $blowAbility.classList.remove('ready', 'active', 'cooldown');
    $blowLabel.textContent = 'Zeg "Stop"';
    $blowRingFill.style.strokeDashoffset = '0';
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
        } else if (message.type === 'victory') {
            stopOrientation();
            stopFreezeMonitoring();
            showScreen('victoryScreen');
        } else if (message.type === 'game-over') {
            stopOrientation();
            stopFreezeMonitoring();
            showScreen('gameOverScreen');
        } else if (message.type === 'paused') {
            stopOrientation();
            stopFreezeMonitoring();
            showScreen('pausedScreen');
        } else if (message.type === 'resumed') {
            showScreen('controlsScreen');
            startOrientation();
            initFreezeAbility();
        } else if (message.type === 'game-restart') {
            resetFreezeAbility();
            handlePlayAgain();
        } else if (message.type === 'room-code') {
            const $label = document.getElementById('roomCodeLabel');
            if ($label) $label.textContent = `Room: ${message.code}`;
        } else if (message.type === 'sound-state') {
            const $ctrlSoundBtn = document.getElementById('ctrlSoundBtn');
            if ($ctrlSoundBtn) $ctrlSoundBtn.classList.toggle('muted', !message.enabled);
        } else if (message.type === 'orbs-updated') {
            const $orbCounter = document.getElementById('controlOrbCounter');
            if ($orbCounter) {
                $orbCounter.textContent = `Orbs: ${message.count} / ${message.total}`;
            }
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

const handlePlayAgain = () => {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'play-again' }));
    }
    startCountdown();
};

document.getElementById('ctrlPlayAgainBtn').addEventListener('click', handlePlayAgain);
document.getElementById('ctrlRetryBtn').addEventListener('click', handlePlayAgain);


// ── Sound toggle from controller ──
document.getElementById('ctrlSoundBtn').addEventListener('click', () => {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'toggle-sound' }));
    }
});

// ── Pause / Resume handlers for controller ──
document.getElementById('ctrlPauseBtn').addEventListener('click', () => {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'pause' }));
    }
    stopOrientation();
    showScreen('pausedScreen');
});

document.getElementById('ctrlResumeBtn').addEventListener('click', () => {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'resume' }));
    }
    showScreen('controlsScreen');
    startOrientation();
    resetRestartConfirm();
});

// ── Restart confirmation ──
const $ctrlPauseRestartBtn = document.getElementById('ctrlPauseRestartBtn');
let restartConfirmed = false;

const resetRestartConfirm = () => {
    restartConfirmed = false;
    if ($ctrlPauseRestartBtn) {
        $ctrlPauseRestartBtn.textContent = 'Opnieuw spelen';
        $ctrlPauseRestartBtn.classList.remove('confirm');
    }
};

$ctrlPauseRestartBtn.addEventListener('click', () => {
    if (!restartConfirmed) {
        restartConfirmed = true;
        $ctrlPauseRestartBtn.textContent = 'Weet je het zeker?';
        $ctrlPauseRestartBtn.classList.add('confirm');
        return;
    }
    resetRestartConfirm();
    handlePlayAgain();
});

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
