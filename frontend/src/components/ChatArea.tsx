import React from 'react';
import { Menu, Zap, User, Copy, QrCode, PlusSquare, Send, CheckCircle2, Hash, Share2, X, Reply, Paperclip, File, Download, Loader2, LogOut } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

interface Message {
    id: string;
    author: string;
    message: string;
    time: string;
    isSystem?: boolean;
    replyTo?: {
        id: string;
        author: string;
        message: string;
    } | null;
    fileInfo?: {
        fileId: string;
        name: string;
        size: number;
        type: string;
    } | null;
}

interface ChatAreaProps {
    room: string;
    username: string;
    socket: any;
    messageList: Message[];
    currentMessage: string;
    setCurrentMessage: (msg: string) => void;
    sendMessage: (msg: string, replyTo?: any, fileInfo?: any) => void;
    onMobileMenuToggle: () => void;
    onCopyRoomId: () => void;
    onShowQR: () => void;
    onShare: () => void;
    onLogout: () => void;
    copied: boolean;
    bottomRef: React.RefObject<HTMLDivElement>;
    participantCount: number;
    roomUsers: string[];
    typists: string[];
}

const ChatArea: React.FC<ChatAreaProps> = ({
    room,
    username,
    socket,
    messageList,
    currentMessage,
    setCurrentMessage,
    sendMessage,
    onMobileMenuToggle,
    onCopyRoomId,
    onShowQR,
    onShare,
    onLogout,
    copied,
    bottomRef,
    participantCount,
    roomUsers,
    typists
}) => {
    const [showMembers, setShowMembers] = React.useState(false);
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [replyTo, setReplyTo] = React.useState<Message | null>(null);
    const typingTimeoutRef = React.useRef<any>(null);
    const userMenuRef = React.useRef<HTMLDivElement>(null);

    const { sharedFiles, sendFile, requestFile } = useWebRTC(socket, room, username, roomUsers);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Swipe state
    const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
    const [swipeDistance, setSwipeDistance] = React.useState<{ [key: string]: number }>({});

    // Close user menu on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTouchStart = (e: React.TouchEvent, msgId: string) => setTouchStartX(e.touches[0].clientX);

    const handleTouchMove = (e: React.TouchEvent, msg: Message) => {
        if (touchStartX === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX;
        const isOwn = msg.author === username;

        if (!isOwn && diff > 0 && diff < 80) {
            setSwipeDistance(prev => ({ ...prev, [msg.id]: diff }));
        } else if (isOwn && diff < 0 && diff > -80) {
            setSwipeDistance(prev => ({ ...prev, [msg.id]: diff }));
        }
    };

    const handleTouchEnd = (msg: Message) => {
        const dist = swipeDistance[msg.id] || 0;
        const isOwn = msg.author === username;

        if ((!isOwn && dist > 40) || (isOwn && dist < -40)) {
            setReplyTo(msg);
        }
        setTouchStartX(null);
        setSwipeDistance(prev => ({ ...prev, [msg.id]: 0 }));
    };

    const getAuthorColor = (name: string) => {
        const colors = ['var(--user-1)', 'var(--user-2)', 'var(--user-3)', 'var(--user-4)', 'var(--user-5)', 'var(--user-6)'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentMessage(e.target.value);
        socket.emit('typing_status', { room, username, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => socket.emit('typing_status', { room, username, isTyping: false }), 2000);
    };

    const handleSend = () => {
        if (currentMessage.trim() === '') return;
        sendMessage(currentMessage, replyTo ? { id: replyTo.id, author: replyTo.author, message: replyTo.message } : null);
        setCurrentMessage('');
        setReplyTo(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_status', { room, username, isTyping: false });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileMeta = await sendFile(file);
            sendMessage(file.name, null, fileMeta);
            e.target.value = '';
        }
    };

    const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

    return (
        <div className="chat-main">
            <div className="chat-header">
                <div className="chat-header-left">
                    <button className="mobile-toggle" onClick={onMobileMenuToggle}><Menu size={20} /></button>
                    <div className="chat-room-info" onClick={() => setShowMembers(!showMembers)}>
                        <h3>#{room}</h3>
                        <div className="room-badge">
                            <Zap size={14} color='#00d000ff' className="text-primary" /> {participantCount} Online
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="room-id-chip" onClick={onCopyRoomId} title="Copy Share Link">
                        <Hash size={16} className="text-primary" />
                        <span>{room}</span>
                        {copied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
                    </div>
                    <button className="icon-btn share-btn desktop-only" onClick={onShare}><Share2 size={18} /></button>
                    <button className="icon-btn" onClick={onShowQR}><QrCode size={18} /></button>
                    <div className="user-profile-wrapper" ref={userMenuRef}>
                        <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
                            <span className="desktop-only" style={{ fontWeight: 600 }}>{username}</span>
                            <div className="avatar-circle">{username.charAt(0).toUpperCase()}</div>
                        </div>
                        {showUserMenu && (
                            <div className="user-dropdown">
                                <div className="dropdown-info">
                                    <div className="dropdown-user-name">{username}</div>
                                    <div className="dropdown-user-status">Online</div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item logout" onClick={onLogout}>
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showMembers && (
                <div className="members-overlay">
                    <div className="members-header">
                        <span style={{ fontWeight: 700 }}>Active Members ({participantCount})</span>
                        <button className="icon-btn" onClick={() => setShowMembers(false)}><X size={16} /></button>
                    </div>
                    <div className="members-list">
                        {roomUsers.map((user, idx) => (
                            <div key={idx} className="member-item">
                                <div className="member-status-dot"></div>
                                <span>{user} {user === username ? '(You)' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="message-container">
                {messageList.map((msg) => {
                    const localFile = msg.fileInfo ? sharedFiles.find(f => f.id === msg.fileInfo?.fileId) : null;
                    return (
                        <div
                            key={msg.id}
                            className={`message-wrapper ${msg.isSystem ? 'system' : msg.author === username ? 'sent' : 'received'}`}
                            onTouchStart={(e) => !msg.isSystem && handleTouchStart(e, msg.id)}
                            onTouchMove={(e) => !msg.isSystem && handleTouchMove(e, msg)}
                            onTouchEnd={() => !msg.isSystem && handleTouchEnd(msg)}
                        >
                            {!msg.isSystem && (
                                <button className="reply-action desktop-only" onClick={() => setReplyTo(msg)}><Reply size={14} /></button>
                            )}
                            <div className="message-bubble-container" style={{ transform: `translateX(${swipeDistance[msg.id] || 0}px)` }}>
                                {!msg.isSystem && Math.abs(swipeDistance[msg.id] || 0) > 15 && (
                                    <div className="swipe-indicator" style={{
                                        opacity: Math.min(Math.abs(swipeDistance[msg.id] || 0) / 40, 1),
                                        left: msg.author === username ? 'auto' : '-35px',
                                        right: msg.author === username ? '-35px' : 'auto'
                                    }}>
                                        <Reply size={18} />
                                    </div>
                                )}
                                <div className="message-bubble">
                                    {msg.replyTo && (
                                        <div className="reply-quote" onClick={() => document.getElementById(`msg-${msg.replyTo?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                                            <div className="reply-author" style={{ color: getAuthorColor(msg.replyTo.author) }}>{msg.replyTo.author}</div>
                                            <div className="reply-text">{msg.replyTo.message}</div>
                                        </div>
                                    )}
                                    <div id={`msg-${msg.id}`}>
                                        {msg.message}
                                        {msg.fileInfo && (
                                            <div className="file-bubble-card" style={{
                                                marginTop: '8px',
                                                padding: '10px',
                                                background: 'rgba(0,0,0,0.1)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                minWidth: '220px'
                                            }}>
                                                <div className="file-icon-box" style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: '8px' }}>
                                                    <File size={24} className="text-primary" />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.fileInfo.name}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.7 }}>{formatSize(msg.fileInfo.size)}</div>
                                                    {localFile && localFile.progress < 100 && (
                                                        <div style={{ marginTop: '4px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${localFile.progress}%`, height: '100%', background: 'var(--text-primary)', transition: 'width 0.2s' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="file-status">
                                                    {localFile?.url ? (
                                                        <a href={localFile.url} download={msg.fileInfo.name} className="icon-btn" style={{ padding: '6px' }}><Download size={18} /></a>
                                                    ) : localFile?.progress && localFile.progress > 0 ? (
                                                        <Loader2 size={18} className="animate-spin opacity-50" />
                                                    ) : (
                                                        <button className="icon-btn" onClick={() => requestFile(msg.fileInfo!.fileId)} title="Download"><Download size={18} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!msg.isSystem && (
                                    <div className="message-meta">
                                        <span>{msg.author}</span><span>•</span><span>{msg.time}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {typists.length > 0 && (
                    <div className="typing-indicator">
                        <div className="typing-dots"><span></span><span></span><span></span></div>
                        {typists.length === 1 ? `${typists[0]} is typing...` : `${typists[0]} and ${typists.length - 1} others typing...`}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="message-input-area">
                {replyTo && (
                    <div className="reply-preview-container">
                        <div className="reply-preview-content">
                            <div className="reply-author" style={{ color: getAuthorColor(replyTo.author) }}>Replying to {replyTo.author}</div>
                            <div className="reply-text">{replyTo.message}</div>
                        </div>
                        <button className="icon-btn" onClick={() => setReplyTo(null)}><X size={18} /></button>
                    </div>
                )}
                <div className="input-container">
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                    <Paperclip size={20} className="action-btn" onClick={() => fileInputRef.current?.click()} />
                    <input type="text" value={currentMessage} placeholder="Type or share a file..." onChange={handleInputChange} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                    <button onClick={handleSend} className="action-btn send-btn"><Send size={18} /></button>
                </div>
            </div>
        </div>
    );
};

export default ChatArea;
