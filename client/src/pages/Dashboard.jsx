import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { LogOut, Plus, LogIn, Trash2, LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);
  const navigate = useNavigate();

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

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomId || !roomPassword) return alert('Fill all fields');
    try {
      const res = await api.post('/rooms/create', { roomId, roomPassword });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating room');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomId || !roomPassword) return alert('Fill all fields');
    try {
      const res = await api.post('/rooms/join', { roomId, roomPassword });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error joining room');
    }
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    if (!window.confirm(`Delete room "${roomIdToDelete}"? This will permanently remove all code, messages, and whiteboard data.`)) return;
    try {
      await api.delete(`/rooms/${roomIdToDelete}`);
      setRecentRooms(prev => prev.filter(r => r.roomId !== roomIdToDelete));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting room');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-animated-gradient text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center animate-fadeIn shadow-2xl border-white/10">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <LayoutDashboard className="text-indigo-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">Welcome, {user?.username}</h1>
              <p className="text-gray-400 text-sm">Manage your collaborative workspaces</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition border border-red-500/20 font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>

        {/* Action Grids */}
        <div className="grid md:grid-cols-2 gap-8 animate-fadeIn animate-delay-100">
          
          {/* Create Room Card */}
          <div className="glass-panel p-8 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 shadow-xl group">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-400">
              <div className="p-2 bg-indigo-500/10 rounded-lg mr-3 group-hover:bg-indigo-500/20 transition">
                <Plus className="w-5 h-5" />
              </div>
              Create New Room
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Room ID</label>
                <input
                  type="text"
                  placeholder="e.g. project-x"
                  className="w-full p-3 rounded-xl glass-input"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl glass-input"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full glass-button p-3 rounded-xl font-semibold tracking-wide mt-2">
                Create Workspace
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-8 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 shadow-xl group">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-emerald-400">
              <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition">
                <LogIn className="w-5 h-5" />
              </div>
              Join Existing Room
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Room ID</label>
                <input
                  type="text"
                  placeholder="Room to join"
                  className="w-full p-3 rounded-xl glass-input focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl glass-input focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/20 shadow-[0_4px_15px_rgba(16,185,129,0.3)] text-white p-3 rounded-xl font-semibold tracking-wide transition-all hover:-translate-y-0.5 mt-2">
                Join Workspace
              </button>
            </form>
          </div>
        </div>

        {/* Recent Rooms List */}
        <div className="glass-panel p-8 rounded-2xl animate-fadeIn animate-delay-200">
          <h2 className="text-xl font-bold mb-6 text-white tracking-wide border-b border-white/10 pb-4">Recent Workspaces</h2>
          {recentRooms.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-600/50">
              <p className="text-slate-400">No recent rooms found. Create or join one above!</p>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-4">
              {recentRooms.map((room) => (
                <li key={room._id} className="glass-panel-light p-4 rounded-xl flex justify-between items-center hover:bg-slate-700/40 transition border-white/5 hover:border-white/20">
                  <div>
                    <span className="font-mono text-indigo-300 font-medium block">{room.roomId}</span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Last active: {new Date(room.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {room.admin === user?.id && (
                      <button
                        onClick={() => handleDeleteRoom(room.roomId)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30"
                        title="Delete Room (Admin only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
