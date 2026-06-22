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
import NotesPanel from '../components/NotesPanel';
import TowerLoader from '../components/TowerLoader';
import api from '../utils/api';
import confetti from 'canvas-confetti';
import { Users, Code, PenTool, Play, LogOut, Copy, Hash, MessageSquare, Download, Wifi, WifiOff, CheckCircle2, AlertCircle, Keyboard, X, Sparkles, PanelBottom, Maximize2, Minimize2, Settings2, Plus, Minus, MonitorPlay, MonitorStop, Terminal, Layers, ChevronDown, DoorOpen, Loader2, FileText } from 'lucide-react';

const Room = () => {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('editor');
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUserIsEditing, setCurrentUserIsEditing] = useState(false);
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
  const [activePreset, setActivePreset] = useState('coding');
  const [presetAnimating, setPresetAnimating] = useState(null);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [isWhiteboardLoading, setIsWhiteboardLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const whiteboardStrokesRef = useRef([]);

  const [testCases, setTestCases] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [bottomTab, setBottomTab] = useState('terminal');

  const [codeComments, setCodeComments] = useState([]);
  const [roomAdminId, setRoomAdminId] = useState(null);

  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [mobileTab, setMobileTab] = useState('workspace');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!roomId) return;
    setRoomError(null);
    api.get(`/rooms/${roomId}`).then(res => {
      setRoomAdminId(res.data.admin);
    }).catch(err => {
      const status = err.response?.status;
      if (status === 404) {
        setRoomError('Room not found');
      } else if (status === 403) {
        setRoomError('Not authorized to access this room');
      } else {
        setRoomError('Failed to load room');
      }
    });
  }, [roomId]);

  const applyPreset = (preset) => {
    setPresetAnimating(preset);
    setTimeout(() => setPresetAnimating(null), 600);
    setActivePreset(preset);
    switch (preset) {
      case 'coding':
        setActiveTab('editor');
        setShowLeftPanel(true);
        setShowRightPanel(true);
        setShowBottomPanel(true);
        setLeftWidth(280);
        setRightWidth(280);
        setIsOutputExpanded(false);
        break;
      case 'discussion':
        setActiveTab('editor');
        setShowLeftPanel(true);
        setShowRightPanel(true);
        setShowBottomPanel(true);
        setLeftWidth(280);
        setRightWidth(420);
        setIsOutputExpanded(false);
        break;
      case 'whiteboard':
        setActiveTab('whiteboard');
        setShowLeftPanel(true);
        setShowRightPanel(true);
        setShowBottomPanel(false);
        setLeftWidth(200);
        setRightWidth(280);
        setIsOutputExpanded(false);
        break;
      case 'focus':
        setActiveTab('editor');
        setShowLeftPanel(false);
        setShowRightPanel(false);
        setShowBottomPanel(false);
        setIsOutputExpanded(false);
        break;
    }
  };

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
      socket.emit('join-room', {
        roomId,
        username: user.username,
        fullName: user.fullName || '',
        collegeName: user.collegeName || '',
        experienceLevel: user.experienceLevel || '',
        avatarColor: user.avatarColor || '',
      });
      setIsConnected(true);
      setIsRoomReady(true);
    };

    if (socket.connected) {
      joinRoom();
    }

    const onConnect = () => joinRoom();
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('active-users', (users) => {
      const currentUser = users.find(u => u.socketId === socket.id);
      setCurrentUserIsEditing(currentUser?.isEditing ?? false);
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

    socket.on('user-joined', ({ username }) => {
      showToast(`${username} joined the room`, 'success');
    });

    socket.on('user-left', ({ username }) => {
      showToast(`${username} left the room`, 'info');
    });

    socket.on('message-deleted', ({ id }) => {
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== id);
        setChatMessagesForAI(updated);
        return updated;
      });
    });

    socket.on('notes-notification', ({ message }) => {
      if (message) showToast(message, 'info');
    });

    socket.on('room-deleted', () => {
      showToast('Room has been deleted by admin', 'error');
      navigate('/dashboard');
    });

    socket.on('room-join-error', ({ message }) => {
      setRoomError(message || 'Access denied');
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
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('message-deleted');
      socket.off('notes-notification');
      socket.off('room-deleted');
      socket.off('room-join-error');
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

  useEffect(() => {
    if (activeTab === 'whiteboard') {
      setIsWhiteboardLoading(true);
      const timer = setTimeout(() => setIsWhiteboardLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen aurora-bg text-white overflow-hidden font-sans selection:bg-indigo-500/30 flex-col md:flex-row p-2 md:p-3 lg:p-4 gap-1.5 md:gap-2 box-border relative">
      <div className="grid-overlay"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0"></div>

      {/* Initial Loading Overlay */}
      {!isRoomReady && !roomError && <TowerLoader fullScreen text="Joining CodeSync room..." />}

      {/* Room Error */}
      {roomError && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#05080f] animate-fadeIn px-4">
          <div className="metallic-panel p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
            <p className="text-sm text-slate-400 mb-6">{roomError}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-xl glow-button text-white font-bold text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Reconnection Banner */}
      {isRoomReady && !isConnected && (
        <div className="absolute top-0 left-0 right-0 z-[90] animate-fadeIn">
          <div className="mx-4 mt-4 px-5 py-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
              <div>
                <p className="text-sm font-semibold text-amber-300">Connection lost</p>
                <p className="text-[11px] text-amber-400/70">Trying to reconnect...</p>
              </div>
            </div>
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        </div>
      )}

      {/* Whiteboard Loading Overlay */}
      {isWhiteboardLoading && activeTab === 'whiteboard' && (
        <div className="absolute inset-0 z-[60] bg-[#05080f]/90 flex items-center justify-center animate-fadeIn">
          <TowerLoader text="Loading whiteboard..." />
        </div>
      )}

      {/* Mobile Top Header */}
      {isMobile && (
        <div className="px-3 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between z-30 backdrop-blur-md rounded-xl mb-1.5 relative">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs truncate text-indigo-300 max-w-[140px]">{roomId}</span>
            <button onClick={copyRoomId} className="p-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 active:scale-95 transition-all shrink-0">
              <Copy className="w-3 h-3 text-gray-300" />
            </button>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg flex items-center text-xs font-semibold shrink-0"
          >
            <LogOut className="w-3 h-3 mr-1" /> Leave
          </button>
        </div>
      )}

      {/* Left Panel */}
      {showLeftPanel && (!isMobile || mobileTab === 'users') && (
        <div 
          className="metallic-panel rounded-2xl flex flex-col overflow-hidden border-white/10 shadow-2xl relative z-10 min-h-0 animate-fadeIn"
          style={isMobile ? { width: '100%', flex: 1 } : { width: `${leftWidth}px`, flexShrink: 0 }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-[#0c0f1a] shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Code className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">CodeSync</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-ping'}`}></span>
                  <span className="text-[10px] text-slate-500 font-medium">{isConnected ? 'Connected' : 'Reconnecting...'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeftPanel(false)}
              className="text-slate-500 hover:text-white w-7 h-7 rounded-lg hover:bg-white/[0.06] transition-all flex items-center justify-center"
              title="Hide Team Panel"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Room ID */}
          <div className="px-5 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/30 rounded-xl px-4 py-2.5 group cursor-pointer transition-all" onClick={copyRoomId}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Hash className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="font-mono text-xs truncate text-slate-300 group-hover:text-white transition-colors">{roomId}</span>
              </div>
              <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 transition-colors shrink-0" />
            </div>
          </div>
          
          {/* Team Section */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Online
              </h3>
              <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                {activeUsers.length + 1}
              </span>
            </div>
            
            <ul className="space-y-2">
              {/* Current User */}
              <li className="flex items-center bg-gradient-to-r from-indigo-500/[0.08] to-indigo-500/[0.02] border border-indigo-500/20 rounded-xl p-3">
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold mr-3 border-2 border-white/20 text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, hsl(${user?.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 80%, 60%), hsl(${(user?.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360 + 40) % 360}, 80%, 40%))` }}
                  >
                    {(user?.fullName || user?.username)?.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[3px] border-[#0c0f1a] shadow-[0_0_8px_rgba(52,211,153,0.7)]"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate block">{user?.fullName || user?.username || 'You'}</span>
                    <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded-md uppercase tracking-wider">You</span>
                    {currentUserIsEditing && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">@{user?.username}</span>
                    {(user?.collegeName) && (
                      <>
                        <span className="text-[8px] text-slate-600">·</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.collegeName}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-600">{currentUserIsEditing ? 'Editing code' : 'Active now'}</span>
                    {(user?.experienceLevel) && (
                      <>
                        <span className="text-[8px] text-slate-600">·</span>
                        <span className="text-[9px] text-indigo-400/60 font-medium">{user.experienceLevel}</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
              
              {/* Other Users */}
              {activeUsers.map((u, i) => {
                const hue = u.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                const displayName = u.fullName || u.username || 'Unknown User';
                return (
                  <li key={u.socketId} className="flex items-center bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3 transition-all duration-200 animate-fadeIn group" style={{animationDelay: `${(i+1)*100}ms`}}>
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold mr-3 border border-white/10 text-white shadow-md"
                        style={{ background: u.avatarColor ? u.avatarColor : `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 70%, 35%))` }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-[3px] border-[#0d1117] shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-medium text-sm group-hover:text-white transition-colors truncate block">{displayName}</span>
                        {u.isEditing && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">@{u.username || 'No username'}</span>
                        {(u.collegeName) && (
                          <>
                            <span className="text-[8px] text-slate-600">·</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{u.collegeName}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-600">{u.isEditing ? 'Editing code' : 'Active now'}</span>
                        {(u.experienceLevel) && (
                          <>
                            <span className="text-[8px] text-slate-600">·</span>
                            <span className="text-[9px] text-indigo-400/60 font-medium">{u.experienceLevel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
              
              {activeUsers.length === 0 && (
                <li className="text-xs text-slate-500 text-center py-8 bg-white/[0.01] rounded-xl border border-dashed border-white/[0.06]">
                  <Users className="w-8 h-8 mx-auto mb-3 text-slate-600/50" />
                  <p className="font-medium">Waiting for team members</p>
                  <p className="text-[11px] text-slate-600 mt-1">Share the room ID to invite others</p>
                </li>
              )}
            </ul>
          </div>
          
          {/* Bottom Actions */}
          {!isMobile && (
            <div className="px-4 py-3 border-t border-white/10 bg-[#0c0f1a] shrink-0 flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 h-10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/20 rounded-xl flex items-center justify-center transition-all font-medium text-xs gap-2"
              >
                <DoorOpen className="w-3.5 h-3.5" /> Leave
              </button>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowAI(prev => !prev)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${showAI ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'}`}
                  title="Toggle AI Assistant"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 flex items-center justify-center transition-all"
                  title="Shortcuts (Ctrl+/)"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>
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
          <div className="min-h-[52px] shrink-0 metallic-panel rounded-t-[2rem] border-b-0 border-white/10 flex items-center justify-between px-3 md:px-5 py-1.5 z-20 relative overflow-x-hidden flex-wrap gap-1.5">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

            {/* Left: Tab switcher */}
            <div className="flex bg-white/[0.06] rounded-xl p-0.5 border border-white/[0.06]">
              <button
                className={`px-3 md:px-4 py-1.5 rounded-[10px] flex items-center text-xs md:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'editor'
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                <Code className="w-3.5 h-3.5 mr-1.5" /> Code
              </button>
              <button
                className={`px-3 md:px-4 py-1.5 rounded-[10px] flex items-center text-xs md:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'whiteboard'
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('whiteboard')}
              >
                <PenTool className="w-3.5 h-3.5 mr-1.5" /> Board
              </button>
            </div>

            {/* Layout Presets */}
            <div className="hidden md:flex bg-white/[0.04] rounded-xl p-0.5 border border-white/[0.05] gap-0.5" title="Layout presets">
              {[
                { id: 'coding', icon: Code, label: 'Coding Mode' },
                { id: 'discussion', icon: MessageSquare, label: 'Discussion Mode' },
                { id: 'whiteboard', icon: PenTool, label: 'Whiteboard Mode' },
                { id: 'focus', icon: Maximize2, label: 'Focus Mode' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  title={label}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    activePreset === id
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                  } ${presetAnimating === id ? 'scale-110' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">

              {activeTab === 'editor' && (
                <>
                  {activePresenter === user.username ? (
                    <button
                      onClick={() => { socket.emit('stop-presenting', { roomId }); setActivePresenter(null); }}
                      className="h-8 px-2.5 rounded-lg flex items-center text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors"
                    >
                      <MonitorStop className="w-3.5 h-3.5 mr-1" /> Stop
                    </button>
                  ) : !activePresenter ? (
                    <button
                      onClick={() => { socket.emit('start-presenting', { roomId, username: user.username }); setActivePresenter(user.username); }}
                      className="h-8 px-2.5 rounded-lg flex items-center text-[11px] font-semibold text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                    >
                      <MonitorPlay className="w-3.5 h-3.5 mr-1" /> Present
                    </button>
                  ) : (
                    <div className="h-8 px-2.5 rounded-lg flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 animate-pulse">
                      <MonitorPlay className="w-3.5 h-3.5 mr-1" /> Following
                    </div>
                  )}
                </>
              )}

              {/* Panel & fullscreen toggles */}
              {!isMobile && (
                <>
                  <div className="w-px h-5 bg-white/[0.06] mx-0.5" />
                  <button
                    onClick={() => setShowLeftPanel(prev => !prev)}
                    title={showLeftPanel ? 'Hide Team Panel' : 'Show Team Panel'}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                      !showLeftPanel
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                        : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.06]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowBottomPanel(prev => !prev)}
                    title={showBottomPanel ? 'Hide Terminal Panel' : 'Show Terminal Panel'}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                      !showBottomPanel
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                        : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.06]'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowRightPanel(prev => !prev)}
                    title={showRightPanel ? 'Hide Chat Panel' : 'Show Chat Panel'}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                      !showRightPanel
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                        : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.06]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-5 bg-white/[0.06] mx-0.5" />
                </>
              )}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen();
                  }
                }}
                title="Toggle Fullscreen"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.06] transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {activeTab === 'editor' && (
                <>
                  {/* Language & line info */}
                  <div className="hidden xl:flex items-center gap-2 h-7 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3 text-indigo-400" />
                      {language.toUpperCase()}
                    </span>
                    <span className="w-px h-3 bg-white/[0.06]" />
                    <span className="whitespace-nowrap">{code.split('\n').length} lines</span>
                  </div>

                  {/* Font size controls */}
                  <div className="hidden lg:flex items-center gap-0.5 h-7 px-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <Settings2 className="w-3 h-3 text-slate-500 mr-0.5" />
                    <button
                      onClick={() => setEditorFontSize(s => Math.max(11, s - 1))}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Decrease editor font size"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-[11px] font-semibold text-slate-300">{editorFontSize}</span>
                    <button
                      onClick={() => setEditorFontSize(s => Math.min(22, s + 1))}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Increase editor font size"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Download */}
                  <button
                    onClick={handleDownloadCode}
                    title="Download Code"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.06] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Theme select */}
                  <select
                    className="hidden sm:block h-8 bg-white/[0.06] border border-white/[0.08] text-white text-[11px] rounded-lg px-2 outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none"
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                  >
                    <option className="bg-slate-800 text-white" value="vs-dark">Dark</option>
                    <option className="bg-slate-800 text-white" value="light">Light</option>
                    <option className="bg-slate-800 text-white" value="hc-black">H. Contrast</option>
                  </select>

                  {/* Language select */}
                  <select
                    className="h-8 bg-white/[0.06] border border-white/[0.08] text-white text-[11px] rounded-lg px-2 outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none"
                    value={language}
                    onChange={(e) => { setLanguage(e.target.value); socket.emit('language-change', { roomId, language: e.target.value }); }}
                  >
                    <option className="bg-slate-800 text-white" value="javascript">JS</option>
                    <option className="bg-slate-800 text-white" value="python">Py</option>
                    <option className="bg-slate-800 text-white" value="java">Java</option>
                    <option className="bg-slate-800 text-white" value="cpp">C++</option>
                    <option className="bg-slate-800 text-white" value="c">C</option>
                  </select>

                  {/* Focus toggle (visible on all sizes) */}
                  <button
                    onClick={() => applyPreset(showLeftPanel || showRightPanel || showBottomPanel ? 'focus' : 'coding')}
                    title={showLeftPanel || showRightPanel || showBottomPanel ? 'Focus Mode' : 'Exit Focus'}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.06] transition-all"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Run button */}
                  <button
                    onClick={handleRunCode}
                    disabled={isExecuting}
                    className="h-8 px-4 rounded-lg flex items-center text-xs font-semibold transition-all bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-pulse' : ''} mr-1`} />
                    <span className="hidden md:inline">{isExecuting ? 'Running...' : 'Run'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 relative bg-gradient-to-br from-[#0d1117] to-[#0f111a] chrome-border z-10 overflow-hidden shadow-2xl">
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
          <div className={`${isOutputExpanded ? 'h-[55vh]' : 'h-44 md:h-56'} metallic-panel rounded-b-2xl border-t-0 border-white/10 flex flex-col z-20 transition-[height] duration-300 relative`}>
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

      {/* Right Panel: Chat / Notes */}
      {showRightPanel && (!isMobile || mobileTab === 'chat' || mobileTab === 'notes') && (
        <div 
          className="flex flex-col relative z-10 min-h-0 animate-fadeIn animate-delay-200"
          style={isMobile ? { width: '100%', flex: 1 } : { width: `${rightWidth}px`, flexShrink: 0 }}
        >
          {/* Tab headers */}
          <div className="flex bg-[#0c0f1a] border-b border-white/10 rounded-t-2xl shrink-0 overflow-hidden items-center">
            <button
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'chat'
                  ? 'text-indigo-300 bg-indigo-500/10 border-b-2 border-indigo-400'
                  : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
            <button
              onClick={() => setRightPanelTab('notes')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'notes'
                  ? 'text-indigo-300 bg-indigo-500/10 border-b-2 border-indigo-400'
                  : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Notes
            </button>
            <button
              onClick={() => setShowRightPanel(false)}
              className="px-3 py-3 text-slate-500 hover:text-indigo-300 hover:bg-white/[0.04] transition-all border-b-2 border-transparent"
              title="Hide Panel"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          {rightPanelTab === 'chat' ? (
            <Chat roomId={roomId} messages={messages} setMessages={setMessages} onMessagesUpdate={setChatMessagesForAI} onClosePanel={() => setShowRightPanel(false)} roomAdminId={roomAdminId} />
          ) : (
            <NotesPanel roomId={roomId} socket={socket} />
          )}
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
            onClick={() => { setMobileTab('chat'); setRightPanelTab('chat'); }}
            className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${(mobileTab === 'chat' && rightPanelTab === 'chat') ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold tracking-wider">CHAT</span>
          </button>
          <button 
            onClick={() => { setMobileTab('notes'); setRightPanelTab('notes'); }}
            className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${(mobileTab === 'notes' && rightPanelTab === 'notes') ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold tracking-wider">NOTES</span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn px-4 w-full md:w-auto">
          <div className={`flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' : toast.type === 'info' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : toast.type === 'info' ? <FileText className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="metallic-panel p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-2xl max-w-lg w-full">
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
