import { createParticles } from './particles.js';
import { createConnection, sendMessage, closeConnection, reconnect } from './connection.js';

// ── DOM-referenties ──
const $status = document.getElementById('status');
const $statusDot = document.getElementById('statusDot');
const $statusText = document.getElementById('statusText');

createParticles(15);

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
            resolve(true);
        }
    });
};

const startOrientation = () => {
    if (orientationActive) return;
    orientationActive = true;

    let lastSendTime = 0;
    const SEND_INTERVAL = 33;

    orientationHandler = (e) => {
        const beta = e.beta;
        const gamma = e.gamma;
        if (beta === null || gamma === null) return;

        if ($tiltDot) {
            const dx = Math.max(-1, Math.min(1, gamma / 45)) * 50;
            const dy = Math.max(-1, Math.min(1, (beta - 30) / 45)) * 50;
            $tiltDot.style.transform = `translate(${dx}px, ${dy}px)`;
        }

        const now = performance.now();
        if (now - lastSendTime < SEND_INTERVAL) return;
        lastSendTime = now;

        sendMessage({ type: 'tilt', beta, gamma });
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

// ── Permissie-flow en countdown ──
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
    sendMessage({ type: 'countdown-ready' });

    showScreen('countdownScreen');
    const numEl = document.getElementById('countdownNumber');
    const circle = document.getElementById('countdownCircle');
    const circumference = 2 * Math.PI * 89;

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
                setFreezeState('ready');
                startRecognition();
            }, 800);
        }
    };
    setTimeout(tick, 1000);
};

// ── Freeze ability: voice command detection ──
const FREEZE_COOLDOWN = 10000;
const FREEZE_ACTIVE = 4000;
const RING_CIRCUMFERENCE = 2 * Math.PI * 36;

let freezeState = 'idle';
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
    sendMessage({ type: 'blow' });
    setFreezeState('active');
    setTimeout(() => {
        setFreezeState('cooldown');
    }, FREEZE_ACTIVE);
};

const startRecognition = () => {
    if (!recognition) return;
    try { recognition.start(); } catch (e) { /* Already started */ }
};

const stopRecognition = () => {
    if (!recognition) return;
    try { recognition.stop(); } catch (e) { /* Not started */ }
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
            if (freezeState === 'ready') startRecognition();
        };

        recognition.onerror = (e) => {
            console.warn('Speech recognition error:', e.error);
            if (e.error === 'not-allowed') {
                $blowLabel.textContent = 'Microfoon geweigerd';
                return;
            }
            if (freezeState === 'ready') setTimeout(startRecognition, 500);
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

// ── Disconnect-afhandeling ──
const targetSocketId = getUrlParameter('id');

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
            showScreen('connectScreen');
            $status.textContent = 'Opnieuw verbinden…';
            $statusText.textContent = 'Verbinden…';
            stopOrientation();
            reconnect(targetSocketId);
        }
    }, 1000);
};

// ── DataChannel bericht-handler ──
const handleMessage = (message) => {
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

// ── Cursor data ──
const sendCursorData = (x, y) => {
    sendMessage({ type: 'cursor', x, y });
};

// ── Play again ──
const handlePlayAgain = () => {
    sendMessage({ type: 'play-again' });
    startCountdown();
};

document.getElementById('ctrlPlayAgainBtn').addEventListener('click', handlePlayAgain);
document.getElementById('ctrlRetryBtn').addEventListener('click', handlePlayAgain);

// ── Sound toggle ──
document.getElementById('ctrlSoundBtn').addEventListener('click', () => {
    sendMessage({ type: 'toggle-sound' });
});

// ── Pause / Resume ──
document.getElementById('ctrlPauseBtn').addEventListener('click', () => {
    sendMessage({ type: 'pause' });
    stopOrientation();
    showScreen('pausedScreen');
});

document.getElementById('ctrlResumeBtn').addEventListener('click', () => {
    sendMessage({ type: 'resume' });
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

// ── Init: verbinding opzetten via de communicatie-laag ──
const init = () => {
    if (!targetSocketId) {
        $status.textContent = 'Geen desktop-ID gevonden';
        return;
    }

    createConnection('controller', {
        targetId: targetSocketId,
        onOpen: () => {
            $statusText.textContent = 'Verbonden';
            $statusDot.classList.add('connected');
        },
        onClose: handleDisconnect,
        onMessage: handleMessage,
        onSocketConnect: () => {
            $status.textContent = 'Verbinden met desktop…';
            $statusText.textContent = 'Signalling…';
        }
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
