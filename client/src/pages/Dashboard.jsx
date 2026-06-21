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
  Clock3,
  ShieldCheck,
  ArrowRight,
  Star,
  Filter
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
  const navigate = useNavigate();

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms/recent');
        setRecentRooms(res.data);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
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
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center animate-fadeIn shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-white/10">
          <div className="flex items-center gap-5 mb-6 sm:mb-0">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <LayoutDashboard className="text-indigo-400 w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">Welcome, {user?.username}</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium">Manage your collaborative workspaces</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/20 font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 animate-fadeIn animate-delay-100">
          <div className="glass-panel-light p-5 rounded-2xl border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
              Workspaces <LayoutDashboard className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="text-3xl font-black text-white">{recentRooms.length}</div>
            <p className="text-xs text-slate-500 mt-1">Recent rooms available</p>
          </div>
          <div className="glass-panel-light p-5 rounded-2xl border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
              Admin <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-black text-white">{adminRooms}</div>
            <p className="text-xs text-slate-500 mt-1">Rooms you can manage</p>
          </div>
          <div className="glass-panel-light p-5 rounded-2xl border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
              Latest <Clock3 className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="text-lg font-black text-white truncate">{latestRoom?.roomId || 'No activity'}</div>
            <p className="text-xs text-slate-500 mt-1">
              {latestRoom ? new Date(latestRoom.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Create or join a room'}
            </p>
          </div>
        </div>
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
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${showFavoritesOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-200' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'}`}
          >
            <Filter className="w-4 h-4" />
            {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites'}
          </button>
        </div>

        {/* Action Grids */}
        <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn animate-delay-100">
          
          {/* Create Room Card */}
          <div className="glass-panel p-8 sm:p-10 rounded-[2rem] hover:border-indigo-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
            
            <h2 className="text-2xl font-extrabold mb-8 flex items-center text-white tracking-tight">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-4 border border-indigo-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Plus className="w-6 h-6 text-indigo-400" />
              </div>
              Create New Room
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-6 relative z-10">
              <div className="group/input">
                <div className="flex items-center justify-between ml-1 mb-2">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest group-focus-within/input:text-indigo-400 transition-colors">Room ID</label>
                  <button
                    type="button"
                    onClick={generateRoomId}
                    className="text-[11px] text-indigo-300 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. project-x"
                    className="w-full p-4 pr-12 rounded-xl glass-input font-medium placeholder-slate-500"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => roomId && copyText(roomId, 'Room ID copied')}
                    disabled={!roomId}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Copy Room ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="group/input">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2 block group-focus-within/input:text-indigo-400 transition-colors">Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    placeholder="Enter room password"
                    className="w-full p-4 pr-12 rounded-xl glass-input font-medium placeholder-slate-500"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white"
                    title={showCreatePassword ? 'Hide password' : 'Show password'}
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full glass-button p-4 rounded-xl font-bold text-lg tracking-wide mt-4 group/btn flex items-center justify-center gap-2">
                Create Workspace <Plus className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-8 sm:p-10 rounded-[2rem] hover:border-emerald-500/40 transition-all duration-500 shadow-xl hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500"></div>

            <h2 className="text-2xl font-extrabold mb-8 flex items-center text-white tracking-tight">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mr-4 border border-emerald-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <LogIn className="w-6 h-6 text-emerald-400" />
              </div>
              Join Existing Room
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-6 relative z-10">
              <div className="group/input">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2 block group-focus-within/input:text-emerald-400 transition-colors">Room ID</label>
                <input
                  type="text"
                  placeholder="Room to join"
                  className="w-full p-4 rounded-xl glass-input font-medium placeholder-slate-500 focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <div className="group/input">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2 block group-focus-within/input:text-emerald-400 transition-colors">Password</label>
                <div className="relative">
                  <input
                    type={showJoinPassword ? 'text' : 'password'}
                    placeholder="Enter room password"
                    className="w-full p-4 pr-12 rounded-xl glass-input font-medium placeholder-slate-500 focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowJoinPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white"
                    title={showJoinPassword ? 'Hide password' : 'Show password'}
                  >
                    {showJoinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/20 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] text-white p-4 rounded-xl font-bold text-lg tracking-wide transition-all hover:-translate-y-1 mt-4 group/btn flex items-center justify-center gap-2">
                Join Workspace <LogIn className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        {/* Recent Rooms List */}
        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] animate-fadeIn animate-delay-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
              Recent Workspaces
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="search"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms..."
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm placeholder-slate-500"
              />
            </div>
          </div>
          
          {recentRooms.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-600/50">
              <p className="text-slate-400 font-medium">No recent rooms found. Create or join one above!</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-600/50">
              <p className="text-slate-400 font-medium">
                {showFavoritesOnly ? 'No favorite rooms match your filters.' : `No rooms match "${roomSearch}".`}
              </p>
            </div>
          ) : (
            <ul className="grid md:grid-cols-2 gap-5">
              {filteredRooms.map((room) => (
                <li key={room._id} className="glass-panel-light p-5 rounded-2xl flex justify-between items-center hover:bg-slate-700/40 transition-all border-white/5 hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                      <span className="font-mono text-indigo-300 font-bold tracking-wide">{room.roomId}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium pl-4">
                      Last active: {new Date(room.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoriteRoom(room.roomId)}
                      className={`p-2.5 rounded-xl transition-all border border-transparent ${favoriteRooms.includes(room.roomId) ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20' : 'text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/20'}`}
                      title={favoriteRooms.includes(room.roomId) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-5 h-5 ${favoriteRooms.includes(room.roomId) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => copyText(room.roomId, 'Room ID copied')}
                      className="text-slate-500 hover:text-indigo-300 p-2.5 rounded-xl hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
                      title="Copy Room ID"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setRoomId(room.roomId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-slate-500 hover:text-emerald-300 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20"
                      title="Use this Room ID"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {room.admin === user?.id && (
                      <button
                        onClick={() => handleDeleteRoom(room.roomId)}
                        className="text-slate-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        title="Delete Room (Admin only)"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
