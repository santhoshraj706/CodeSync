import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import TowerLoader from '../components/TowerLoader';
import NeonWireframeBackground from '../components/NeonWireframeBackground';
import {
  ArrowLeft, User, MessageCircle, Send, Building, GraduationCap,
  BookOpen, CheckCircle2, AlertCircle, Mail, Loader2
} from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const getInitials = (name) => {
  if (!name || !name.trim()) return '?';
  return name.trim().charAt(0).toUpperCase();
};

const generateAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const PublicProfile = () => {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${userId}/public`);
        setProfile(res.data);
      } catch (err) {
        showToast('User not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await api.post('/chat-requests', { to: userId });
      showToast('Chat request sent!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <TowerLoader fullScreen text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen aurora-bg text-white flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">User not found</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-sm font-bold border border-indigo-500/20">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const avatarColor = profile.avatarColor || generateAvatarColor(profile.fullName || profile.username);

  return (
    <div className="min-h-screen aurora-bg text-white p-3 md:p-6 lg:p-8 font-sans relative overflow-x-hidden">
      <NeonWireframeBackground intensity="subtle" />
      <div className="grid-overlay"></div>
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>
      <div className="bg-orb-3"></div>
      <div className="bg-ring"></div>
      <div className="bg-spotlight"></div>

      <div className="max-w-2xl mx-auto space-y-5 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="metallic-panel rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent px-8 py-8 border-b border-white/10 flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl border-2 border-white/20 mb-4"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(profile.fullName || profile.username)}
            </div>
            <h1 className="text-lg font-bold text-white">{profile.fullName || 'Anonymous'}</h1>
            <p className="text-xs text-slate-500 mt-1">@{profile.username}</p>
          </div>

          <div className="p-6 space-y-4">
            {profile.bio && (
              <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.03] rounded-xl">
                <BookOpen className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">{profile.bio}</p>
              </div>
            )}

            {profile.collegeName && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] rounded-xl">
                <Building className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">College</p>
                  <p className="text-sm text-white">{profile.collegeName}</p>
                </div>
              </div>
            )}

            {profile.experienceLevel && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] rounded-xl">
                <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Experience Level</p>
                  <p className="text-sm text-white">{profile.experienceLevel}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSendRequest}
              disabled={sending}
              className="w-full py-3 rounded-xl glow-button text-sm font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Sending...' : 'Send Chat Request'}
            </button>
          </div>
        </div>
      </div>

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

export default PublicProfile;
