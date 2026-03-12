const express = require('express');
const app = express();
const fs = require('fs');
const os = require('os');
const options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
};
const server = require('https').createServer(options, app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = 3000;

// Geen caching tijdens development
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
app.use(express.static('public'));

// ── Room code generation ──
const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars
const roomCodes = new Map(); // socketId → code

const generateRoomCode = () => {
    let code;
    const existing = new Set(roomCodes.values());
    do {
        code = '';
        for (let i = 0; i < 4; i++) code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
    } while (existing.has(code));
    return code;
};

io.on('connection', socket => {
    const roomCode = generateRoomCode();
    roomCodes.set(socket.id, roomCode);
    console.log(`Connection: ${socket.id} (Room: ${roomCode})`);
    socket.emit('room-code', roomCode);

    socket.on('peerOffer', (peerId, offer) => {
        console.log(`Received peerOffer from ${socket.id} to ${peerId}`);
        io.to(peerId).emit('peerOffer', peerId, offer, socket.id);
    });

    socket.on('peerAnswer', (peerId, answer) => {
        console.log(`Received peerAnswer from ${socket.id} to ${peerId}`);
        io.to(peerId).emit('peerAnswer', peerId, answer, socket.id);
    });

    socket.on('peerIce', (peerId, candidate) => {
        console.log(`Received peerIce from ${socket.id} to ${peerId}`);
        io.to(peerId).emit('peerIce', peerId, candidate, socket.id);
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
        roomCodes.delete(socket.id);
    });
});

server.listen(port, () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`https://${iface.address}:${port}`);
            }
        }
    }
    console.log(`App listening on https://localhost:${port}`);
});
