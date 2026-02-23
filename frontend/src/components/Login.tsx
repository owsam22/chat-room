import React, { useState } from 'react';
import { User, Hash, Zap, ShieldCheck, Bot, PlusSquare, ArrowRight } from 'lucide-react';

interface LoginProps {
    username: string;
    setUsername: (name: string) => void;
    room: string;
    setRoom: (room: string) => void;
    joinRoom: (isCreating?: boolean) => void;
    error?: string;
}

const Login: React.FC<LoginProps> = ({ username, setUsername, room, setRoom, joinRoom, error }) => {
    const [mode, setMode] = useState<'selection' | 'join' | 'create'>(room ? 'join' : 'selection');

    const handleCreateRoom = () => {
        if (!username) {
            alert("Please enter a display name first.");
            return;
        }
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setRoom(code);
        setMode('create');
    };

    const handleJoinMode = () => {
        if (!username) {
            alert("Please enter a display name first.");
            return;
        }
        setMode('join');
    };

    return (
        <div className="login-container glass-card">
            <div className="login-header">
                <div className="logo-container">
                    <Bot size={32} />
                </div>
                <h1>Join QuickChat</h1>
                <p>Premium AI-powered communication</p>
            </div>

            <div className="input-group">
                <label>Personal Identity</label>
                <div className="input-field-wrapper">
                    <User size={18} />
                    <input
                        type="text"
                        placeholder="How should we call you?"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="error-message" style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    background: '#fef2f2',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    marginTop: '10px'
                }}>
                    {error}
                </div>
            )}

            {mode === 'selection' && (
                <div className="login-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={handleCreateRoom}>
                        <PlusSquare size={18} /> Create Secure Room
                    </button>
                    <button className="btn-secondary" onClick={handleJoinMode} style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        color: '#475569',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: '0.2s'
                    }}>
                        <ArrowRight size={18} /> Join via ID / QR
                    </button>
                </div>
            )}

            {mode === 'create' && (
                <div className="creation-flow" style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div className="input-group">
                        <label>Generated Room ID</label>
                        <div className="input-field-wrapper">
                            <Hash size={18} />
                            <input
                                type="text"
                                readOnly
                                value={room}
                                style={{ background: '#f1f5f9', cursor: 'default' }}
                            />
                        </div>
                    </div>
                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => joinRoom(true)}>
                        Initialize Space <Zap size={18} />
                    </button>
                    <button onClick={() => setMode('selection')} style={{ display: 'block', margin: '15px auto 0', background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Back to Selection
                    </button>
                </div>
            )}

            {mode === 'join' && (
                <div className="join-flow" style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div className="input-group">
                        <label>Room Authorization Code</label>
                        <div className="input-field-wrapper">
                            <Hash size={18} />
                            <input
                                type="text"
                                placeholder="Paste code here..."
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                            />
                        </div>
                    </div>
                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => joinRoom(false)}>
                        Enter Room <Zap size={18} />
                    </button>
                    <button onClick={() => setMode('selection')} style={{ display: 'block', margin: '15px auto 0', background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Back to Selection
                    </button>
                </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '16px' }}>
                <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Quantum-ready encryption active
            </div>
        </div>
    );
};

export default Login;
