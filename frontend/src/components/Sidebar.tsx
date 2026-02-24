import React from 'react';
import {
    MessageSquare,
    Search,
    PlusCircle,
    Settings,
    Bot,
    LogOut,
    Github,
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

                    {/* <div
                        className={`menu-item ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('search'); onClose(); }}
                    >
                        <Search size={18} />
                        <span>Global Search</span>
                    </div> */}

                    {/* <div
                        className={`menu-item ${activeTab === 'newRoom' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('newRoom'); onClose(); }}
                    >
                        <PlusCircle size={18} />
                        <span>New Room</span>
                    </div> */}

                    <div
                        className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('settings'); onClose(); }}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div className="footer-actions">
                        <div className="room-display">
                            <span className="dot"></span>
                            <span className="room-id">#{room}</span>
                        </div>
                        <button className="btn-logout-plain" onClick={() => window.location.reload()} title="Exit Session">
                            <LogOut size={18} />
                        </button>
                    </div>

                    <div className="creator-footer">
                        <div className="creator-details">
                            Developed by <span>Sam</span>
                        </div>
                        <a href="https://github.com/owsam22" target="_blank" rel="noopener noreferrer" className="github-link">
                            <Github size={14} /> github.com/owsam22
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
