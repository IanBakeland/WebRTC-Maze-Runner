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

io.on('connection', socket => {
    console.log(`Connection: ${socket.id}`);

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
