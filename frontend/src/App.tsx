import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Import Components
import HomePage from './components/HomePage';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import ChatArea from './components/ChatArea';
import QRModal from './components/QRModal';
import SearchTab from './components/SearchTab';
import NewRoomTab from './components/NewRoomTab';
import SettingsTab from './components/SettingsTab';
import Pattern from './components/backgroundPattern';

const socket = io(import.meta.env.VITE_API_URL);

function App() {
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [showHomePage, setShowHomePage] = useState(true);
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
    const [roomFromUrl, setRoomFromUrl] = useState(false);
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const roomCode = queryParams.get('room');
        if (roomCode) {
            setRoom(roomCode);
            setRoomFromUrl(true);
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

        const handleJoinResponse = (response: { success: boolean, error?: string }) => {
            if (response.success) {
                setShowChat(true);
                setError('');
            } else {
                setError(response.error || 'Failed to join space');
            }
        };

        if (isCreating) {
            socket.emit('create_room', room);
            socket.emit('join_room', { room, username }, handleJoinResponse);
        } else {
            socket.emit('check_room', room, (response: { exists: boolean }) => {
                if (response.exists) {
                    socket.emit('join_room', { room, username }, handleJoinResponse);
                } else {
                    setError('Room does not exist or has expired');
                }
            });
        }
    };

    const sendMessage = async (msg: string, replyTo?: any, fileInfo?: any) => {
        if (msg !== '' || fileInfo) {
            const messageData = {
                id: username + '-' + Date.now(),
                room: room,
                author: username,
                message: msg,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes().toString().padStart(2, '0'),
                replyTo: replyTo || null,
                fileInfo: fileInfo || null
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

    const leaveRoom = () => {
        socket.emit('leave_room', room);
        setShowChat(false);
        setRoom('');
        setMessageList([]);
        if (roomFromUrl) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setRoomFromUrl(false);
        }
    };

    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    const handleHomePageNavigate = (action: 'join' | 'create') => {
        if (action === 'create') {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            setRoom(code);
            setIsCreatingRoom(true);
        } else {
            setIsCreatingRoom(false);
            if (!roomFromUrl) {
                setRoom('');
            }
        }
        setShowHomePage(false);
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
        
        const handleChatHistory = (messages: any[]) => {
            setMessageList(messages);
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('room_update', handleRoomUpdate);
        socket.on('typing_update', handleTypingUpdate);
        socket.on('chat_history', handleChatHistory);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('room_update', handleRoomUpdate);
            socket.off('typing_update', handleTypingUpdate);
            socket.off('chat_history', handleChatHistory);
        };
    }, [username]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList]);

    return (
        <>
            <Pattern />
            {showHomePage ? (
                <HomePage
                    onNavigate={handleHomePageNavigate}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                />
            ) : !showChat ? (
                <Login
                    username={username}
                    setUsername={setUsername}
                    room={room}
                    setRoom={setRoom}
                    joinRoom={joinRoom}
                    isCreatingInitial={isCreatingRoom}
                    error={error}
                    roomFromUrl={roomFromUrl}
                    socket={socket}
                    onBack={() => setShowHomePage(true)}
                />
            ) : (
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
                            onLogout={leaveRoom}
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
            )}
        </>
    );
}

export default App;
