const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, replace with your frontend URL
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Track active rooms and their users
const activeRooms = new Map(); // room -> Set of usernames
const typingUsers = new Map(); // room -> Set of usernames

const sendRoomUpdate = (room) => {
    const count = io.sockets.adapter.rooms.get(room)?.size || 0;
    const users = Array.from(activeRooms.get(room) || []);
    io.in(room).emit('room_update', { count, users });
};

const sendTypingUpdate = (room) => {
    const typists = Array.from(typingUsers.get(room) || []);
    io.in(room).emit('typing_update', { typists });
};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Verify if room exists
    socket.on('check_room', (room, callback) => {
        const exists = activeRooms.has(room);
        callback({ exists });
    });

    socket.on('create_room', (room) => {
        if (!activeRooms.has(room)) {
            activeRooms.set(room, new Set());
            typingUsers.set(room, new Set());
        }
        console.log(`Room Created: ${room}`);
    });

    socket.on('join_room', (data) => {
        const { room, username } = data;

        // Ensure room is marked as active when joined
        if (!activeRooms.has(room)) {
            activeRooms.set(room, new Set());
            typingUsers.set(room, new Set());
        }

        // Store user info in socket
        socket.username = username;
        socket.room = room;

        activeRooms.get(room).add(username);

        socket.join(room);
        console.log(`User ${username} with ID: ${socket.id} joined room: ${room}`);

        // Send updated info to room
        sendRoomUpdate(room);

        // Notify others in the room
        socket.to(room).emit('receive_message', {
            id: 'sys-' + Date.now(),
            author: 'System',
            message: `${username} has joined the conversation`,
            time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes().toString().padStart(2, '0'),
            isSystem: true
        });
    });

    socket.on('send_message', (data) => {
        // Just relay the data, including room ID, author, message, time, id, and optional replyTo
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('typing_status', (data) => {
        const { room, username, isTyping } = data;
        const typists = typingUsers.get(room);
        if (typists) {
            if (isTyping) {
                typists.add(username);
            } else {
                typists.delete(username);
            }
            sendTypingUpdate(room);
        }
    });

    socket.on('disconnecting', () => {
        const username = socket.username;
        const room = socket.room;

        if (username && room) {
            const roomUsers = activeRooms.get(room);
            if (roomUsers) {
                roomUsers.delete(username);
                // If room empty, we could delete it, but let's keep it for now
                // if (roomUsers.size === 0) activeRooms.delete(room);
            }

            const typists = typingUsers.get(room);
            if (typists) {
                typists.delete(username);
                sendTypingUpdate(room);
            }

            // Notify others
            socket.to(room).emit('receive_message', {
                id: 'sys-' + Date.now(),
                author: 'System',
                message: `${username} has left the conversation`,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes().toString().padStart(2, '0'),
                isSystem: true
            });

            // Delay update slightly to ensure socket is gone from adapter
            setTimeout(() => {
                sendRoomUpdate(room);
            }, 100);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
