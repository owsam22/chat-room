import React from 'react';
import {
    MessageSquare,
    Search,
    PlusCircle,
    Settings,
    Bot,
    LogOut,
    X
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    room: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, setActiveTab, room }) => {
    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-l">
                        <Bot size={32} strokeWidth={2.5} className="text-primary" />
                        <span style={{ letterSpacing: '-0.03em' }}>QuickChat</span>
                    </div>
                    <button className="mobile-close" onClick={onClose} aria-label="Close Sidebar">
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-menu">
                    <div
                        className={`menu-item ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('chat'); onClose(); }}
                    >
                        <MessageSquare size={18} />
                        <span>Active Chat</span>
                    </div>
                    <div
                        className={`menu-item ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('search'); onClose(); }}
                    >
                        <Search size={18} />
                        <span>Global Search</span>
                    </div>
                    <div
                        className={`menu-item ${activeTab === 'newRoom' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('newRoom'); onClose(); }}
                    >
                        <PlusCircle size={18} />
                        <span>New Room</span>
                    </div>
                    <div
                        className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('settings'); onClose(); }}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div className="room-info-small" style={{ marginBottom: '12px' }}>
                        <span className="dot"></span> Room: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{room}</span>
                    </div>
                    <button className="btn-logout" onClick={() => window.location.reload()}>
                        <LogOut size={16} /> Exit Session
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
