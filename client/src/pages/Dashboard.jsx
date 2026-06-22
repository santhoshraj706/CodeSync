import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
  LogOut,
  Plus,
  LogIn,
  Trash2,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  Search,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Star,
  Sparkles,
  FolderOpen,
  Hash,
  Zap,
  Clock,
  Layers,
  FileText,
  Code2,
  Globe,
  Briefcase,
  PenTool,
  ListFilter,
  ExternalLink,
  DoorOpen,
  Loader2,
  User,
  Settings,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'blank', label: 'Blank Workspace', desc: 'Start from scratch', icon: FileText, color: 'slate' },
  { id: 'dsa', label: 'DSA Practice', desc: 'Algorithms & data structures', icon: Code2, color: 'indigo' },
  { id: 'web', label: 'Web Project', desc: 'HTML, CSS, JS sandbox', icon: Globe, color: 'emerald' },
  { id: 'interview', label: 'Interview Prep', desc: 'Coding interview setup', icon: Briefcase, color: 'amber' },
  { id: 'whiteboard', label: 'Whiteboard Session', desc: 'Visual collaboration', icon: PenTool, color: 'purple' },
];

const TEMPLATE_IDS = {
  blank: 'room-blank',
  dsa: 'dsa-practice',
  web: 'web-project',
  interview: 'interview-prep',
  whiteboard: 'whiteboard-session',
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);
  const [toast, setToast] = useState(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('create');
  const [roomFilterTab, setRoomFilterTab] = useState('all');
  const [recentActivity, setRecentActivity] = useState([]);
  const activityIdRef = useRef(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'error') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const logActivity = useCallback((action, roomIdLabel) => {
    const id = ++activityIdRef.current;
    setRecentActivity(prev => [{ id, action, roomId: roomIdLabel, timestamp: Date.now() }, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      setLoadError(null);
      try {
        const res = await api.get('/rooms/recent');
        setRecentRooms(res.data);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
        setLoadError('Could not load your workspaces. Check your connection and try again.');
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteRooms');
    if (savedFavorites) {
      setFavoriteRooms(JSON.parse(savedFavorites));
    }
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomId || !roomPassword) return showToast('Fill all fields');
    try {
      const res = await api.post('/rooms/create', { roomId, roomPassword });
      logActivity('created', roomId);
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating room');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomId || !roomPassword) return showToast('Fill all fields');
    try {
      const res = await api.post('/rooms/join', { roomId, roomPassword });
      logActivity('joined', roomId);
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error joining room');
    }
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    try {
      await api.delete(`/rooms/${roomIdToDelete}`);
      setRecentRooms(prev => prev.filter(r => r.roomId !== roomIdToDelete));
      showToast('Room deleted successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting room');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const generateRoomId = () => {
    const suffix = Math.random().toString(36).slice(2, 7);
    setRoomId(`room-${suffix}`);
    showToast('Room ID generated', 'success');
    logActivity('generated', `room-${suffix}`);
  };

  const copyText = async (text, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label, 'success');
      if (text.startsWith('room-') || text.startsWith('Room ID')) {
        logActivity('copied', text);
      }
    } catch {
      showToast('Could not copy to clipboard');
    }
  };

  const toggleFavoriteRoom = (targetRoomId) => {
    setFavoriteRooms(prev => {
      const wasPinned = prev.includes(targetRoomId);
      const next = wasPinned
        ? prev.filter(id => id !== targetRoomId)
        : [...prev, targetRoomId];
      localStorage.setItem('favoriteRooms', JSON.stringify(next));
      if (!wasPinned) logActivity('pinned', targetRoomId);
      return next;
    });
  };

  const handleTemplateSelect = (templateId) => {
    const id = TEMPLATE_IDS[templateId] || `room-${Math.random().toString(36).slice(2, 7)}`;
    setRoomId(id);
    setActiveFormTab('create');
    showToast(`Template selected: ${TEMPLATES.find(t => t.id === templateId)?.label}`, 'success');
    logActivity('template', id);
  };

  const openLatestRoom = () => {
    const sorted = [...recentRooms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (sorted.length > 0) {
      logActivity('opened', sorted[0].roomId);
      navigate(`/room/${sorted[0].roomId}`);
    } else {
      showToast('No rooms available');
    }
  };

  const filteredRooms = recentRooms.filter((room) => {
    const matchesSearch = room.roomId?.toLowerCase().includes(roomSearch.trim().toLowerCase());
    const isPinned = favoriteRooms.includes(room.roomId);
    const isAdmin = room.admin === user?.id;
    const daysSince = Math.floor((Date.now() - new Date(room.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    const isRecent = daysSince < 7;
    switch (roomFilterTab) {
      case 'pinned': return matchesSearch && isPinned;
      case 'admin': return matchesSearch && isAdmin;
      case 'recent': return matchesSearch && isRecent;
      default: return matchesSearch;
    }
  });

  const adminRooms = recentRooms.filter((room) => room.admin === user?.id).length;
  const latestRoom = [...recentRooms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

  const ActivityIcon = ({ action }) => {
    switch (action) {
      case 'created': return <Plus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'joined': return <LogIn className="w-3.5 h-3.5 text-indigo-400" />;
      case 'pinned': return <Star className="w-3.5 h-3.5 text-amber-400" />;
      case 'copied': return <Copy className="w-3.5 h-3.5 text-cyan-400" />;
      case 'generated': return <RefreshCw className="w-3.5 h-3.5 text-purple-400" />;
      case 'opened': return <ExternalLink className="w-3.5 h-3.5 text-slate-400" />;
      case 'template': return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const ActivityLabel = ({ action }) => {
    switch (action) {
      case 'created': return 'Created';
      case 'joined': return 'Joined';
      case 'pinned': return 'Pinned';
      case 'copied': return 'Copied ID';
      case 'generated': return 'Generated';
      case 'opened': return 'Opened';
      case 'template': return 'Template';
      default: return action;
    }
  };

  const timeAgo = (ts) => {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-animated-gradient text-white p-3 md:p-6 lg:p-8 font-sans relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl mx-auto space-y-5 relative z-10">

        {/* ── Header ── */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center animate-fadeIn shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-4 sm:mb-0 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.25)]">
              <LayoutDashboard className="text-indigo-400 w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
                Welcome back, {user?.username}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Manage your collaborative workspaces
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-xl transition-all border border-indigo-500/20 font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] relative z-10"
            >
              <User className="w-4 h-4 mr-2" /> Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/20 font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] relative z-10"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 animate-fadeIn animate-delay-100">
          {isLoadingRooms ? (
            <>
              {[1, 2, 3].map(n => (
                <div key={n} className="glass-panel-light p-4 rounded-xl border-white/10 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-16 h-2.5 bg-slate-700/50 rounded"></div>
                    <div className="w-7 h-7 rounded-lg bg-slate-700/50"></div>
                  </div>
                  <div className="w-12 h-6 bg-slate-700/50 rounded mb-1.5"></div>
                  <div className="w-20 h-2.5 bg-slate-700/30 rounded"></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="glass-panel-light p-4 rounded-xl border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors"></div>
                <div className="flex items-center justify-between mb-2 relative">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workspaces</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-300" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white relative">{recentRooms.length}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 relative">Recent rooms</p>
              </div>
              <div className="glass-panel-light p-4 rounded-xl border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="flex items-center justify-between mb-2 relative">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white relative">{adminRooms}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 relative">You manage</p>
              </div>
              <div className="glass-panel-light p-4 rounded-xl border-white/10 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                <div className="absolute -top-4 -right-4 w-14 h-14 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors"></div>
                <div className="flex items-center justify-between mb-2 relative">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Latest</span>
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                </div>
                <div className="text-base font-black text-white truncate relative">{latestRoom?.roomId || 'No activity'}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 relative">
                  {latestRoom ? new Date(latestRoom.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Create or join a room'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Main Grid: Left (form) + Right (actions, templates, activity) ── */}
        <div className="grid lg:grid-cols-5 gap-5 animate-fadeIn animate-delay-100">

          {/* ══ LEFT: Create / Join Form + Recent Workspaces ══ */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Create / Join Form */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none"></div>

              {/* Segmented tabs */}
              <div className="flex bg-white/[0.06] rounded-xl p-0.5 border border-white/[0.06] w-fit mb-5 relative z-10">
                <button
                  type="button"
                  onClick={() => { setActiveFormTab('create'); setRoomId(''); setRoomPassword(''); }}
                  className={`px-4 py-2 rounded-[9px] flex items-center text-xs sm:text-sm font-bold transition-all duration-200 ${
                    activeFormTab === 'create'
                      ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveFormTab('join'); setRoomId(''); setRoomPassword(''); }}
                  className={`px-4 py-2 rounded-[9px] flex items-center text-xs sm:text-sm font-bold transition-all duration-200 ${
                    activeFormTab === 'join'
                      ? 'bg-emerald-500/20 text-emerald-200 shadow-sm border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" /> Join
                </button>
              </div>

              {activeFormTab === 'create' && (
                <div className="animate-fadeIn relative z-10">
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="group/input">
                      <div className="flex items-center justify-between ml-1 mb-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-focus-within/input:text-indigo-400 transition-colors">Workspace ID</label>
                        <button
                          type="button"
                          onClick={generateRoomId}
                          className="text-[10px] text-indigo-300 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" /> Generate
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="workspaceIdInputCreate"
                          autoComplete="off"
                          placeholder="e.g. project-x"
                          className="w-full p-3.5 rounded-xl glass-input font-medium placeholder-slate-500 text-sm"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => roomId && copyText(roomId, 'Room ID copied')}
                          disabled={!roomId}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Copy Room ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="group/input">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-1.5 block group-focus-within/input:text-indigo-400 transition-colors">Access Code</label>
                      <div className="relative">
                        <input
                          type={showCreatePassword ? 'text' : 'password'}
                          name="workspaceAccessCodeCreate"
                          autoComplete="new-password"
                          placeholder="Set a room access code"
                          className="w-full p-3.5 pr-11 rounded-xl glass-input font-medium placeholder-slate-500 text-sm"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                          title={showCreatePassword ? 'Hide' : 'Show'}
                        >
                          {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="w-full glass-button p-3.5 rounded-xl font-bold text-sm tracking-wide mt-2 group/btn flex items-center justify-center gap-2">
                      Create Workspace <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-300" />
                    </button>
                  </form>
                </div>
              )}

              {activeFormTab === 'join' && (
                <div className="animate-fadeIn relative z-10">
                  <form onSubmit={handleJoinRoom} className="space-y-4">
                    <div className="group/input">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-1.5 block group-focus-within/input:text-emerald-400 transition-colors">Workspace ID</label>
                      <input
                        type="text"
                        name="workspaceIdInputJoin"
                        autoComplete="off"
                        placeholder="Enter the workspace ID to join"
                        className="w-full p-3.5 rounded-xl glass-input font-medium placeholder-slate-500 text-sm focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                      />
                    </div>
                    <div className="group/input">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-1.5 block group-focus-within/input:text-emerald-400 transition-colors">Access Code</label>
                      <div className="relative">
                        <input
                          type={showJoinPassword ? 'text' : 'password'}
                          name="workspaceAccessCodeJoin"
                          autoComplete="new-password"
                          placeholder="Enter room access code"
                          className="w-full p-3.5 pr-11 rounded-xl glass-input font-medium placeholder-slate-500 text-sm focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowJoinPassword(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                          title={showJoinPassword ? 'Hide' : 'Show'}
                        >
                          {showJoinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/20 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] text-white p-3.5 rounded-xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 mt-2 group/btn flex items-center justify-center gap-2">
                      Join Workspace <LogIn className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ══ Recent Workspaces (inside left column) ══ */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-7 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full shrink-0"></span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">Recent Workspaces</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white/[0.06] rounded-lg p-0.5 border border-white/[0.06]">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'pinned', label: 'Pinned' },
                      { id: 'admin', label: 'Admin' },
                      { id: 'recent', label: 'Recent' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setRoomFilterTab(id)}
                        className={`px-3 py-1.5 rounded-[7px] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
                          roomFilterTab === id
                            ? 'bg-indigo-500/20 text-indigo-200 shadow-sm'
                            : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-44 sm:w-52">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      type="search"
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg glass-input text-xs placeholder-slate-500"
                    />
                    {roomSearch && (
                      <button
                        onClick={() => setRoomSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isLoadingRooms ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="glass-panel-light p-4 rounded-xl border-white/5 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-700/50"></div>
                          <div className="space-y-1.5">
                            <div className="w-28 h-3.5 bg-slate-700/50 rounded"></div>
                            <div className="w-20 h-2.5 bg-slate-700/30 rounded"></div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-8 h-8 rounded-lg bg-slate-700/50"></div>
                          <div className="w-8 h-8 rounded-lg bg-slate-700/50"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-red-500/20">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium mb-1">Failed to load workspaces</p>
                  <p className="text-xs text-slate-500 mb-4">{loadError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 rounded-xl text-xs font-bold border border-indigo-500/20 transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : recentRooms.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-600/30">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/30 flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-slate-300 font-semibold mb-0.5">No workspaces yet</p>
                  <p className="text-xs text-slate-500">Create a new workspace or join one to get started!</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-600/30">
                  <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium text-sm">
                    {roomFilterTab !== 'all'
                      ? `No rooms match the "${roomFilterTab}" filter.`
                      : `No rooms match "${roomSearch}".`}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredRooms.map((room, idx) => {
                    const isPinned = favoriteRooms.includes(room.roomId);
                    const isAdmin = room.admin === user?.id;
                    const memberCount = room.members?.length || 1;
                    const langMap = { javascript: 'JS', python: 'Py', java: 'Java', cpp: 'C++', c: 'C' };
                    const langLabel = langMap[room.language] || room.language?.toUpperCase() || 'JS';
                    const daysSince = Math.floor((Date.now() - new Date(room.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                    const timeLabel = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`;
                    const isRecent = daysSince < 7;
                    return (
                    <div
                      key={room._id}
                      onClick={() => { logActivity('opened', room.roomId); navigate(`/room/${room.roomId}`); }}
                      className="glass-panel-light p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 hover:bg-slate-700/30 transition-all duration-300 border-white/5 hover:border-indigo-500/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] group animate-fadeIn cursor-pointer relative overflow-hidden"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="flex items-center gap-3 min-w-0 relative z-10">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <Hash className="w-4 h-4 text-indigo-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-indigo-300 font-bold text-sm tracking-wide truncate">{room.roomId}</span>
                            <div className="flex items-center gap-1">
                              {isPinned && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">Pinned</span>
                              )}
                              {isAdmin && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">Admin</span>
                              )}
                              {isRecent && !isPinned && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/15">Recent</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                            <span>{timeLabel}</span>
                            <span className="w-px h-2.5 bg-white/10"></span>
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[9px]">{langLabel}</span>
                            <span className="w-px h-2.5 bg-white/10"></span>
                            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavoriteRoom(room.roomId)}
                          className={`p-2 rounded-lg transition-all border border-transparent ${isPinned ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' : 'text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/20'}`}
                          title={isPinned ? 'Unpin workspace' : 'Pin workspace'}
                        >
                          <Star className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyText(room.roomId, 'Room ID copied'); }}
                          className="text-slate-500 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
                          title="Copy workspace ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); logActivity('opened', room.roomId); navigate(`/room/${room.roomId}`); }}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/25 transition-all"
                          title="Open workspace"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(room.roomId); }}
                            className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                            title="Delete workspace (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

          </div>

          {/* ══ RIGHT: Quick Actions + Templates + Latest Activity ══ */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Quick Actions */}
            <div className="glass-panel-light p-4 rounded-xl border-white/10">
              <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={openLatestRoom}
                  disabled={!latestRoom}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Open most recently updated workspace"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-bold text-slate-300">Open Latest</span>
                </button>
                <button
                  onClick={() => latestRoom && copyText(latestRoom.roomId, 'Latest Room ID copied')}
                  disabled={!latestRoom}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-cyan-500/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Copy the latest room ID"
                >
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-bold text-slate-300">Copy Latest</span>
                </button>
                <button
                  onClick={generateRoomId}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all"
                  title="Generate a random workspace ID"
                >
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold text-slate-300">Random ID</span>
                </button>
                <button
                  onClick={() => setRoomFilterTab(roomFilterTab === 'pinned' ? 'all' : 'pinned')}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all border ${
                    roomFilterTab === 'pinned'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5 hover:border-amber-500/30'
                  }`}
                  title="Toggle favorite filter"
                >
                  <Star className={`w-4 h-4 ${roomFilterTab === 'pinned' ? 'fill-current text-amber-400' : 'text-amber-400'}`} />
                  <span className="text-[10px] font-bold text-slate-300">Favorites</span>
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="glass-panel-light p-4 rounded-xl border-white/10">
              <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-indigo-400" /> Templates
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(({ id, label, desc, icon: Icon, color }) => {
                  const colorMap = {
                    slate: 'from-slate-500/20 to-slate-600/20 border-slate-500/20 text-slate-300',
                    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/20 text-indigo-300',
                    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/20 text-emerald-300',
                    amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/20 text-amber-300',
                    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/20 text-purple-300',
                  };
                  return (
                    <button
                      key={id}
                      onClick={() => handleTemplateSelect(id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} border hover:brightness-125 transition-all text-left group`}
                      title={`Start a ${label}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate">{label}</div>
                        <div className="text-[9px] text-slate-500 truncate">{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Latest Activity */}
            <div className="glass-panel-light p-4 rounded-xl border-white/10">
              <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" /> Latest Activity
              </h3>
              {recentActivity.length === 0 ? (
                <div className="text-center py-5">
                  <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-500">No activity yet. Create or join a room to get started.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <ActivityIcon action={a.action} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-slate-300 font-medium">
                          <ActivityLabel action={a.action} />
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5 font-mono">{a.roomId}</span>
                      </div>
                      <span className="text-[9px] text-slate-600 shrink-0">{timeAgo(a.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="bg-slate-900 border border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Workspace</h3>
            <p className="text-sm text-slate-400 text-center mb-1">
              Are you sure you want to delete <span className="font-mono text-red-300 font-semibold">{confirmDelete}</span>?
            </p>
            <p className="text-xs text-slate-500 text-center mb-6">
              This will permanently remove all code, messages, and whiteboard data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteRoom(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm border border-red-400/30 shadow-lg shadow-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn px-4 w-full md:w-auto">
          <div className={`flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
