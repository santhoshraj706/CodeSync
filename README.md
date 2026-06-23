# 🚀 CodeSync

CodeSync is a **real-time collaborative coding platform** built for teams, hackathons, interviews, and classrooms. It combines a powerful code editor, collaborative whiteboard, live chat, AI assistant, code execution, session notes, test runner, and inline code comments into a seamless dark glassmorphism interface.

---

## ✨ Features

### 💻 Live Collaborative Code Editor
- **Real-time Sync** — Code together with zero latency via WebSockets. See teammates' cursors, selections, and edits as they happen.
- **Monaco Editor** — Professional syntax highlighting, autocomplete, and multi-language support (JavaScript, Python, Java, C++, C).
- **Live Code Execution** — Compile and run code directly in the browser with real-time stdout/stderr output (powered by Judge0).
- **Customizable Layout** — Resizable panels (Team, Chat/Notes, Terminal); hide or show any panel.
- **Layout Presets** — Coding Mode, Discussion Mode, Whiteboard Mode, Focus Mode.
- **Presenter Mode** — Assign presenter role to control what others see; followers see cursor movements in real-time.
- **Format Document** — Auto-format code with `Shift+Alt+F`.
- **Download Code** — Download the current file with `Ctrl+S`.
- **Font Size Controls** — Adjust editor font size on the fly.

### 📝 Session Notes
- **Structured Meeting Notes** — Add Aim/Objective, Meeting Agenda, Expected Result, Decisions Taken, Pending Work.
- **Task Management** — Add, edit, delete, and reorder tasks with Todo/Doing/Done status tracking.
- **Assigned To** — Assign tasks to team members.
- **Real-time Sync** — All notes and task changes sync instantly to every room member via WebSocket.
- **Live Notifications** — Toast notifications when anyone adds, edits, deletes a task, or updates/resets notes.
- **Markdown Export** — Export full session notes as a `.md` file with task checklist formatting.
- **Collapsible Sections** — Clean accordion-style sections to keep the panel compact.
- **Reset Notes** — Clear all notes with confirmation prompt.

### 💬 Advanced Live Chat
- **Real-time Messaging** — Communicate without leaving the workspace.
- **Threaded Replies** — Reply to specific messages with visual context previews.
- **Edit Messages** — Fix typos instantly (shows an *edited* tag).
- **Delete Messages** — Delete your own messages; admins can delete any message.
- **Search Messages** — Filter chat history by keyword or username.
- **Date Separators** — Messages grouped by date with "Today", "Yesterday", and date headers.
- **Relative Timestamps** — "Just now", "2m ago", "1h ago", etc.
- **Message Grouping** — Consecutive messages from the same user are visually grouped.
- **AI Summarize** — Summarize the entire chat with AI.
- **Export Chat** — Download transcripts as text files.
- **Emoji Picker** — Rich emoji support.
- **Notification Sound** — Soft chime on new messages (mutable).

### 🎨 Collaborative Whiteboard
- **Draw & Design** — Sketch system architectures, flowcharts, and UI layouts in real-time.
- **Sticky Notes** — Add text annotations with a pin design.
- **Color Picker** — Choose from multiple preset colors with tooltip names.
- **Grid Overlay** — Toggle grid for alignment.
- **Clear Canvas** — Clear with confirmation to prevent accidental data loss.
- **Status Bar** — Shows stroke count and active tool.
- **Persistent State** — Whiteboard state saves automatically to the database.

### 🧪 Test Case Runner
- **Add Test Cases** — Define input/output pairs for your code.
- **Run Tests** — Execute all test cases and see pass/fail results.
- **Run History** — Persistent history of all test runs with timestamps.
- **Real-time Sync** — Test cases sync across all room members.

### 💬 Inline Code Comments
- **Line-level Comments** — Add comments on specific lines of code.
- **Threaded Replies** — Reply to comments for discussion.
- **Resolve Comments** — Mark comments as resolved.
- **Real-time Sync** — Comments sync instantly across the room.

### 🤖 AI Assistant
- **Chat & Consult** — Ask the AI questions about your logic, algorithms, or code.
- **Explain Code** — Highlight complex logic and have the AI break it down instantly.
- **Fix Bugs** — Let the AI identify and resolve syntax or logical errors.
- **Generate Code** — Describe what you need and the AI writes the boilerplate or algorithm.
- **Summarize Chat** — Catch up quickly with AI-summarized team messages.

### 👤 User Profiles
- **Editable Profile** — Full name, username, email, college name, experience level, bio, avatar color.
- **Avatar System** — Auto-generated gradient avatars from username hash; optional custom color.
- **Profile Page** — Dedicated `/profile` settings page with dark glassmorphism design.
- **Rich Presence** — Participant list in rooms shows full name, @username, college, experience level.

### 🖥️ Landing Page
- **Hero Section** — Feature pills (Real-time Coding, Live Whiteboard, Team Chat, AI Assistant, Code Execution).
- **Product Preview** — Interactive tabs showing Code, Board, Chat, AI, and Output in action.
- **Feature Cards** — Six cards with hover lift, glow borders, and animated icons.
- **How It Works** — Three-step guide: Create, Invite, Collaborate.
- **Built For** — Use-case cards for Hackathons, College Projects, Interviews, Peer Learning, Classrooms.
- **FAQ Accordion** — Smooth expand/collapse FAQ section.
- **Trust Strip** — Pill badges showing supported use-cases.
- **Scroll Reveal Animations** — Sections fade up as you scroll.
- **Sticky Glass Navbar** — Glass-effect sticky navbar with backdrop blur.

### 📊 Dashboard
- **Create / Join Rooms** — Tabbed form with password access.
- **Room ID Generator** — Auto-generate random room IDs.
- **Quick Actions** — Open latest workspace, copy room ID, generate random ID, toggle favorites filter.
- **Templates** — Quick-start templates: Blank, DSA Practice, Web Project, Interview Prep, Whiteboard.
- **Recent Workspaces** — Filterable list (All, Pinned, Admin, Recent) with search, status badges, relative timestamps.
- **Latest Activity Feed** — Timeline of recent actions (created, joined, pinned, copied).
- **Stats Row** — Workspace count, admin count, latest workspace.
- **Admin Controls** — Pin/star rooms, copy room IDs, delete rooms (admin only).
- **Delete Confirmation Modal** — Custom modal replaces native `window.confirm()`.
- **Profile Button** — Quick link to profile settings.
- **Mobile Responsive** — Hamburger navbar for mobile navigation.

### 🔒 Admin & Security
- **Password-protected Rooms** — Rooms secured with an access code.
- **Admin Controls** — Room creator is the admin with delete privileges.
- **Room Deletion** — Deletes all associated data (code, messages, whiteboard strokes, code files, test cases, run history); force-kicks all connected users via WebSocket.
- **JWT Authentication** — Secure token-based auth with localStorage persistence.
- **401 Auto-redirect** — Automatic logout and redirect when token expires.

### 📱 Responsive Design
- **Desktop** — Full multi-panel layout with resizable panes.
- **Tablet** — Collapsible panels with touch-friendly controls.
- **Mobile** — Bottom tab navigation (Team, Work, Chat, Notes) with full-screen panels.
- **Custom 404 Page** — Animated "Lost in Code" error page.

---

## 🛠️ Technology Stack

### Frontend
- **React 19** with Hooks
- **Vite 8** (fast dev server and builds)
- **Tailwind CSS 4** (utility-first styling)
- **Monaco Editor** (VS Code-grade code editor)
- **Socket.io Client** (real-time communication)
- **React Router DOM 7** (client-side routing)
- **Axios** (HTTP client with interceptors)
- **Lucide React** (icon library)
- **Canvas Confetti** (celebrations)
- **Emoji Picker React** (emoji support)

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
- Node.js (v18+)
- MongoDB (local or Atlas URI)

API keys needed:
- [Gemini API](https://aistudio.google.com/app/apikey) — AI Assistant
- [Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce) — Code Execution

### 1. Clone
```bash
git clone https://github.com/santhoshraj706/CodeSync.git
cd CodeSync
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JUDGE0_API_KEY=your_rapidapi_judge0_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Start backend:
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
- Open `http://localhost:5173`
- Create an account or log in
- Create a room and share the Room ID with your team
- Start coding!

---

## 📁 Project Structure

```
CodeSync/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIAssistant.jsx      # AI chat/explain/fix/generate
│   │   │   ├── Chat.jsx             # Live chat with replies/edit/delete
│   │   │   ├── Editor.jsx           # Monaco code editor wrapper
│   │   │   ├── LineComments.jsx     # Inline code comments
│   │   │   ├── NotesPanel.jsx       # Session Notes CRUD panel
│   │   │   ├── OutputWindow.jsx     # Code execution output
│   │   │   ├── TestRunner.jsx       # Test case runner
│   │   │   └── Whiteboard.jsx       # Collaborative whiteboard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state & token management
│   │   │   └── SocketContext.jsx     # Socket.IO connection
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Landing page
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Signup.jsx           # Registration page
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── Room.jsx             # Collaborative room
│   │   │   ├── Profile.jsx          # User profile settings
│   │   │   └── NotFound.jsx         # 404 page
│   │   ├── utils/
│   │   │   └── api.js               # Axios client with auth interceptor
│   │   ├── App.jsx                  # Root app with routing
│   │   ├── main.jsx                 # Entry point
│   │   ├── index.css                # Global styles & animations
│   │   └── App.css                  # App-level styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── models/
│   │   ├── User.js                  # User schema (with profile fields)
│   │   ├── Room.js                  # Room schema (messages, strokes, etc.)
│   │   ├── CodeFile.js              # Multi-file code storage
│   │   ├── SessionNote.js           # Session Notes schema
│   │   └── ...                      # Other schemas
│   ├── routes/
│   │   ├── auth.js                  # Register / Login / Me
│   │   ├── profile.js               # Profile GET/PUT
│   │   ├── rooms.js                 # Room CRUD
│   │   ├── note.js                  # Session Notes API (8 routes)
│   │   ├── ai.js                    # AI Assistant endpoints
│   │   └── execute.js               # Judge0 code execution
│   ├── socket/
│   │   └── socket.js                # All Socket.IO event handlers
│   ├── index.js                     # Server entry point
│   └── .env                         # Environment variables
│
└── README.md
```

---

## 🔑 API Routes

### Authentication (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/signup` | Create a new account |
| POST | `/login` | Log in to existing account |

### Profile (`/api/profile`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Get user profile (no password) |
| PUT | `/` | Update profile fields |

### Rooms (`/api/rooms`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/create` | Create a new room |
| POST | `/join` | Join an existing room |
| GET | `/recent` | Get user's recent rooms |
| GET | `/:roomId` | Get room details with populated members |
| DELETE | `/:roomId` | Delete a room (admin only) |

### Session Notes (`/api/rooms/:roomId/notes`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/notes` | Fetch session notes (or empty default) |
| POST | `/notes` | Create session notes |
| PUT | `/notes` | Save/update session notes (auto-creates) |
| DELETE | `/notes` | Reset session notes to empty |
| POST | `/notes/tasks` | Add a task |
| PUT | `/notes/tasks/:taskId` | Edit a task |
| PATCH | `/notes/tasks/:taskId/status` | Update task status |
| DELETE | `/notes/tasks/:taskId` | Delete a task |

### AI Assistant (`/api/ai`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/chat` | AI chat with code context |
| POST | `/explain` | Explain current code |
| POST | `/fix` | Fix bugs in code |
| POST | `/generate` | Generate code from description |
| POST | `/summarize-chat` | Summarize team chat |

### Code Execution (`/api/execute`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/run-code` | Execute code via Judge0 |

---

## 🔌 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, username, fullName, collegeName, experienceLevel, avatarColor }` | Join a room |
| `leave-room` | `{ roomId, username }` | Leave a room |
| `code-change` | `{ roomId, code }` | Broadcast code changes |
| `chat-message` | `{ roomId, id, message, username, timestamp }` | Send chat message |
| `edit-message` | `{ roomId, id, newMessage }` | Edit chat message |
| `delete-message` | `{ roomId, id }` | Delete chat message |
| `whiteboard-draw` | `{ roomId, drawData }` | Broadcast whiteboard stroke |
| `whiteboard-clear` | `{ roomId }` | Clear whiteboard |
| `start-presenting` | `{ roomId, username }` | Start presenter mode |
| `stop-presenting` | `{ roomId }` | Stop presenter mode |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `active-users` | `[{ socketId, username, isEditing, fullName, collegeName, experienceLevel, avatarColor }]` | Updated user list |
| `user-joined` | `{ username }` | User joined notification |
| `user-left` | `{ username }` | User left notification |
| `chat-history` | `[...messages]` | Full chat history |
| `chat-message` | `{ message object }` | New chat message |
| `edit-message` | `{ id, newMessage }` | Message edited |
| `message-deleted` | `{ id }` | Message deleted |
| `whiteboard-history` | `[...strokes]` | Full whiteboard state |
| `whiteboard-draw` | `{ drawData }` | New stroke |
| `whiteboard-clear` | `{}` | Whiteboard cleared |
| `start-presenting` | `{ username }` | Presenter mode started |
| `stop-presenting` | `{}` | Presenter mode stopped |
| `notes-updated` | `{ notes }` | Session notes changed |
| `notes-notification` | `{ message }` | Notes action toast notification |
| `room-deleted` | `{ roomId }` | Room was deleted |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/santhoshraj706/CodeSync/issues).

Please follow existing code conventions and ensure the build passes before submitting.

---

## 📄 License

This project is licensed under the MIT License.
