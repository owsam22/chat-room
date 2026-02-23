import React from 'react';
import { Menu, Zap, User, Copy, QrCode, PlusCircle, Send, CheckCircle2, Hash, Share2, X, Reply } from 'lucide-react';

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
}

interface ChatAreaProps {
    room: string;
    username: string;
    socket: any;
    messageList: Message[];
    currentMessage: string;
    setCurrentMessage: (msg: string) => void;
    sendMessage: (msg: string, replyTo?: any) => void;
    onMobileMenuToggle: () => void;
    onCopyRoomId: () => void;
    onShowQR: () => void;
    onShare: () => void;
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
    copied,
    bottomRef,
    participantCount,
    roomUsers,
    typists
}) => {
    const [showMembers, setShowMembers] = React.useState(false);
    const [replyTo, setReplyTo] = React.useState<Message | null>(null);
    const typingTimeoutRef = React.useRef<any>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentMessage(e.target.value);

        // Emit typing status
        socket.emit('typing_status', { room, username, isTyping: true });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_status', { room, username, isTyping: false });
        }, 2000);
    };

    const handleSend = () => {
        if (currentMessage.trim() === '') return;

        sendMessage(currentMessage, replyTo ? {
            id: replyTo.id,
            author: replyTo.author,
            message: replyTo.message
        } : null);

        setCurrentMessage('');
        setReplyTo(null);

        // Immediately stop typing indicator on send
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_status', { room, username, isTyping: false });
    };

    const formatTypingText = () => {
        if (typists.length === 0) return '';
        if (typists.length === 1) return `${typists[0]} is typing...`;
        if (typists.length === 2) return `${typists[0]} and ${typists[1]} are typing...`;
        return `${typists[0]} and ${typists.length - 1} others are typing...`;
    };

    return (
        <div className="chat-main">
            <div className="chat-header">
                <div className="chat-header-left">
                    <button className="mobile-toggle" onClick={onMobileMenuToggle}>
                        <Menu size={20} />
                    </button>
                    <div className="chat-room-info" onClick={() => setShowMembers(!showMembers)}>
                        <h3>#{room}</h3>
                        <div className="room-badge">
                            <Zap size={14} color='#00d000ff' className="text-primary" /> {participantCount} Online
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="room-id-chip" onClick={onCopyRoomId} title="Click to Copy Share Link">
                        <Hash size={16} className="text-primary" />
                        <span>{room}</span>
                        {copied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
                    </div>

                    <button className="icon-btn share-btn desktop-only" title="Share Room" onClick={onShare}>
                        <Share2 size={18} />
                    </button>

                    <button className="icon-btn" title="Join QR" onClick={onShowQR}>
                        <QrCode size={18} />
                    </button>

                    <div className="user-profile">
                        <span className="desktop-only" style={{ fontWeight: 600 }}>{username}</span>
                        <div className="avatar-circle">
                            {username.charAt(0).toUpperCase()}
                        </div>
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
                {messageList.map((msg, index) => (
                    <div
                        key={index}
                        className={`message-wrapper ${msg.isSystem ? 'system' : msg.author === username ? 'sent' : 'received'}`}
                    >
                        {!msg.isSystem && (
                            <button
                                className="reply-action"
                                title="Reply"
                                onClick={() => setReplyTo(msg)}
                            >
                                <Reply size={14} />
                            </button>
                        )}
                        <div className="message-bubble">
                            {msg.replyTo && (
                                <div className="reply-quote" onClick={() => {
                                    const element = document.getElementById(`msg-${msg.replyTo?.id}`);
                                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}>
                                    <div className="reply-author">{msg.replyTo.author}</div>
                                    <div className="reply-text">{msg.replyTo.message}</div>
                                </div>
                            )}
                            <div id={`msg-${msg.id}`}>{msg.message}</div>
                        </div>
                        {!msg.isSystem && (
                            <div className="message-meta">
                                <span>{msg.author}</span>
                                <span>•</span>
                                <span>{msg.time}</span>
                            </div>
                        )}
                    </div>
                ))}

                {typists.length > 0 && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        {formatTypingText()}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="message-input-area">
                {replyTo && (
                    <div className="reply-preview-container">
                        <div className="reply-preview-content">
                            <div className="reply-author">Replying to {replyTo.author}</div>
                            <div className="reply-text">{replyTo.message}</div>
                        </div>
                        <button className="icon-btn" onClick={() => setReplyTo(null)}>
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="input-container">
                    <PlusCircle size={20} className="action-btn" />
                    <input
                        type="text"
                        value={currentMessage}
                        placeholder="Ask or type something..."
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} className="action-btn send-btn">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatArea;
