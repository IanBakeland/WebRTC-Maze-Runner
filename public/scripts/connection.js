// ── Communicatie-laag: WebRTC + Socket.io verbinding ──
// Gedeelde module voor zowel desktop als controller.

const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let socket = null;
let peerConnection = null;
let dataChannel = null;
let callbacks = {};

// ── Publieke API ──

/**
 * Maak een WebRTC-verbinding aan.
 * @param {'desktop'|'controller'} role
 * @param {Object} options
 * @param {string}   [options.targetId]        - (controller) socket-ID van de desktop
 * @param {Function} [options.onMessage]        - callback(msg) bij inkomend DataChannel bericht
 * @param {Function} [options.onOpen]           - callback() wanneer DataChannel open is
 * @param {Function} [options.onClose]          - callback() wanneer verbinding verbreekt
 * @param {Function} [options.onSocketConnect]  - callback(socketId) na Socket.io connect
 * @param {Function} [options.onRoomCode]       - (desktop) callback(code) bij room-code
 */
export const createConnection = (role, options = {}) => {
    callbacks = options;

    socket = io.connect('/');

    socket.on('connect', () => {
        console.log(`[connection] Socket connected: ${socket.id}`);
        if (callbacks.onSocketConnect) callbacks.onSocketConnect(socket.id);

        if (role === 'controller' && options.targetId) {
            _createOffer(options.targetId);
        }
    });

    socket.on('room-code', (code) => {
        if (callbacks.onRoomCode) callbacks.onRoomCode(code);
    });

    socket.on('peerOffer', async (myId, offer, peerId) => {
        console.log(`[connection] Received peerOffer from ${peerId}`);
        if (role === 'desktop') {
            await _answerOffer(offer, peerId);
        }
    });

    socket.on('peerAnswer', async (myId, answer, peerId) => {
        console.log(`[connection] Received peerAnswer from ${peerId}`);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    socket.on('peerIce', async (myId, candidate, peerId) => {
        if (!candidate || !peerConnection) return;
        console.log(`[connection] Received peerIce from ${peerId}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
};

/**
 * Stuur een JSON-bericht via de DataChannel.
 */
export const sendMessage = (msg) => {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(msg));
    }
};

/**
 * Geeft het socket-object terug (voor QR-code URL e.d.).
 */
export const getSocket = () => socket;

/**
 * Sluit de huidige peer connection.
 */
export const closeConnection = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    dataChannel = null;
};

/**
 * Herverbind met een peer (voor controller reconnect-flow).
 */
export const reconnect = (targetId) => {
    closeConnection();
    _createOffer(targetId);
};

// ── Private helpers ──

const _setupConnectionEvents = (peerId) => {
    peerConnection.onicecandidate = (e) => {
        socket.emit('peerIce', peerId, e.candidate);
    };

    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`[connection] Connection state: ${state}`);
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            if (callbacks.onClose) callbacks.onClose();
        }
    };
};

/**
 * Controller: maak een offer en stuur naar de desktop.
 */
const _createOffer = async (peerId) => {
    if (peerConnection) peerConnection.close();
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    dataChannel = peerConnection.createDataChannel('control');
    dataChannel.onopen = () => {
        console.log('[connection] Data channel open (caller)');
        if (callbacks.onOpen) callbacks.onOpen();
    };
    dataChannel.onclose = () => {
        console.log('[connection] Data channel closed (caller)');
        if (callbacks.onClose) callbacks.onClose();
    };
    dataChannel.onmessage = (event) => {
        if (callbacks.onMessage) callbacks.onMessage(JSON.parse(event.data));
    };

    _setupConnectionEvents(peerId);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('peerOffer', peerId, offer);
};

/**
 * Desktop: beantwoord een offer van de controller.
 */
const _answerOffer = async (offer, peerId) => {
    if (peerConnection) peerConnection.close();
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    _setupConnectionEvents(peerId);

    peerConnection.ondatachannel = (e) => {
        console.log('[connection] Data channel received:', e.channel.label);
        dataChannel = e.channel;
        dataChannel.onopen = () => {
            console.log('[connection] Data channel open (answerer)');
            if (callbacks.onOpen) callbacks.onOpen();
        };
        dataChannel.onmessage = (event) => {
            if (callbacks.onMessage) callbacks.onMessage(JSON.parse(event.data));
        };
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('peerAnswer', peerId, answer);
};
