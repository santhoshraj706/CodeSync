# 🚀 CodeSync

CodeSync is a **real-time collaborative coding workspace** built for teams, hackathons, interviews, and classrooms. It combines a powerful code editor, collaborative whiteboard, live chat, code execution, and an AI assistant into a seamless premium interface.

---

## ✨ Features

### 💻 Live Collaborative Code Editor
- **Real-time Sync** — Code together with zero latency via WebSockets. See teammates' cursors, selections, and edits as they happen.
- **Monaco Editor** — Professional syntax highlighting, autocomplete, and multi-language support (JavaScript, Python, Java, C++, C).
- **Live Code Execution** — Compile and run code directly in the browser with real-time stdout/stderr output (powered by Judge0).
- **Customizable Layout** — Resize or hide panels (Team Panel, Chat, Whiteboard, AI) to maximize your workspace.
- **Layout Presets** — Switch between editor, split, and presentation layouts.
- **Format Document** — Auto-format code with Shift+Alt+F.
- **Download Code** — Download the current file with Ctrl+S.

### 🤖 AI Assistant
- **Chat & Consult** — Ask the AI questions about your logic, algorithms, or code.
- **Explain Code** — Highlight complex logic and have the AI break it down instantly.
- **Fix Bugs** — Let the AI identify and resolve syntax or logical errors.
- **Generate Code** — Describe what you need and the AI writes the boilerplate or algorithm.
- **Summarize Chat** — Catch up quickly with AI-summarized team messages.

### 💬 Advanced Live Chat
- **Real-time Messaging** — Communicate without leaving the workspace.
- **Threaded Replies** — Reply to specific messages with visual context previews.
- **Edit Messages** — Fix typos instantly (shows an *edited* tag).
- **Export Chat** — Download transcripts for later reference.

### 🎨 Collaborative Whiteboard
- **Draw & Design** — Sketch system architectures, flowcharts, and UI layouts in real-time.
- **Sticky Notes** — Add text and annotations.
- **Persistent State** — Whiteboard state saves automatically to the database.

### 🖥️ Interactive Landing Page
- **Hero Section** — Compact layout with feature pills (Real-time Coding, Live Whiteboard, Team Chat, AI Assistant, Code Execution).
- **Product Preview Mockup** — Interactive tabs showing Code, Board, Chat, AI, and Output in action.
- **Feature Cards** — Six cards with hover lift, glow borders, and animated icons.
- **How It Works** — Three-step guide: Create, Invite, Collaborate.
- **Built For** — Use-case cards for Hackathons, College Projects, Interviews, Peer Learning, and Classrooms.
- **FAQ Accordion** — Smooth expand/collapse FAQ section.
- **Trust Strip** — Pill badges showing supported use-cases.
- **Scroll Reveal** — Sections fade up as you scroll.
- **Sticky Navbar** — Glass-effect sticky navbar with backdrop blur.

### 📊 Dashboard
- **Create / Join Rooms** — Tabbed form for creating or joining workspaces with password access.
- **Room ID Generator** — Auto-generate random room IDs.
- **Quick Actions** — Open latest workspace, copy room ID, generate random ID, toggle favorites filter.
- **Templates** — Quick-start templates: Blank, DSA Practice, Web Project, Interview Prep, Whiteboard.
- **Recent Workspaces** — Filterable list (All, Pinned, Admin, Recent) with search, status badges, and relative timestamps.
- **Latest Activity Feed** — Timeline of recent actions (created, joined, pinned, copied, etc.).
- **Stats Row** — Workspace count, admin count, latest workspace.
- **Admin Controls** — Pin/star rooms, copy room IDs, delete rooms (admin only).
- **Delete Confirmation Modal** — Custom modal replaces native `window.confirm()`.

### 🔒 Admin & Security
- **Password-protected Rooms** — Rooms are secured with an access code.
- **Admin Controls** — Room creator is the admin with delete privileges.
- **Room Deletion** — Deletes all code, messages, and whiteboard data; force-kicks all connected users via WebSocket.
- **Presenter Mode** — Assign presenter role to control what others see.
- **Test Case Management** — Add, run, and track test cases for your code.

### 🧪 Test Case Runner
- **Add Test Cases** — Define input/output pairs for your code.
- **Run Tests** — Execute all test cases and see pass/fail results.
- **Syntax Highlighting** — Test cases displayed with code formatting.
- **Persistent** — Test cases sync across all room members in real-time.

---

## 🛠️ Technology Stack

### Frontend
- **React 19** with Hooks
- **Vite 8** (fast dev server and builds)
- **Tailwind CSS 4** (utility-first styling)
- **Monaco Editor** (VS Code-grade code editor)
- **Socket.io Client** (real-time communication)
- **React Router DOM 7** (client-side routing)
- **Lucide React** (icon library)
- **Canvas Confetti** (celebrations)

### Backend
- **Node.js** with **Express 5**
- **Socket.io 4** (WebSocket management)
- **MongoDB** with **Mongoose 9**
- **JWT Authentication** (JSON Web Tokens)
- **bcryptjs** (password hashing)

### APIs & Integrations
- **Google Gemini API** (AI Assistant)
- **Judge0 API** (code execution)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- Node.js (v18+)
- MongoDB (local or Atlas URI)

You will also need API keys for:
- [Gemini API](https://aistudio.google.com/app/apikey) — AI Assistant
- [Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce) — Code Execution

### 1. Clone the Repository
```bash
git clone https://github.com/santhoshraj706/CodeSync.git
cd CodeSync
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JUDGE0_API_KEY=your_rapidapi_judge0_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 4. Code Together!
- Open your browser to `http://localhost:5173`
- Create an account or log in
- Create a room and share the Room ID with your team
- Start coding!

---

## 📁 Project Structure

```
CodeSync/
├── client/                     # React frontend
│   ├── src/
│   │   ├── context/            # React context providers
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   └── SocketContext.jsx   # Socket.IO connection
│   │   ├── pages/              # Page components
│   │   │   ├── Landing.jsx     # Landing page
│   │   │   ├── Login.jsx       # Login page
│   │   │   ├── Signup.jsx      # Registration page
│   │   │   ├── Dashboard.jsx   # Main dashboard
│   │   │   └── Room.jsx        # Collaborative room
│   │   ├── utils/
│   │   │   └── api.js          # Axios API client
│   │   ├── App.jsx             # Root app with routing
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express backend
│   ├── models/
│   │   ├── Room.js             # Room schema
│   │   ├── CodeFile.js         # Code file schema
│   │   ├── Message.js          # Chat message schema
│   │   ├── WhiteboardStroke.js # Whiteboard stroke schema
│   │   └── User.js             # User schema
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   └── rooms.js            # Room CRUD routes
│   ├── socket/
│   │   └── socket.js           # Socket.IO event handlers
│   ├── index.js                # Server entry point
│   ├── package.json
│   └── .env                    # Environment variables
│
└── README.md
```

---

## 🔑 API Routes

### Authentication (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Create a new account |
| POST | `/login` | Log in to existing account |
| GET | `/me` | Get current user profile |

### Rooms (`/api/rooms`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/create` | Create a new room |
| POST | `/join` | Join an existing room |
| GET | `/recent` | Get user's recent rooms |
| DELETE | `/:roomId` | Delete a room (admin only) |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/santhoshraj706/CodeSync/issues).

Please follow existing code conventions and ensure lint passes before submitting.

---

## 📄 License

This project is licensed under the MIT License.
