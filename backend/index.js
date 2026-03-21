const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Room State
const activeRooms = new Map();      // room -> Set of usernames
const typingUsers = new Map();      // room -> Set of usernames
const roomMessages = new Map();     // room -> Array of messages

const MAX_MESSAGES = 500;

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

    socket.on('check_room', (room, callback) => {
        const exists = activeRooms.has(room);
        callback({ exists });
    });

    socket.on('create_room', (room) => {
        if (!activeRooms.has(room)) {
            activeRooms.set(room, new Set());
            typingUsers.set(room, new Set());
            roomMessages.set(room, []);
        }
    });

    socket.on('join_room', (data, callback) => {
        const { room, username } = data;

        if (!activeRooms.has(room)) {
            activeRooms.set(room, new Set());
            typingUsers.set(room, new Set());
            roomMessages.set(room, []);
        }

        const roomUsers = activeRooms.get(room);

        const isNameTaken = Array.from(roomUsers).some(
            u => u.toLowerCase() === username.toLowerCase()
        );

        if (isNameTaken) {
            if (callback) callback({ success: false, error: 'Display name already taken in this room' });
            return;
        }

        socket.username = username;
        socket.room = room;

        roomUsers.add(username);
        socket.join(room);

        if (callback) callback({ success: true });

        // 🔥 Send chat history to new user
        socket.emit('chat_history', roomMessages.get(room) || []);

        // System join message
        const systemMessage = {
            id: 'sys-' + Date.now(),
            author: 'System',
            message: `${username} has joined the conversation`,
            time: new Date().getHours() + ":" + new Date().getMinutes().toString().padStart(2, '0'),
            isSystem: true
        };

        const messages = roomMessages.get(room);
        messages.push(systemMessage);

        if (messages.length > MAX_MESSAGES) {
            messages.shift();
        }

        socket.to(room).emit('receive_message', systemMessage);

        sendRoomUpdate(room);
    });

    socket.on('send_message', (data) => {
        const { room } = data;

        if (!roomMessages.has(room)) return;

        const messages = roomMessages.get(room);

        messages.push(data);

        if (messages.length > MAX_MESSAGES) {
            messages.shift();
        }

        socket.to(room).emit('receive_message', data);
    });

    socket.on('webrtc_signal', (data) => {
        const { room } = data;
        socket.to(room).emit('webrtc_signal', data);
    });

    socket.on('typing_status', (data) => {
        const { room, username, isTyping } = data;
        const typists = typingUsers.get(room);

        if (typists) {
            if (isTyping) typists.add(username);
            else typists.delete(username);

            sendTypingUpdate(room);
        }
    });

    socket.on('disconnecting', () => {
        const username = socket.username;
        const room = socket.room;

        if (!username || !room) return;

        const roomUsers = activeRooms.get(room);

        if (roomUsers) {
            roomUsers.delete(username);
        }

        const typists = typingUsers.get(room);
        if (typists) {
            typists.delete(username);
            sendTypingUpdate(room);
        }

        const systemMessage = {
            id: 'sys-' + Date.now(),
            author: 'System',
            message: `${username} has left the conversation`,
            time: new Date().getHours() + ":" + new Date().getMinutes().toString().padStart(2, '0'),
            isSystem: true
        };

        const messages = roomMessages.get(room);
        if (messages) {
            messages.push(systemMessage);
            if (messages.length > MAX_MESSAGES) {
                messages.shift();
            }
        }

        socket.to(room).emit('receive_message', systemMessage);

        setTimeout(() => {
            sendRoomUpdate(room);

            // 🔥 Auto-delete room when empty
            const count = io.sockets.adapter.rooms.get(room)?.size || 0;
            if (count === 0) {
                activeRooms.delete(room);
                typingUsers.delete(room);
                roomMessages.delete(room);
            }

        }, 100);
    });

});

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});