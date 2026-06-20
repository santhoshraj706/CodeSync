import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import EditorComponent from '../components/Editor';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import OutputWindow from '../components/OutputWindow';
import api from '../utils/api';
import { Users, Code, PenTool, Play, LogOut, Copy, Hash, MessageSquare, Terminal } from 'lucide-react';

const Room = () => {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('editor');
  const [activeUsers, setActiveUsers] = useState([]);
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [code, setCode] = useState('// Write your code here...');
  const [language, setLanguage] = useState('javascript');

  // Adjustable layout states
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [mobileTab, setMobileTab] = useState('workspace'); // 'users', 'workspace', 'chat'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizeLeft = (e) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  const startResizeRight = (e) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(450, e.clientX - 16));
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(240, Math.min(500, window.innerWidth - e.clientX - 16));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (!user || !socket) return;

    socket.emit('join-room', { roomId, username: user.username });

    socket.on('active-users', (users) => {
      setActiveUsers(users.filter(u => u.socketId !== socket.id));
    });

    return () => {
      socket.emit('leave-room', { roomId, username: user.username });
      socket.off('active-users');
    };
  }, [roomId, user, socket]);

  const handleRunCode = async () => {
    setIsExecuting(true);
    try {
      const res = await api.post('/execute/run-code', {
        source_code: code,
        language,
        stdin: ''
      });
      setOutput(res.data);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Execution Failed';
      setOutput({ stderr: errorMsg });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard');
  };

  return (
    <div className="flex h-screen bg-animated-gradient text-white overflow-hidden font-sans selection:bg-indigo-500/30 flex-col md:flex-row">
      
      {/* Mobile Top Header (only on mobile) */}
      {isMobile && (
        <div className="px-4 py-3 bg-slate-900/80 border-b border-white/10 flex items-center justify-between z-30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs truncate text-indigo-300 max-w-[120px]">{roomId}</span>
            <button onClick={copyRoomId} className="p-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 active:scale-95 transition-all">
              <Copy className="w-3 h-3 text-gray-300" />
            </button>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg flex items-center text-xs font-semibold"
          >
            <LogOut className="w-3 h-3 mr-1" /> Leave
          </button>
        </div>
      )}

      {/* Left Panel: Users & Room Info */}
      {(!isMobile || mobileTab === 'users') && (
        <div 
          className="glass-panel rounded-2xl flex flex-col overflow-hidden border-white/10 shadow-2xl relative z-10"
          style={isMobile ? { width: '100%', height: 'calc(100vh - 120px)', margin: '12px' } : { width: `${leftWidth}px`, margin: '16px 8px 16px 16px' }}
        >
          <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3">Workspace</h2>
            <div className="flex items-center justify-between glass-input p-3 rounded-xl group cursor-pointer hover:border-indigo-500/50 transition-all" onClick={copyRoomId}>
              <div className="flex items-center gap-2 overflow-hidden">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-sm truncate text-white/90">{roomId}</span>
              </div>
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-400" /> Team
              </h3>
              <span className="bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded-full text-xs font-bold border border-indigo-500/30">
                {activeUsers.length + 1}
              </span>
            </div>
            
            <ul className="space-y-3">
              {/* Current User */}
              <li className="flex items-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 shadow-inner">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg mr-3 border border-white/10">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">{user?.username}</span>
                  <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">You</span>
                </div>
              </li>
              
              {/* Other Users */}
              {activeUsers.map((u, i) => (
                <li key={u.socketId} className={`flex items-center bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors animate-fadeIn`} style={{animationDelay: `${(i+1)*100}ms`}}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-lg font-bold shadow-md mr-3 border border-white/5">
                      {u.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"></span>
                  </div>
                  <span className="text-gray-200 font-medium text-sm">{u.username}</span>
                </li>
              ))}
              
              {activeUsers.length === 0 && (
                <li className="text-xs text-gray-500 italic text-center p-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                  Waiting for others to join...
                </li>
              )}
            </ul>
          </div>
          
          {!isMobile && (
            <div className="p-4 border-t border-white/10 bg-white/5">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center transition-all font-semibold hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <LogOut className="w-4 h-4 mr-2" /> Leave Room
              </button>
            </div>
          )}
        </div>
      )}

      {/* Left Resizer */}
      {!isMobile && (
        <div 
          onMouseDown={startResizeLeft}
          className={`w-1 cursor-col-resize self-stretch hover:w-1.5 hover:bg-indigo-500/30 active:bg-indigo-500/80 transition-all z-20 ${isResizingLeft ? 'bg-indigo-500/80 w-1.5' : ''}`}
        />
      )}

      {/* Center: Editor / Whiteboard & Output */}
      {(!isMobile || mobileTab === 'workspace') && (
        <div 
          className="flex-1 flex flex-col relative z-10"
          style={isMobile ? { height: 'calc(100vh - 120px)', margin: '12px' } : { margin: '16px 8px' }}
        >
          
          {/* Top Action Bar */}
          <div className="h-16 glass-panel rounded-t-2xl border-b-0 border-white/10 flex items-center justify-between px-4 z-20">
            <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
              <button
                className={`px-4 md:px-5 py-2 rounded-lg flex items-center text-xs md:text-sm font-semibold transition-all ${
                  activeTab === 'editor' 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                <Code className="w-4 h-4 mr-2" /> Code
              </button>
              <button
                className={`px-4 md:px-5 py-2 rounded-lg flex items-center text-xs md:text-sm font-semibold transition-all ${
                  activeTab === 'whiteboard' 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('whiteboard')}
              >
                <PenTool className="w-4 h-4 mr-2" /> Board
              </button>
            </div>
            
            {activeTab === 'editor' && (
              <div className="flex items-center space-x-2 md:space-x-3">
                <select
                  className="bg-slate-900/80 border border-white/10 text-white text-xs md:text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent block px-2 md:px-3 py-1.5 md:py-2 outline-none transition-all cursor-pointer hover:bg-slate-800"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    socket.emit('language-change', { roomId, language: e.target.value });
                  }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
                <button
                  onClick={handleRunCode}
                  disabled={isExecuting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/20 shadow-[0_4px_15px_rgba(16,185,129,0.2)] text-white px-3 md:px-5 py-1.5 md:py-2 rounded-xl flex items-center text-xs md:text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  <Play className={`w-3.5 h-3.5 mr-1.5 ${isExecuting ? 'animate-pulse' : ''}`} /> 
                  {isExecuting ? 'Running...' : 'Run'}
                </button>
              </div>
            )}
          </div>

          {/* Main Workspace */}
          <div className="flex-1 relative bg-[#0f111a] border border-white/10 z-10 overflow-hidden shadow-2xl">
            <div className={`absolute inset-0 ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
              <EditorComponent roomId={roomId} code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
            </div>
            <div className={`absolute inset-0 ${activeTab === 'whiteboard' ? 'block' : 'hidden'}`}>
              <Whiteboard roomId={roomId} isVisible={activeTab === 'whiteboard'} />
            </div>
          </div>

          {/* Output Window */}
          <div className="h-44 md:h-56 glass-panel rounded-b-2xl border-t-0 border-white/10 flex flex-col z-20">
            <div className="bg-white/5 border-b border-white/5 px-5 py-2 text-[10px] md:text-xs text-indigo-300 font-bold uppercase tracking-widest flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></div>
              Terminal Output
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm custom-scrollbar bg-black/40">
              <OutputWindow output={output} />
            </div>
          </div>
        </div>
      )}

      {/* Right Resizer */}
      {!isMobile && (
        <div 
          onMouseDown={startResizeRight}
          className={`w-1 cursor-col-resize self-stretch hover:w-1.5 hover:bg-indigo-500/30 active:bg-indigo-500/80 transition-all z-20 ${isResizingRight ? 'bg-indigo-500/80 w-1.5' : ''}`}
        />
      )}

      {/* Right Panel: Chat */}
      {(!isMobile || mobileTab === 'chat') && (
        <div 
          className="flex flex-col relative z-10"
          style={isMobile ? { width: '100%', height: 'calc(100vh - 120px)', margin: '12px' } : { width: `${rightWidth}px`, margin: '16px 16px 16px 8px' }}
        >
          <Chat roomId={roomId} />
        </div>
      )}

      {/* Mobile Bottom Navigation (only on mobile) */}
      {isMobile && (
        <div className="h-16 bg-slate-950/90 border-t border-white/10 flex items-center justify-around z-30 backdrop-blur-md sticky bottom-0">
          <button
            onClick={() => setMobileTab('users')}
            className={`flex flex-col items-center justify-center w-20 h-full transition-all gap-1 ${mobileTab === 'users' ? 'text-indigo-400 scale-105' : 'text-gray-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Team</span>
          </button>
          <button
            onClick={() => setMobileTab('workspace')}
            className={`flex flex-col items-center justify-center w-20 h-full transition-all gap-1 ${mobileTab === 'workspace' ? 'text-indigo-400 scale-105' : 'text-gray-400'}`}
          >
            <Code className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Workspace</span>
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex flex-col items-center justify-center w-20 h-full transition-all gap-1 ${mobileTab === 'chat' ? 'text-indigo-400 scale-105' : 'text-gray-400'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Chat</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default Room;
