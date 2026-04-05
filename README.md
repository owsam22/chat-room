<!-- ===================================================== -->
<!--                    QuickCHAT README                   -->
<!-- ===================================================== -->

<p align="center">
  <img src="./assets/banner.png" alt="QuickChat Banner" width="100%" />
</p>

<h1 align="center">✨ QuickChat</h1>
<h3 align="center">Instant. Anonymous. Real-Time Event Chat.</h3>

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-RealTime-010101?logo=socket.io" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

<p align="center">
  <strong>No Login • No Phone Number • No Friction</strong><br/>
  Built for seminars, workshops, hackathons, and instant collaboration.
</p>

---

## 🚀 Live Demo

🔗 https://quickchat-owsam22.vercel.app/

---

# 🎯 What is QuickChat?

QuickChat is a **temporary, anonymous real-time chat platform** designed for live events.

Create a room.  
Display the QR.  
Participants join instantly.  
Room closes automatically when everyone leaves.

No accounts.  
No stored messages (after room closing).  
No long-term data retention.

### 🕒 The Event Chat Experience
QuickChat is optimized for live, flowing conversations. Unlike simple ephemeral chats, **QuickChat maintains a persistent session history**. This means latecomers can see all previously shared messages and files, ensuring no one misses out on the context of the event.

---

# 🖼️ Preview

<p align="center">
  <a href="https://quickchat-owsam22.vercel.app/">
    <img src="./assets/preview.png" alt="QuickChat UI Preview" width="85%" />
  </a>
</p>

---

# ✨ Core Features

## ⚡ Instant Anonymous Join
- Users choose their own display name
- Duplicate names prevented inside a room
- No authentication required
- **User Profile Menu**: Dropdown with logout and status indicators

## 📂 WebRTC P2P File Sharing
- **Peer-to-Peer Transfer**: Secure, direct file sharing using `RTCDataChannel`
- **Zero Server Storage**: Files are streamed directly between browsers
- **Metered STUN/TURN**: Robust NAT traversal to work across different networks
- **On-Demand History**: Late joiners can request files shared earlier in the room session
- **Real-time Progress**: Visual progress bars for both sender and receiver

## 📲 QR Code Access
<p align="center">
  <img src="./assets/qr-demo.gif" alt="QR Join Demo" width="65%" />
</p>

- Scan and join instantly
- Optimized for projector-based seminars
- Mobile-friendly experience

## 💬 Real-Time Messaging
- Powered by Socket.IO
- Instant delivery
- **Persistent Session History**: Latecomers can see all previous messages and files shared since the room started
- **Bi-directional Swipe-to-Reply**: Right-swipe on others, Left-swipe on self to reply
- Join/leave system notifications
- Real-time **Typing Indicators**
- Auto-scroll behavior
- Room auto-closes when empty

## 🎨 Premium Glassmorphism UI
- Blur + glass effect
- **Animated Dynamic Pattern**: Modern sliding geometric background
- **Responsive Header**: Mobile-optimized layout with keyboard-aware positioning
- Modern gradient glow accents
- Clean, minimal layout
- Fully responsive (supports `100dvh`)

## 🧹 Automatic Room Lifecycle
- No persistence
- Temporary by design
- Auto cleanup when last user exits

---

# 🛠 Tech Stack

### Frontend
- React (Vite)
- Socket.IO-client
- **WebRTC API** (RTCPeerConnection)
- **Styled-components** (Dynamic Patterns)
- **Lucide React** (Modern Icons)

### Backend
- Node.js
- Express
- Socket.IO

---

# 📂 Project Structure

```
QuickChat/
├── 📁 assets
│   ├── 🖼️ banner.png
│   ├── 🖼️ preview.png
│   ├── 🖼️ qr-demo.gif
│   └── 🖼️ watermark.png
├── 📁 backend
│   ├── 📄 index.js
│   ├── ⚙️ package-lock.json
│   └── ⚙️ package.json
├── 📁 frontend
│   ├── 📁 public
│   ├── 📁 src
│   │   ├── 📁 components
│   │   │   ├── 📄 backgroundPattern.tsx
│   │   │   ├── 📄 ChatArea.tsx
│   │   │   ├── 📄 Login.tsx
│   │   │   ├── 📄 NewRoomTab.tsx
│   │   │   ├── 📄 QRModal.tsx
│   │   │   ├── 📄 SearchTab.tsx
│   │   │   ├── 📄 SettingsTab.tsx
│   │   │   └── 📄 Sidebar.tsx
│   │   ├── 📁 hooks
│   │   │   └── 📄 useWebRTC.ts
│   │   ├── 🎨 App.css
│   │   ├── 📄 App.tsx
│   │   ├── 🎨 index.css
│   │   ├── 📄 main.tsx
│   │   └── 📄 vite-env.d.ts
│   ├── 🌐 index.html
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── ⚙️ tsconfig.json
│   ├── ⚙️ tsconfig.node.json
│   └── 📄 vite.config.js
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ package-lock.json
└── ⚙️ package.json
```

---

# ⚙️ Local Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/owsam22/quick-chat.git
cd chat-room
```

## 2️⃣ Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at:
```
http://localhost:5000
```

## 3️⃣ Start Frontend

Open new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:
```
http://localhost:3000
```

---

# 🧪 How to Test

1. Open `http://localhost:3000`
2. Enter username
3. Create or join a room
4. Open second tab/browser
5. Join same room with different name
6. Start chatting instantly

---

# 🔐 Design Philosophy

QuickChat is built around:

- 🚫 No accounts
- ⚡ Instant access
- 🧹 Temporary collaboration
- 🔒 Privacy by default

It is not trying to replace large messaging platforms.  
It is built specifically for **short-lived live interactions.**

---

# 🚧 Upcoming Features

- Host controls (mute, kick, lock room)
- Live polls
- Q&A mode
- Spam protection & rate limiting
- Message length restriction
- Export chat option

---

# 📈 Vision

QuickChat aims to become a lightweight browser-based interaction tool for:

- 🎓 College seminars
- 🧑‍💼 Corporate workshops
- 💡 Hackathons
- 📢 Live events

Focused. Fast. Disposable.

---

# 🏷️ Branding

<p align="center">
  <img src="./assets/watermark.png" alt="QuickChat Watermark" width="180px" />
</p>

Built with precision by SAM

---

# 📄 License

MIT License