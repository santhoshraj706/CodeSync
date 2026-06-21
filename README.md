# 🚀 CodeSync

CodeSync is a real-time collaborative coding workspace built for teams and technical interviews. It combines a powerful code editor, a collaborative whiteboard, live chat, code execution, and an integrated AI assistant into a single seamless, premium interface.

## ✨ Features

### 💻 Live Collaborative Code Editor
- **Real-time Sync**: Code together with zero latency using WebSockets.
- **Monaco Editor**: Powered by the same core as VS Code for professional syntax highlighting and autocomplete.
- **Multiple Languages**: Supports JavaScript, Python, Java, C++, and C.
- **Code Execution**: Run your code securely and instantly right in the browser (powered by Judge0).
- **Customizable Layout**: Freely resize or hide the Team Panel and Chat Panel to maximize your workspace.

### 🤖 Gemini AI Assistant
- **Chat & Consult**: Ask the AI questions about your logic or algorithm.
- **Explain Code**: Highlight complex logic and have the AI break it down instantly.
- **Fix Bugs**: Let the AI automatically identify and resolve syntax or logical errors in your code.
- **Generate Code**: Describe what you need, and the AI will write the boilerplate or algorithm for you.
- **Summarize Chat**: Catch up quickly by having the AI summarize missed team messages.

### 💬 Advanced Live Chat
- **Real-time Messaging**: Communicate with your team without leaving the workspace.
- **Threaded Context**: Reply directly to specific messages with visual context previews.
- **Edit Messages**: Made a typo? Edit your sent messages instantly (displays an *(edited)* tag).
- **Export Chat**: Download transcripts of your discussion for later reference.

### 🎨 Collaborative Whiteboard
- **Draw & Design**: Sketch system architectures or UI layouts in real-time alongside your code.
- **Sticky Notes**: Add text and annotations.
- **Persistent State**: The whiteboard state saves automatically to the database.

## 🛠️ Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Monaco Editor, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: MongoDB (Mongoose).
- **AI/Execution Integrations**: Google Gemini API, Judge0 API.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v16+)
- MongoDB (Local or Atlas URI)

You will also need API keys for:
- [Gemini API](https://aistudio.google.com/app/apikey) (For the AI Assistant)
- [Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce) via RapidAPI (For Code Execution)

### 1. Clone the Repository
```bash
git clone https://github.com/santhoshraj706/CodeSync.git
cd CodeSync
```

### 2. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your keys:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JUDGE0_API_KEY=your_rapidapi_judge0_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Start the backend server:
   ```bash
   node index.js
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Code Together!
- Open your browser to `http://localhost:5173`.
- Create an account or log in.
- Create a new room and share the Room ID with your team.
- Start coding!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is licensed under the MIT License.
