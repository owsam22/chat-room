import { useState, useEffect, useRef, useCallback } from 'react';

const CHUNK_SIZE = 16384; // 16kb per chunk for WebRTC

export interface SharedFile {
    id: string;
    sender: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    url?: string;
    isSending?: boolean;
}

export const useWebRTC = (socket: any, room: string, username: string, roomUsers: string[]) => {
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const dataChannelsRef = useRef<{ [key: string]: RTCDataChannel }>({});
    const fileChunksRef = useRef<{ [key: string]: { chunks: ArrayBuffer[], receivedSize: number, metadata: any, lastProgress: number } }>({});
    const earlyCandidatesRef = useRef<{ [key: string]: RTCIceCandidateInit[] }>({});
    
    // Store original file objects for re-sending to latecomers
    const myFilesRef = useRef<{ [key: string]: File }>({});

    const peerConnectionConfig = {
        iceServers: [
            { urls: "stun:stun.relay.metered.ca:80" },
            {
                urls: "turn:global.relay.metered.ca:80",
                username: "c9299729b721da1e085a832b",
                credential: "xQPtbnJyaxWFSbef",
            },
            {
                urls: "turn:global.relay.metered.ca:80?transport=tcp",
                username: "c9299729b721da1e085a832b",
                credential: "xQPtbnJyaxWFSbef",
            },
            {
                urls: "turn:global.relay.metered.ca:443",
                username: "c9299729b721da1e085a832b",
                credential: "xQPtbnJyaxWFSbef",
            },
            {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: "c9299729b721da1e085a832b",
                credential: "xQPtbnJyaxWFSbef",
            },
        ],
    };

    const updateFileProgress = (id: string, progress: number) => {
        setSharedFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
    };

    const addSharedFileUrl = (id: string, url: string) => {
        setSharedFiles(prev => prev.map(f => f.id === id ? { ...f, url, progress: 100 } : f));
    };

    const createPeer = useCallback((peerUsername: string, isInitiator: boolean) => {
        if (peersRef.current[peerUsername]) return peersRef.current[peerUsername];

        console.log(`[WebRTC] Initializing with ${peerUsername} (Initiator: ${isInitiator})`);
        const pc = new RTCPeerConnection(peerConnectionConfig);
        peersRef.current[peerUsername] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_signal', { room, from: username, to: peerUsername, type: 'candidate', candidate: event.candidate });
            }
        };

        const setupDataChannel = (channel: RTCDataChannel) => {
            channel.binaryType = 'arraybuffer';
            dataChannelsRef.current[peerUsername] = channel;

            channel.onmessage = async (event) => {
                if (typeof event.data === 'string') {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === 'file-start') {
                            console.log(`[WebRTC] Incoming file metadata: ${msg.name}`);
                            fileChunksRef.current[msg.fileId] = { chunks: [], receivedSize: 0, metadata: msg, lastProgress: 0 };
                            setSharedFiles(prev => {
                                if (prev.some(f => f.id === msg.fileId)) return prev;
                                return [...prev, { id: msg.fileId, sender: peerUsername, name: msg.name, size: msg.size, type: msg.fileType, progress: 0 }];
                            });
                        } else if (msg.type === 'file-request') {
                            console.log(`[WebRTC] Peer ${peerUsername} requested file: ${msg.fileId}`);
                            const file = myFilesRef.current[msg.fileId];
                            if (file) {
                                streamFileToPeers(file, msg.fileId, [peerUsername]);
                            }
                        }
                    } catch (e) { console.error("[WebRTC] Msg parse error", e); }
                } else {
                    const chunk = event.data as ArrayBuffer;
                    const activeFileId = Object.keys(fileChunksRef.current).find(id => {
                        const f = fileChunksRef.current[id];
                        return f.metadata.sender === peerUsername && f.receivedSize < f.metadata.size;
                    });

                    if (activeFileId) {
                        const fileState = fileChunksRef.current[activeFileId];
                        fileState.chunks.push(chunk);
                        fileState.receivedSize += chunk.byteLength;

                        const progress = Math.min(Math.round((fileState.receivedSize / fileState.metadata.size) * 100), 100);
                        if (progress > fileState.lastProgress) {
                            fileState.lastProgress = progress;
                            updateFileProgress(activeFileId, progress);
                        }

                        if (fileState.receivedSize >= fileState.metadata.size) {
                            console.log(`[WebRTC] Received complete file: ${fileState.metadata.name}`);
                            const blob = new Blob(fileState.chunks, { type: fileState.metadata.fileType });
                            const url = URL.createObjectURL(blob);
                            addSharedFileUrl(activeFileId, url);
                            delete fileChunksRef.current[activeFileId];
                        }
                    }
                }
            };
        };

        if (isInitiator) {
            const dc = pc.createDataChannel('fileTransfer', { ordered: true });
            setupDataChannel(dc);
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).then(() => {
                socket.emit('webrtc_signal', { room, from: username, to: peerUsername, type: 'offer', offer: pc.localDescription });
            });
        }

        pc.ondatachannel = (event) => {
            console.log(`[WebRTC] Accepted DataChannel from ${peerUsername}`);
            setupDataChannel(event.channel);
        };

        return pc;
    }, [room, username, socket]);

    useEffect(() => {
        const handleSignal = async (data: any) => {
            if (data.to !== username) return;
            const from = data.from;
            try {
                if (data.type === 'offer') {
                    const pc = createPeer(from, false);
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    if (earlyCandidatesRef.current[from]) {
                        for (const cand of earlyCandidatesRef.current[from]) await pc.addIceCandidate(new RTCIceCandidate(cand));
                        delete earlyCandidatesRef.current[from];
                    }
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('webrtc_signal', { room, from: username, to: from, type: 'answer', answer: pc.localDescription });
                } else if (data.type === 'answer') {
                    const pc = peersRef.current[from];
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                        if (earlyCandidatesRef.current[from]) {
                            for (const cand of earlyCandidatesRef.current[from]) await pc.addIceCandidate(new RTCIceCandidate(cand));
                            delete earlyCandidatesRef.current[from];
                        }
                    }
                } else if (data.type === 'candidate') {
                    const pc = peersRef.current[from];
                    if (pc && pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    else {
                        if (!earlyCandidatesRef.current[from]) earlyCandidatesRef.current[from] = [];
                        earlyCandidatesRef.current[from].push(data.candidate);
                    }
                }
            } catch (err) { console.error("[WebRTC] Signal err", err); }
        };
        socket.on('webrtc_signal', handleSignal);
        return () => { socket.off('webrtc_signal', handleSignal); };
    }, [socket, username, room, createPeer]);

    useEffect(() => {
        roomUsers.forEach(user => { if (user !== username && !peersRef.current[user] && username > user) createPeer(user, true); });
        Object.keys(peersRef.current).forEach(user => {
            if (!roomUsers.includes(user)) {
                peersRef.current[user].close();
                delete peersRef.current[user];
                delete dataChannelsRef.current[user];
            }
        });
    }, [roomUsers, username, createPeer]);

    const streamFileToPeers = (file: File, fileId: string, targets: string[]) => {
        const metadata = { type: 'file-start', fileId, name: file.name, size: file.size, fileType: file.type, sender: username };
        const targetChannels = targets.map(t => dataChannelsRef.current[t]).filter(ch => ch && ch.readyState === 'open');
        
        if (targetChannels.length === 0) return;
        targetChannels.forEach(ch => ch.send(JSON.stringify(metadata)));

        let offset = 0;
        let lastReported = 0;

        const transmit = () => {
            if (targetChannels.some(ch => ch.bufferedAmount > 1024 * 512)) {
                setTimeout(transmit, 50);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                if (!buffer) return;
                targetChannels.forEach(ch => { if (ch.readyState === 'open') try { ch.send(buffer); } catch(e){} });
                offset += buffer.byteLength;
                const progress = Math.min(Math.round((offset / file.size) * 100), 100);
                if (progress > lastReported) { lastReported = progress; updateFileProgress(fileId, progress); }
                if (offset < file.size) setTimeout(transmit, 1);
            };
            reader.readAsArrayBuffer(file.slice(offset, offset + CHUNK_SIZE));
        };
        setTimeout(transmit, 150);
    };

    const sendFile = async (file: File) => {
        const fileId = `${username}-${Date.now()}`;
        myFilesRef.current[fileId] = file;
        setSharedFiles(prev => [...prev, { id: fileId, sender: username, name: file.name, size: file.size, type: file.type, progress: 0, isSending: true, url: URL.createObjectURL(file) }]);
        const openPeers = Object.keys(dataChannelsRef.current).filter(p => dataChannelsRef.current[p].readyState === 'open');
        if (openPeers.length > 0) streamFileToPeers(file, fileId, openPeers);
        return { fileId, name: file.name, size: file.size, type: file.type };
    };

    const requestFile = (fileId: string) => {
        const openChannels = Object.values(dataChannelsRef.current).filter(ch => ch.readyState === 'open');
        if (openChannels.length === 0) return;
        console.log(`[WebRTC] Requesting file ${fileId} from peers...`);
        openChannels.forEach(ch => ch.send(JSON.stringify({ type: 'file-request', fileId })));
    };

    useEffect(() => {
        return () => {
            sharedFiles.forEach(f => f.url && URL.revokeObjectURL(f.url));
            Object.values(peersRef.current).forEach(p => p.close());
        };
    }, []);

    return { sharedFiles, sendFile, requestFile };
};
