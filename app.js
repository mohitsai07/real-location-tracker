const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Simple in-memory device store
const devices = {};

app.get('/', (req, res) => {
  res.render('index', { port: process.env.PORT || 3007 });
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('register', (payload) => {
    const { deviceId, name, ua } = payload || {};
    devices[socket.id] = { deviceId: deviceId || socket.id, name: name || 'Unknown', ua: ua || '', socketId: socket.id };
    // broadcast updated device list
    io.emit('devices', Object.values(devices));
  });

  socket.on('location', (data) => {
    // data: { deviceId, lat, lng, accuracy, heading, speed, battery? }
    data.socketId = socket.id;
    devices[socket.id] = Object.assign(devices[socket.id] || {}, { deviceId: data.deviceId, name: data.name, ua: data.ua });
    // Broadcast single device location to all clients
    io.emit('location', data);
  });

  socket.on('status', (data) => {
    // Broadcast status update to all clients
    io.emit('status', { from: data.name, status: data.status, message: data.message, time: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
    delete devices[socket.id];
    io.emit('devices', Object.values(devices));
  });
});

const PORT = process.env.PORT || 3007;
server.listen(PORT, () => console.log('Server listening on port', PORT));