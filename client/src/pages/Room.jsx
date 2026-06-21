import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import EditorComponent from '../components/Editor';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import OutputWindow from '../components/OutputWindow';
import TestRunner from '../components/TestRunner';
import AIAssistant from '../components/AIAssistant';
import api from '../utils/api';
import confetti from 'canvas-confetti';
import { Users, Code, PenTool, Play, LogOut, Copy, Hash, MessageSquare, Download, Wifi, WifiOff, CheckCircle2, AlertCircle, Keyboard, X, Sparkles, PanelBottom, Maximize2, Minimize2, Settings2, Plus, Minus, MonitorPlay, MonitorStop, Terminal, Layers, ChevronDown, DoorOpen } from 'lucide-react';

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
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [chatMessagesForAI, setChatMessagesForAI] = useState([]);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [activePresenter, setActivePresenter] = useState(null);

  const [messages, setMessages] = useState([]);
  const whiteboardStrokesRef = useRef([]);

  const [testCases, setTestCases] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [bottomTab, setBottomTab] = useState('terminal');

  const [codeComments, setCodeComments] = useState([]);

  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [mobileTab, setMobileTab] = useState('workspace');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

    const joinRoom = () => {
      socket.emit('join-room', { roomId, username: user.username });
      setIsConnected(true);
    };

    if (socket.connected) {
      joinRoom();
    }

    const onConnect = () => joinRoom();
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('active-users', (users) => {
      setActiveUsers(users.filter(u => u.socketId !== socket.id));
    });

    socket.on('start-presenting', ({ username }) => {
      setActivePresenter(username);
      if (username !== user.username) {
        showToast(`${username} started presenting! Follow their cursor.`, 'success');
      }
    });

    socket.on('stop-presenting', () => {
      setActivePresenter(null);
    });

    socket.on('test-cases-history', (history) => {
      setTestCases(Array.isArray(history) ? history : []);
    });
    socket.on('test-cases-sync', (syncedCases) => {
      setTestCases(Array.isArray(syncedCases) ? syncedCases : []);
    });
    socket.on('run-history', (history) => {
      setRunHistory(Array.isArray(history) ? history : []);
    });
    socket.on('new-run-history', (newRun) => {
      setRunHistory(prev => [newRun, ...prev].slice(0, 20));
    });

    socket.on('code-comments-history', (history) => {
      setCodeComments(Array.isArray(history) ? history : []);
    });
    socket.on('new-code-comment', (comment) => {
      setCodeComments(prev => [...prev, comment]);
    });
    socket.on('resolve-code-comment', (commentId) => {
      setCodeComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c));
    });
    socket.on('reply-code-comment', ({ commentId, reply }) => {
      setCodeComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c));
    });

    socket.on('chat-history', (history) => {
      const msgs = Array.isArray(history) ? history : [];
      setMessages(msgs);
      setChatMessagesForAI(msgs);
    });
    socket.on('chat-message', (msg) => {
      setMessages(prev => {
        const updated = [...prev, msg];
        setChatMessagesForAI(updated);
        return updated;
      });
    });
    socket.on('edit-message', ({ id, newMessage }) => {
      setMessages(prev => {
        const updated = prev.map(msg => msg.id === id ? { ...msg, message: newMessage, isEdited: true } : msg);
        setChatMessagesForAI(updated);
        return updated;
      });
    });

    socket.on('whiteboard-history', (history) => {
      whiteboardStrokesRef.current = history || [];
    });
    socket.on('whiteboard-draw', ({ drawData }) => {
      whiteboardStrokesRef.current.push(drawData);
    });
    socket.on('whiteboard-clear', () => {
      whiteboardStrokesRef.current = [];
    });

    return () => {
      socket.emit('leave-room', { roomId, username: user.username });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('active-users');
      socket.off('start-presenting');
      socket.off('stop-presenting');
      socket.off('test-cases-history');
      socket.off('test-cases-sync');
      socket.off('run-history');
      socket.off('new-run-history');
      socket.off('code-comments-history');
      socket.off('new-code-comment');
      socket.off('resolve-code-comment');
      socket.off('reply-code-comment');
      socket.off('chat-history');
      socket.off('chat-message');
      socket.off('edit-message');
      socket.off('whiteboard-history');
      socket.off('whiteboard-draw');
      socket.off('whiteboard-clear');
    };
  }, [roomId, user, socket]);

  const triggerSuccessConfetti = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setBottomTab('terminal');
    try {
      const res = await api.post('/execute/run-code', {
        source_code: code,
        language,
        stdin
      });
      setOutput(res.data);
      if (!res.data.stderr) {
        triggerSuccessConfetti();
        showToast('Code executed successfully', 'success');
      } else {
        showToast('Executed with warnings/errors', 'error');
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Execution Failed';
      setOutput({ stderr: errorMsg });
      showToast('Execution failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    showToast('Room ID copied to clipboard');
  };

  const handleDownloadCode = () => {
    const extMap = { javascript: 'js', python: 'py', java: 'java', cpp: 'cpp', c: 'c' };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language]);

  return (
    <div className="flex h-screen w-screen bg-[#070a14] text-white overflow-hidden font-sans selection:bg-indigo-500/30 flex-col md:flex-row p-4 gap-2 box-border relative">
      
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0"></div>

      {/* Mobile Top Header */}
      {isMobile && (
        <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 flex items-center justify-between z-30 backdrop-blur-md rounded-xl mb-2 relative">
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

      {/* Left Panel */}
      {showLeftPanel && (!isMobile || mobileTab === 'users') && (
        <div 
          className="glass-panel rounded-2xl flex flex-col overflow-hidden border-white/10 shadow-2xl relative z-10 min-h-0 animate-fadeIn"
          style={isMobile ? { width: '100%', flex: 1 } : { width: `${leftWidth}px`, flexShrink: 0 }}
        >
          <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0 flex items-center justify-between">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]"></div>
              Workspace
            </h2>
            {isConnected ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full" title="Connected">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full" title="Reconnecting...">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              </div>
            )}
          </div>
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between glass-input p-3 rounded-xl group cursor-pointer hover:border-indigo-500/50 transition-all" onClick={copyRoomId}>
              <div className="flex items-center gap-2 overflow-hidden">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-sm truncate text-white/90">{roomId}</span>
              </div>
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-400" /> Team
              </h3>
              <span className="bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-200 py-0.5 px-2.5 rounded-full text-xs font-bold border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
                {activeUsers.length + 1}
              </span>
            </div>
            
            <ul className="space-y-2.5">
              {/* Current User */}
              <li className="flex items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-xl p-3 shadow-inner">
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg mr-3 border-2 border-white/20 text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${user?.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 80%, 60%), hsl(${(user?.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360 + 40) % 360}, 80%, 40%))` }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(52,211,153,0.9)]"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">{user?.username}</span>
                  <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">You</span>
                </div>
              </li>
              
              {/* Other Users */}
              {activeUsers.map((u, i) => {
                const hue = u.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                return (
                  <li key={u.socketId} className={`flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200 animate-fadeIn group`} style={{animationDelay: `${(i+1)*100}ms`}}>
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-md mr-3 border border-white/10 text-white"
                        style={{ background: `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 70%, 35%))` }}
                      >
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></span>
                    </div>
                    <span className="text-gray-200 font-medium text-sm group-hover:text-white transition-colors">{u.username}</span>
                  </li>
                );
              })}
              
              {activeUsers.length === 0 && (
                <li className="text-xs text-gray-500 italic text-center p-5 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08]">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  Waiting for others to join...
                </li>
              )}
            </ul>
          </div>
          
          {!isMobile && (
            <div className="p-4 border-t border-white/10 bg-gradient-to-t from-slate-900/80 to-transparent shrink-0 flex gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center transition-all font-semibold hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <DoorOpen className="w-4 h-4 mr-2" /> Leave
              </button>
              <button
                onClick={() => setShowAI(prev => !prev)}
                className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all ${showAI ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border-white/10'}`}
                title="Toggle AI Assistant"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="w-12 h-12 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 rounded-xl flex items-center justify-center transition-all"
                title="Shortcuts (Ctrl+/)"
              >
                <Keyboard className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Left Resizer */}
      {!isMobile && showLeftPanel && (
        <div 
          onMouseDown={startResizeLeft}
          className={`w-1 cursor-col-resize self-stretch hover:w-1.5 hover:bg-indigo-500/40 active:bg-indigo-500/80 transition-all z-20 shrink-0 mx-1 rounded-full ${isResizingLeft ? 'bg-indigo-500/80 w-1.5' : ''}`}
        />
      )}

      {/* Center */}
      {(!isMobile || mobileTab === 'workspace') && (
        <div 
          className="flex-1 flex flex-col relative z-10 min-h-0 min-w-0 animate-fadeIn animate-delay-100"
          style={isMobile ? { flex: 1 } : {}}
        >
          
          {/* Top Action Bar */}
          <div className="min-h-[56px] shrink-0 glass-panel rounded-t-[2rem] border-b-0 border-white/10 flex items-center justify-between px-5 py-2 z-20 relative overflow-x-hidden flex-wrap gap-1">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="flex p-0.5 rounded-[1.25rem] bg-gradient-to-b from-slate-700/60 via-slate-600/30 to-slate-700/60 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <button
                className={`px-4 py-2 rounded-xl flex items-center text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                  activeTab === 'editor' 
                    ? 'bg-gradient-to-b from-slate-600 via-slate-400 to-slate-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] border border-white/20' 
                    : 'text-slate-400 hover:text-white bg-gradient-to-b from-transparent via-transparent to-transparent hover:from-slate-600/40 hover:via-slate-500/20 hover:to-slate-600/40'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                {activeTab === 'editor' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-indigo-400/10 to-indigo-500/20 pointer-events-none"></div>}
                <Code className="w-4 h-4 mr-1.5" /> Code
              </button>
              <button
                className={`px-4 py-2 rounded-xl flex items-center text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                  activeTab === 'whiteboard' 
                    ? 'bg-gradient-to-b from-slate-600 via-slate-400 to-slate-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] border border-white/20' 
                    : 'text-slate-400 hover:text-white bg-gradient-to-b from-transparent via-transparent to-transparent hover:from-slate-600/40 hover:via-slate-500/20 hover:to-slate-600/40'
                }`}
                onClick={() => setActiveTab('whiteboard')}
              >
                {activeTab === 'whiteboard' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-indigo-400/10 to-indigo-500/20 pointer-events-none"></div>}
                <PenTool className="w-4 h-4 mr-1.5" /> Board
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              
              {activeTab === 'editor' && (
                <div className="flex items-center p-0.5 rounded-xl bg-gradient-to-b from-slate-700/50 via-slate-600/20 to-slate-700/50 border border-white/[0.04]">
                  {activePresenter === user.username ? (
                    <button
                      onClick={() => {
                        socket.emit('stop-presenting', { roomId });
                        setActivePresenter(null);
                      }}
                      className="px-2 md:px-3 py-1.5 md:py-2 rounded-xl flex items-center text-[10px] md:text-xs font-bold transition-all bg-gradient-to-b from-red-500/30 via-red-400/20 to-red-500/30 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] animate-pulse"
                    >
                      <MonitorStop className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Stop
                    </button>
                  ) : !activePresenter ? (
                    <button
                      onClick={() => {
                        socket.emit('start-presenting', { roomId, username: user.username });
                        setActivePresenter(user.username);
                      }}
                      className="px-2 md:px-3 py-1.5 md:py-2 rounded-xl flex items-center text-[10px] md:text-xs font-bold transition-all bg-gradient-to-b from-slate-600/50 via-slate-500/30 to-slate-600/50 text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_0_15px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
                    >
                      <MonitorPlay className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Present
                    </button>
                  ) : (
                    <div className="flex items-center px-2 md:px-3 py-1.5 bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] md:text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]">
                      <MonitorPlay className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" /> Following
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center p-0.5 rounded-xl bg-gradient-to-b from-slate-700/50 via-slate-600/20 to-slate-700/50 border border-white/[0.04]">
                {!isMobile && (
                  <>
                    <button
                      onClick={() => setShowLeftPanel(prev => !prev)}
                      title={showLeftPanel ? 'Hide Team Panel' : 'Show Team Panel'}
                      className={`px-2 md:px-2.5 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                        !showLeftPanel 
                          ? 'bg-gradient-to-b from-indigo-500/30 via-indigo-400/20 to-indigo-500/30 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]' 
                          : 'bg-gradient-to-b from-slate-600/40 via-slate-500/20 to-slate-600/40 text-slate-400 hover:text-white border-white/[0.06] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => setShowBottomPanel(prev => !prev)}
                      title={showBottomPanel ? 'Hide Terminal Panel' : 'Show Terminal Panel'}
                      className={`px-2 md:px-2.5 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                        !showBottomPanel 
                          ? 'bg-gradient-to-b from-indigo-500/30 via-indigo-400/20 to-indigo-500/30 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]' 
                          : 'bg-gradient-to-b from-slate-600/40 via-slate-500/20 to-slate-600/40 text-slate-400 hover:text-white border-white/[0.06] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => setShowRightPanel(prev => !prev)}
                      title={showRightPanel ? 'Hide Chat Panel' : 'Show Chat Panel'}
                      className={`px-2 md:px-2.5 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                        !showRightPanel 
                          ? 'bg-gradient-to-b from-indigo-500/30 via-indigo-400/20 to-indigo-500/30 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]' 
                          : 'bg-gradient-to-b from-slate-600/40 via-slate-500/20 to-slate-600/40 text-slate-400 hover:text-white border-white/[0.06] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(err => console.log(err));
                    } else {
                      document.exitFullscreen();
                    }
                  }}
                  title="Toggle Fullscreen"
                  className="px-2 md:px-2.5 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border bg-gradient-to-b from-slate-600/40 via-slate-500/20 to-slate-600/40 text-slate-400 hover:text-white border-white/[0.06] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              {activeTab === 'editor' && (
                <>
                  <div className="hidden xl:flex items-center gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-gradient-to-b from-slate-700/40 via-slate-600/20 to-slate-700/40 border border-white/[0.05] text-[10px] md:text-[11px] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-300" />
                      {language.toUpperCase()}
                    </span>
                    <span className="w-px h-3 md:h-4 bg-white/[0.06]" />
                    <span className="whitespace-nowrap">{code.split('\n').length} lines</span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1 px-1.5 py-1 rounded-xl bg-gradient-to-b from-slate-700/40 via-slate-600/20 to-slate-700/40 border border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Settings2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-500" />
                    <button
                      onClick={() => setEditorFontSize(size => Math.max(11, size - 1))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Decrease editor font size"
                    >
                      <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                    <span className="w-5 md:w-7 text-center text-[10px] md:text-[11px] font-bold text-slate-300">{editorFontSize}</span>
                    <button
                      onClick={() => setEditorFontSize(size => Math.min(22, size + 1))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Increase editor font size"
                    >
                      <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleDownloadCode}
                    title="Download Code"
                    className="px-2 md:px-2.5 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border bg-gradient-to-b from-slate-600/40 via-slate-500/20 to-slate-600/40 text-slate-400 hover:text-white border-white/[0.06] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  >
                    <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <select
                    className="bg-gradient-to-b from-slate-700/50 via-slate-600/20 to-slate-700/50 border border-white/[0.08] text-white text-[10px] md:text-xs rounded-xl block px-1.5 md:px-3 py-1.5 md:py-2 outline-none transition-all cursor-pointer hover:border-white/20 hover:from-slate-600/50 hover:via-slate-500/20 hover:to-slate-600/50 min-w-0 max-w-[80px] md:max-w-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                  >
                    <option value="vs-dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="hc-black">High Contrast</option>
                  </select>
                  <select
                    className="bg-gradient-to-b from-slate-700/50 via-slate-600/20 to-slate-700/50 border border-white/[0.08] text-white text-[10px] md:text-xs rounded-xl block px-1.5 md:px-3 py-1.5 md:py-2 outline-none transition-all cursor-pointer hover:border-white/20 hover:from-slate-600/50 hover:via-slate-500/20 hover:to-slate-600/50 min-w-0 max-w-[65px] md:max-w-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      socket.emit('language-change', { roomId, language: e.target.value });
                    }}
                  >
                    <option value="javascript">JS</option>
                    <option value="python">Py</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                  <button
                    onClick={handleRunCode}
                    disabled={isExecuting}
                    className="px-3 md:px-5 py-1.5 md:py-2 rounded-xl flex items-center text-xs md:text-sm font-semibold transition-all duration-300 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500 text-white border border-emerald-300/30 shadow-[0_0_20px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-105 disabled:opacity-40 disabled:transform-none disabled:shadow-none relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
                    <Play className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isExecuting ? 'animate-pulse' : ''} md:mr-1.5`} /> 
                    <span className="hidden md:inline">{isExecuting ? 'Running...' : 'Run'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 relative bg-gradient-to-br from-[#0d1117] to-[#0f111a] border border-white/[0.07] z-10 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none"></div>
            <div className={`absolute inset-0 ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
              <EditorComponent 
                roomId={roomId} 
                code={code} 
                setCode={setCode} 
                language={language} 
                setLanguage={setLanguage} 
                theme={editorTheme} 
                showToast={showToast} 
                fontSize={editorFontSize} 
                onRunCode={handleRunCode}
                isExecuting={isExecuting}
                onToggleAI={() => setShowAI(!showAI)}
                activePresenter={activePresenter}
                currentUser={user.username}
                codeComments={codeComments}
                setCodeComments={setCodeComments}
                socket={socket}
              />
            </div>
            <div className={`absolute inset-0 ${activeTab === 'whiteboard' ? 'block' : 'hidden'}`}>
              <Whiteboard roomId={roomId} isVisible={activeTab === 'whiteboard'} sharedStrokesRef={whiteboardStrokesRef} />
            </div>
          </div>

          {/* Output Window */}
          {showBottomPanel && (
          <div className={`${isOutputExpanded ? 'h-[55vh]' : 'h-44 md:h-56'} glass-panel rounded-b-2xl border-t-0 border-white/10 flex flex-col z-20 transition-[height] duration-300 relative`}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none"></div>
            <div className="bg-slate-900/60 border-b border-white/5 px-5 py-2 flex items-center justify-between shrink-0 backdrop-blur-sm">
              <div className="flex space-x-4">
                <button
                  onClick={() => setBottomTab('terminal')}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center transition-colors ${bottomTab === 'terminal' ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Terminal className="w-3 h-3 mr-1.5" />
                  Terminal
                </button>
                <button
                  onClick={() => setBottomTab('tests')}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center transition-colors ${bottomTab === 'tests' ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Layers className="w-3 h-3 mr-1.5" />
                  Tests & History
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowStdin(prev => !prev)}
                  className={`p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider ${showStdin ? 'text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                  title="Toggle stdin"
                >
                  <PanelBottom className="w-3.5 h-3.5" />
                  Stdin
                </button>
                <button
                  onClick={() => setIsOutputExpanded(prev => !prev)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                  title={isOutputExpanded ? 'Collapse Output' : 'Expand Output'}
                >
                  {isOutputExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    const text = output?.stdout || output?.stderr || output?.compile_output;
                    if (text) {
                      navigator.clipboard.writeText(text);
                      showToast('Output copied to clipboard');
                    }
                  }}
                  disabled={!output}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center"
                  title="Copy Output"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOutput(null)}
                  disabled={!output}
                  className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 text-[10px] font-bold uppercase tracking-wider px-2"
                  title="Clear Output"
                >
                  Clear
                </button>
                <div className="w-px h-5 bg-white/10" />
                <button
                  onClick={() => setShowBottomPanel(false)}
                  className="text-slate-400 hover:text-indigo-300 p-1 rounded hover:bg-white/10 transition-colors"
                  title="Hide Terminal Panel"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {bottomTab === 'terminal' ? (
              <>
                {showStdin && (
                  <div className="border-b border-white/5 bg-slate-950/70 p-3 animate-fadeIn shrink-0">
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Standard input for your program, one value per line..."
                      className="w-full h-20 resize-none rounded-xl bg-black/30 border border-white/10 focus:border-indigo-500/40 px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{stdin ? `${stdin.split('\n').length} input line${stdin.split('\n').length === 1 ? '' : 's'}` : 'No stdin configured'}</span>
                      <button onClick={() => setStdin('')} className="hover:text-red-300 uppercase font-bold tracking-wider">Clear stdin</button>
                    </div>
                  </div>
                )}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm custom-scrollbar bg-black/40">
                  <OutputWindow output={output} isExecuting={isExecuting} />
                </div>
              </>
            ) : (
              <TestRunner 
                code={code}
                language={language}
                roomId={roomId}
                testCases={testCases}
                setTestCases={setTestCases}
                runHistory={runHistory}
                setRunHistory={setRunHistory}
                socket={socket}
                showToast={showToast}
              />
            )}
          </div>
        )}
        </div>
      )}

      {/* Right Resizer */}
      {!isMobile && showRightPanel && (
        <div 
          onMouseDown={startResizeRight}
          className={`w-1 cursor-col-resize self-stretch hover:w-1.5 hover:bg-indigo-500/40 active:bg-indigo-500/80 transition-all z-20 shrink-0 mx-1 rounded-full ${isResizingRight ? 'bg-indigo-500/80 w-1.5' : ''}`}
        />
      )}

      {/* Right Panel: Chat */}
      {showRightPanel && (!isMobile || mobileTab === 'chat') && (
        <div 
          className="flex flex-col relative z-10 min-h-0 animate-fadeIn animate-delay-200"
          style={isMobile ? { width: '100%', flex: 1 } : { width: `${rightWidth}px`, flexShrink: 0 }}
        >
          <Chat roomId={roomId} messages={messages} setMessages={setMessages} onMessagesUpdate={setChatMessagesForAI} />
        </div>
      )}

      {/* AI Panel */}
      {showAI && !isMobile && (
        <div className="fixed top-0 right-0 h-screen w-[360px] z-[150] p-4 animate-fadeIn">
          <AIAssistant
            code={code}
            language={language}
            chatMessages={chatMessagesForAI}
            onInsertCode={(newCode) => {
              setCode(newCode);
              showToast('Code inserted into editor!', 'success');
            }}
            onClose={() => setShowAI(false)}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="h-16 shrink-0 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-around z-30 mb-2">
          <button 
            onClick={() => setMobileTab('users')}
            className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${mobileTab === 'users' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold tracking-wider">TEAM</span>
          </button>
          <button 
            onClick={() => setMobileTab('workspace')}
            className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${mobileTab === 'workspace' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            <Code className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold tracking-wider">WORK</span>
          </button>
          <button 
            onClick={() => setMobileTab('chat')}
            className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${mobileTab === 'chat' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold tracking-wider">CHAT</span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl max-w-lg w-full relative">
            <button 
              onClick={() => setShowShortcuts(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-slate-400 text-sm">Boost your productivity</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-300 font-medium">Run Code</span>
                <div className="flex gap-1.5">
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">Ctrl</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">Enter</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-300 font-medium">Toggle Shortcuts</span>
                <div className="flex gap-1.5">
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">Ctrl</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">/</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-300 font-medium">Download Code</span>
                <div className="flex gap-1.5">
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">Ctrl</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">S</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-300 font-medium">Format Document</span>
                <div className="flex gap-1.5">
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">Shift</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">Alt</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">F</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <button 
                onClick={() => setShowShortcuts(false)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
