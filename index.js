const express = require('express');
const app = express();
const fs = require('fs');
const options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
};
const server = require('https').createServer(options, app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = 3000;

app.use(express.static('public'));

const users = {};

io.on('connection', socket => {
    console.log(`Connection: ${socket.id}`);
    users[socket.id] = {
        id: socket.id
    };

    socket.on('update', (targetSocketId, data) => {
        if (!users[targetSocketId]) {
            return;
        }
        socket.to(targetSocketId).emit('update', data);
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
        delete users[socket.id];
    });
});

server.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
});
