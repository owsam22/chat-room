import React, { useState } from 'react';
import { User, Hash, Zap, ShieldCheck, Bot, PlusSquare, ArrowRight, Github, AlertCircle, Lock, Loader2, ChevronLeft } from 'lucide-react';

interface LoginProps {
    username: string;
    setUsername: (name: string) => void;
    room: string;
    setRoom: (room: string) => void;
    joinRoom: (isCreating?: boolean) => void;
    error?: string;
    roomFromUrl?: boolean;
    isCreatingInitial?: boolean;
    socket: any;
    onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ username, setUsername, room, setRoom, joinRoom, isCreatingInitial, error: externalError, roomFromUrl, socket, onBack }) => {
    const [isCreating, setIsCreating] = useState(isCreatingInitial || false);
    const [localError, setLocalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const displayError = externalError || localError;

    const clearError = () => { if (localError) setLocalError(''); };

    const handleSwitchToCreate = () => {
        setLocalError('');
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setRoom(code);
        setIsCreating(true);
    };

    const handleSwitchToJoin = () => {
        setLocalError('');
        setRoom('');
        setIsCreating(false);
    };

    const handleSubmit = () => {
        if (!username.trim()) {
            setLocalError('Please enter your display name first.');
            return;
        }
        if (!room.trim()) {
            setLocalError('Please enter a room code.');
            return;
        }

        setIsLoading(true);
        setLocalError('');

        if (isCreating) {
            joinRoom(true);
            // Note: If joinRoom doesn't navigate away immediately, 
            // you might want to handle setIsLoading(false) in a callback or parent
            return;
        }

        // For join mode: validate room exists first
        socket.emit('check_room', room, (response: { exists: boolean }) => {
            if (response.exists) {
                joinRoom(false);
            } else {
                setIsLoading(false);
                setLocalError('This room does not exist or has expired.');
                setIsCreating(false);
            }
        });
    };

    return (
        <div className="login-wrapper">
            {onBack && !roomFromUrl && (
                <button
                    className="back-button-top"
                    onClick={onBack}
                    title="Back to Home"
                    aria-label="Back to Home"
                >
                    <ChevronLeft size={20} />
                </button>
            )}
            
            <div className="login-container glass-card">

                {/* Header */}
                <div className="login-header">
                    <div className="logo-container">
                        <Bot size={40} strokeWidth={2.5} className="text-primary" />
                    </div>
                    <h1>QuickChat <span>{isCreating ? 'Create' : 'Join'}</span></h1>
                    <p>{isCreating ? 'Generate a new room and share the code' : 'Enter a room code to connect'}</p>
                </div>

                {/* Mode Toggle */}
                {!roomFromUrl && (
                    <div className="mode-toggle-row">
                        <button
                            className={`mode-toggle-btn ${!isCreating ? 'active' : ''}`}
                            onClick={handleSwitchToJoin}
                            disabled={isLoading}
                        >
                            <ArrowRight size={15} /> Join Room
                        </button>
                        <button
                            className={`mode-toggle-btn ${isCreating ? 'active' : ''}`}
                            onClick={handleSwitchToCreate}
                            disabled={isLoading}
                        >
                            <PlusSquare size={15} /> Create Room
                        </button>
                    </div>
                )}

                {/* Inputs */}
                <div className="login-form">
                    <div className="input-group">
                        <label>Display Name</label>
                        <div className={`input-field-wrapper ${!username && displayError ? 'error-ring' : ''}`}>
                            <User size={18} />
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={username}
                                disabled={isLoading}
                                onChange={(e) => { setUsername(e.target.value); clearError(); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>
                            Room ID
                            {roomFromUrl && (
                                <span className="room-locked-badge">
                                    <Lock size={11} /> Invite Link
                                </span>
                            )}
                        </label>
                        <div className={`input-field-wrapper ${!room && displayError ? 'error-ring' : ''} ${roomFromUrl || isCreating ? 'field-locked' : ''}`}>
                            <Hash size={18} />
                            <input
                                type="text"
                                placeholder={isCreating ? 'Auto-generated code' : 'Paste room code...'}
                                value={room}
                                readOnly={isCreating || roomFromUrl}
                                disabled={isLoading}
                                onChange={(e) => { if (!isCreating && !roomFromUrl) { setRoom(e.target.value.toUpperCase()); clearError(); } }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                style={(isCreating || roomFromUrl) ? { fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' } : {}}
                            />
                            {isCreating && !roomFromUrl && (
                                <button className="auto-gen-btn" title="Regenerate Code" onClick={handleSwitchToCreate} disabled={isLoading}>
                                    <Zap size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {displayError && (
                        <div className="custom-error-container">
                            <AlertCircle size={16} />
                            <span>{displayError}</span>
                        </div>
                    )}

                    <button 
                        className="btn-primary" 
                        style={{ marginTop: '4px' }} 
                        onClick={handleSubmit} 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Connecting...
                            </>
                        ) : isCreating ? (
                            <>Create & Enter <Zap size={18} /></>
                        ) : (
                            <>Join Room <ArrowRight size={18} /></>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <div className="login-footer">
                    <div className="security-tag">
                        <ShieldCheck size={14} /> Quantum-ready Encryption
                    </div>
                </div>
            </div>

            <div className="dev-watermark">
                <div className="watermark-main">
                    Developed by <span>Sam</span>
                </div>
                <a href="https://github.com/owsam22" target="_blank" rel="noopener noreferrer" className="watermark-link">
                    <Github size={14} /> github.com/owsam22
                </a>
            </div>
        </div>
    );
};

export default Login;