import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import TowerLoader from '../components/TowerLoader';
import NeonWireframeBackground from '../components/NeonWireframeBackground';
import DiscoverUserCard from '../components/DiscoverUserCard';
import { Search, Users, ArrowLeft, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const Discover = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (toId) => {
    try {
      await api.post('/chat-requests', { to: toId });
      setSentRequests(prev => new Set([...prev, toId]));
      showToast('Chat request sent!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  return (
    <div className="min-h-screen aurora-bg text-white p-3 md:p-6 lg:p-8 font-sans relative overflow-x-hidden">
      <NeonWireframeBackground intensity="subtle" />
      <div className="grid-overlay"></div>
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>
      <div className="bg-orb-3"></div>
      <div className="bg-ring"></div>
      <div className="bg-spotlight"></div>
      <div className="bg-light-sweep" style={{ top: '30%', left: '-15%' }}></div>

      <div className="max-w-3xl mx-auto space-y-5 relative z-10">
        {/* Header */}
        <div className="metallic-panel p-5 sm:p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Find Users
              </h1>
              <p className="text-xs text-slate-400">Discover and connect with other developers</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="metallic-panel p-5 rounded-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, username, or college..."
              className="w-full pl-10 pr-4 py-3 rounded-xl glow-input text-sm"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {!query.trim() ? (
            <div className="metallic-card p-8 rounded-xl border-white/10 text-center">
              <UserPlus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Search for users to connect with</p>
            </div>
          ) : searching ? (
            <TowerLoader text="Searching..." />
          ) : results.length === 0 ? (
            <div className="metallic-card p-8 rounded-xl border-white/10 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No users found matching "{query}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium px-1">{results.length} user{results.length !== 1 ? 's' : ''} found</p>
              {results.map((u) => (
                <DiscoverUserCard
                  key={u._id}
                  user={u}
                  onSendRequest={handleSendRequest}
                  requestSent={sentRequests.has(u._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn px-4 w-full md:w-auto ${
          toast.type === 'error'
            ? 'bg-red-500/20 border-red-500/30 text-red-300'
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
        } flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Discover;
