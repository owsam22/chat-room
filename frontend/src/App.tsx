import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Import Components
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import ChatArea from './components/ChatArea';
import QRModal from './components/QRModal';
import SearchTab from './components/SearchTab';
import NewRoomTab from './components/NewRoomTab';
import SettingsTab from './components/SettingsTab';

const socket = io(import.meta.env.VITE_API_URL);

function App() {
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [messageList, setMessageList] = useState<any[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'search', 'newRoom', 'settings'
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [error, setError] = useState('');
    const [participantCount, setParticipantCount] = useState(0);
    const [roomUsers, setRoomUsers] = useState<string[]>([]);
    const [typists, setTypists] = useState<string[]>([]);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('quickchat-theme') === 'dark';
    });

    const bottomRef = useRef<HTMLDivElement>(null);

    // Parse URL for room code
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const roomCode = queryParams.get('room');
        if (roomCode) {
            setRoom(roomCode);
        }
    }, []);

    // Apply Theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('quickchat-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const joinRoom = (isCreating = false) => {
        if (username === '') {
            setError('Please enter a display name');
            return;
        }
        if (room === '') {
            setError('Please enter a room code');
            return;
        }

        if (isCreating) {
            socket.emit('create_room', room);
            socket.emit('join_room', { room, username });
            setShowChat(true);
            setError('');
        } else {
            socket.emit('check_room', room, (response: { exists: boolean }) => {
                if (response.exists) {
                    socket.emit('join_room', { room, username });
                    setShowChat(true);
                    setError('');
                } else {
                    setError('Room does not exist or has expired');
                }
            });
        }
    };

    const sendMessage = async (msg: string, replyTo?: any) => {
        if (msg !== '') {
            const messageData = {
                id: username + '-' + Date.now(),
                room: room,
                author: username,
                message: msg,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes().toString().padStart(2, '0'),
                replyTo: replyTo || null
            };

            await socket.emit('send_message', messageData);
            setMessageList((list) => [...list, messageData]);
        }
    };

    const copyToClipboard = () => {
        const shareLink = `${window.location.origin}${window.location.pathname}?room=${room}`;
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Join my QuickChat Room',
            text: `Hey! Join my chat room #${room} on QuickChat.`,
            url: `${window.location.origin}${window.location.pathname}?room=${room}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
                // Fallback to WhatsApp link if share fails or cancelled
                const waUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
                window.open(waUrl, '_blank');
            }
        } else {
            // Default to WhatsApp if Web Share API not supported
            const waUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
            window.open(waUrl, '_blank');
        }
    };

    useEffect(() => {
        const handleReceiveMessage = (data: any) => {
            setMessageList((list) => [...list, data]);
        };

        const handleRoomUpdate = (data: { count: number, users: string[] }) => {
            setParticipantCount(data.count);
            setRoomUsers(data.users);
        };

        const handleTypingUpdate = (data: { typists: string[] }) => {
            setTypists(data.typists.filter(u => u !== username));
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('room_update', handleRoomUpdate);
        socket.on('typing_update', handleTypingUpdate);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('room_update', handleRoomUpdate);
            socket.off('typing_update', handleTypingUpdate);
        };
    }, [username]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList]);

    if (!showChat) {
        return (
            <Login
                username={username}
                setUsername={setUsername}
                room={room}
                setRoom={setRoom}
                joinRoom={joinRoom}
                error={error}
            />
        );
    }

    return (
        <div className="chat-window-container glass-card">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                room={room}
            />

            {activeTab === 'chat' && (
                <ChatArea
                    room={room}
                    username={username}
                    participantCount={participantCount}
                    roomUsers={roomUsers}
                    typists={typists}
                    socket={socket}
                    messageList={messageList}
                    currentMessage={currentMessage}
                    setCurrentMessage={setCurrentMessage}
                    sendMessage={sendMessage}
                    onMobileMenuToggle={() => setSidebarOpen(true)}
                    onCopyRoomId={copyToClipboard}
                    onShowQR={() => setShowQR(true)}
                    onShare={handleShare}
                    copied={copied}
                    bottomRef={bottomRef}
                />
            )}

            {activeTab === 'search' && <SearchTab onMobileMenuToggle={() => setSidebarOpen(true)} />}
            {activeTab === 'newRoom' && <NewRoomTab onMobileMenuToggle={() => setSidebarOpen(true)} />}
            {activeTab === 'settings' && (
                <SettingsTab
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onMobileMenuToggle={() => setSidebarOpen(true)}
                />
            )}

            {showQR && <QRModal room={room} onClose={() => setShowQR(false)} onShare={handleShare} />}
        </div>
    );
}

export default App;
