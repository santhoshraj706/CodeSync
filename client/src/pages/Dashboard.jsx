import { useState, useEffect, useContext } from 'react';
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
  Filter,
  Sparkles,
  FolderOpen,
  Hash,
  Zap
} from 'lucide-react';

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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('create');
  const navigate = useNavigate();

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error joining room');
    }
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    if (!window.confirm(`Delete room "${roomIdToDelete}"? This will permanently remove all code, messages, and whiteboard data.`)) return;
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
  };

  const copyText = async (text, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label, 'success');
    } catch {
      showToast('Could not copy to clipboard');
    }
  };

  const toggleFavoriteRoom = (targetRoomId) => {
    setFavoriteRooms(prev => {
      const next = prev.includes(targetRoomId)
        ? prev.filter(id => id !== targetRoomId)
        : [...prev, targetRoomId];
      localStorage.setItem('favoriteRooms', JSON.stringify(next));
      return next;
    });
  };

  const filteredRooms = recentRooms.filter((room) =>
    room.roomId?.toLowerCase().includes(roomSearch.trim().toLowerCase()) &&
    (!showFavoritesOnly || favoriteRooms.includes(room.roomId))
  );

  const adminRooms = recentRooms.filter((room) => room.admin === user?.id).length;
  const latestRoom = [...recentRooms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

  return (
    <div className="min-h-screen bg-animated-gradient text-white p-4 md:p-8 lg:p-12 font-sans relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center animate-fadeIn shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          <div className="flex items-center gap-5 mb-6 sm:mb-0 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.25)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <LayoutDashboard className="text-indigo-400 w-8 h-8 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
                Welcome back, {user?.username}
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Manage your collaborative workspaces
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/20 font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] relative z-10"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid sm:grid-cols-3 gap-4 animate-fadeIn animate-delay-100">
          {isLoadingRooms ? (
            <>
              <div className="glass-panel-light p-5 rounded-2xl border-white/10 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-24 h-3 bg-slate-700/50 rounded"></div>
                  <div className="w-9 h-9 rounded-xl bg-slate-700/50"></div>
                </div>
                <div className="w-16 h-8 bg-slate-700/50 rounded mb-2"></div>
                <div className="w-36 h-3 bg-slate-700/30 rounded"></div>
              </div>
              <div className="glass-panel-light p-5 rounded-2xl border-white/10 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-24 h-3 bg-slate-700/50 rounded"></div>
                  <div className="w-9 h-9 rounded-xl bg-slate-700/50"></div>
                </div>
                <div className="w-16 h-8 bg-slate-700/50 rounded mb-2"></div>
                <div className="w-36 h-3 bg-slate-700/30 rounded"></div>
              </div>
              <div className="glass-panel-light p-5 rounded-2xl border-white/10 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-24 h-3 bg-slate-700/50 rounded"></div>
                  <div className="w-9 h-9 rounded-xl bg-slate-700/50"></div>
                </div>
                <div className="w-24 h-8 bg-slate-700/50 rounded mb-2"></div>
                <div className="w-36 h-3 bg-slate-700/30 rounded"></div>
              </div>
            </>
          ) : (
            <>
          <div className="glass-panel-light p-5 rounded-2xl border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
            <div className="flex items-center justify-between mb-3 relative">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Workspaces</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-indigo-300" />
              </div>
            </div>
            <div className="text-3xl font-black text-white relative">{recentRooms.length}</div>
            <p className="text-xs text-slate-500 mt-1 relative">Recent rooms available</p>
          </div>
          <div className="glass-panel-light p-5 rounded-2xl border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
            <div className="flex items-center justify-between mb-3 relative">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Admin</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
            <div className="text-3xl font-black text-white relative">{adminRooms}</div>
            <p className="text-xs text-slate-500 mt-1 relative">Rooms you can manage</p>
          </div>
          <div className="glass-panel-light p-5 rounded-2xl border-white/10 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors duration-500"></div>
            <div className="flex items-center justify-between mb-3 relative">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Latest</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <div className="text-lg font-black text-white truncate relative">{latestRoom?.roomId || 'No activity'}</div>
            <p className="text-xs text-slate-500 mt-1 relative">
              {latestRoom ? new Date(latestRoom.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Create or join a room'}
            </p>
          </div>
          </>
          )}
        </div>

        {/* Pinned / Filter Row */}
        <div className="glass-panel-light p-4 rounded-2xl border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeIn animate-delay-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Pinned workspaces</p>
              <p className="text-xs text-slate-400">{favoriteRooms.length} room{favoriteRooms.length === 1 ? '' : 's'} starred on this device</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFavoritesOnly(prev => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${showFavoritesOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'}`}
          >
            <Filter className="w-4 h-4" />
            {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites'}
          </button>
        </div>

        {/* Create / Join — Tabbed */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] animate-fadeIn animate-delay-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-emerald-500/3 pointer-events-none"></div>

          {/* Segmented tabs */}
          <div className="flex bg-white/[0.06] rounded-xl p-1 border border-white/[0.06] w-fit mb-8 relative z-10">
            <button
              type="button"
              onClick={() => { setActiveFormTab('create'); setRoomId(''); setRoomPassword(''); }}
              className={`px-5 py-2.5 rounded-[10px] flex items-center text-sm font-bold transition-all duration-200 ${
                activeFormTab === 'create'
                  ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" /> Create
            </button>
            <button
              type="button"
              onClick={() => { setActiveFormTab('join'); setRoomId(''); setRoomPassword(''); }}
              className={`px-5 py-2.5 rounded-[10px] flex items-center text-sm font-bold transition-all duration-200 ${
                activeFormTab === 'join'
                  ? 'bg-emerald-500/20 text-emerald-200 shadow-sm border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 mr-2" /> Join
            </button>
          </div>

          {activeFormTab === 'create' && (
            <div className="animate-fadeIn relative z-10">
              <h2 className="text-xl font-extrabold mb-6 flex items-center text-white tracking-tight">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-3 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Plus className="w-5 h-5 text-indigo-400" />
                </div>
                Create New Workspace
              </h2>
              <form onSubmit={handleCreateRoom} className="space-y-5 max-w-xl">
                <div className="group/input">
                  <div className="flex items-center justify-between ml-1 mb-2">
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest group-focus-within/input:text-indigo-400 transition-colors">Workspace ID</label>
                    <button
                      type="button"
                      onClick={generateRoomId}
                      className="text-[11px] text-indigo-300 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
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
                      className="w-full p-4 rounded-xl glass-input font-medium placeholder-slate-500"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => roomId && copyText(roomId, 'Room ID copied')}
                      disabled={!roomId}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      title="Copy Room ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="group/input">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2 block group-focus-within/input:text-indigo-400 transition-colors">Access Code</label>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      name="workspaceAccessCodeCreate"
                      autoComplete="new-password"
                      placeholder="Set a room access code"
                      className="w-full p-4 pr-12 rounded-xl glass-input font-medium placeholder-slate-500"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                      title={showCreatePassword ? 'Hide' : 'Show'}
                    >
                      {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full glass-button p-4 rounded-xl font-bold text-base tracking-wide mt-4 group/btn flex items-center justify-center gap-2">
                  Create Workspace <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
                </button>
              </form>
            </div>
          )}

          {activeFormTab === 'join' && (
            <div className="animate-fadeIn relative z-10">
              <h2 className="text-xl font-extrabold mb-6 flex items-center text-white tracking-tight">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mr-3 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <LogIn className="w-5 h-5 text-emerald-400" />
                </div>
                Join Existing Workspace
              </h2>
              <form onSubmit={handleJoinRoom} className="space-y-5 max-w-xl">
                <div className="group/input">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2 block group-focus-within/input:text-emerald-400 transition-colors">Workspace ID</label>
                  <input
                    type="text"
                    name="workspaceIdInputJoin"
                    autoComplete="off"
                    placeholder="Enter the workspace ID to join"
                    className="w-full p-4 rounded-xl glass-input font-medium placeholder-slate-500 focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>
                <div className="group/input">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2 block group-focus-within/input:text-emerald-400 transition-colors">Access Code</label>
                  <div className="relative">
                    <input
                      type={showJoinPassword ? 'text' : 'password'}
                      name="workspaceAccessCodeJoin"
                      autoComplete="new-password"
                      placeholder="Enter room access code"
                      className="w-full p-4 pr-12 rounded-xl glass-input font-medium placeholder-slate-500 focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowJoinPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                      title={showJoinPassword ? 'Hide' : 'Show'}
                    >
                      {showJoinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/20 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] text-white p-4 rounded-xl font-bold text-base tracking-wide transition-all hover:-translate-y-1 mt-4 group/btn flex items-center justify-center gap-2">
                  Join Workspace <LogIn className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Recent Rooms List */}
        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] animate-fadeIn animate-delay-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full inline-block"></span>
              Recent Workspaces
            </h2>
            <div className="relative w-full md:w-80">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="search"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms..."
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm placeholder-slate-500"
              />
            </div>
          </div>

          {isLoadingRooms ? (
            /* Skeleton loading for recent rooms */
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-panel-light p-5 rounded-2xl border-white/5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-700/50"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-slate-700/50 rounded"></div>
                        <div className="w-24 h-3 bg-slate-700/30 rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-700/50"></div>
                      <div className="w-9 h-9 rounded-xl bg-slate-700/50"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-dashed border-red-500/20">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-300 font-medium mb-2">Failed to load workspaces</p>
              <p className="text-sm text-slate-500 mb-4">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 rounded-xl text-sm font-bold border border-indigo-500/20 transition-all"
              >
                Retry
              </button>
            </div>
          ) : recentRooms.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-dashed border-slate-600/30">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-300 font-semibold mb-1">No workspaces yet</p>
              <p className="text-sm text-slate-500">Create a new workspace or join one to get started!</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-dashed border-slate-600/30">
              <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 font-medium">
                {showFavoritesOnly ? 'No favorite rooms match your filters.' : `No rooms match "${roomSearch}".`}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
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
                  onClick={() => navigate(`/room/${room.roomId}`)}
                  className="glass-panel-light p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-slate-700/30 transition-all duration-300 border-white/5 hover:border-indigo-500/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] group animate-fadeIn cursor-pointer relative overflow-hidden"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {/* Hover accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="flex items-center gap-3 min-w-0 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Hash className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-indigo-300 font-bold tracking-wide truncate">{room.roomId}</span>
                        <div className="flex items-center gap-1.5">
                          {isPinned && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/15">Pinned</span>
                          )}
                          {isAdmin && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/15">Admin</span>
                          )}
                          {isRecent && !isPinned && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/15">Recent</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          {timeLabel}
                        </span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[10px]">{langLabel}</span>
                        </span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavoriteRoom(room.roomId)}
                      className={`p-2.5 rounded-xl transition-all border border-transparent ${isPinned ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' : 'text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/20'}`}
                      title={isPinned ? 'Unpin workspace' : 'Pin workspace'}
                    >
                      <Star className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyText(room.roomId, 'Room ID copied'); }}
                      className="text-slate-500 hover:text-indigo-300 p-2.5 rounded-xl hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
                      title="Copy workspace ID"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.roomId}`); }}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/25 transition-all"
                      title="Open workspace"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.roomId); }}
                        className="text-slate-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        title="Delete workspace (Admin)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

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
