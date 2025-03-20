import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
const rooms = new Map();
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    socket.on('createRoom', (playerName) => {
        const roomId = Math.random().toString(36).substring(7);
        const room = {
            id: roomId,
            players: [{
                    id: socket.id,
                    name: playerName,
                    seat: 0,
                    chips: 1000
                }],
            gameState: {
                stage: 'waiting',
                pot: 0,
                communityCards: [],
                currentTurn: 0,
                dealerPosition: 0
            }
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, room });
    });
    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        if (room.players.length >= 8) {
            socket.emit('error', 'Room is full');
            return;
        }
        // Find next available seat
        const takenSeats = new Set(room.players.map(p => p.seat));
        let nextSeat = 0;
        while (takenSeats.has(nextSeat))
            nextSeat++;
        const newPlayer = {
            id: socket.id,
            name: data.playerName,
            seat: nextSeat,
            chips: 1000
        };
        room.players.push(newPlayer);
        socket.join(data.roomId);
        io.to(data.roomId).emit('roomUpdate', room);
    });
    socket.on('leaveRoom', (roomId) => {
        const room = rooms.get(roomId);
        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            if (room.players.length === 0) {
                rooms.delete(roomId);
            }
            else {
                io.to(roomId).emit('roomUpdate', room);
            }
        }
        socket.leave(roomId);
    });
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        rooms.forEach((room, roomId) => {
            if (room.players.some(p => p.id === socket.id)) {
                room.players = room.players.filter(p => p.id !== socket.id);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
                else {
                    io.to(roomId).emit('roomUpdate', room);
                }
            }
        });
    });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
