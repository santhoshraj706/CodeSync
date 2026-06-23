import { useState, useEffect } from 'react';
import { X, MessageCircle, Send, LogIn, User, Loader2, GraduationCap, Award, Shield, ShieldOff, Ban, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

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

const ProfileDrawer = ({ user, onClose, onSendRequest, onMessage, onInvite, requestSent, isFriend }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedMe: false });
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    Promise.all([
      api.get(`/users/${user._id}/public`),
      api.get(`/blocks/status/${user._id}`),
    ])
      .then(([profileRes, blockRes]) => {
        setProfile(profileRes.data);
        setBlockStatus(blockRes.data);
      })
      .catch(() => {
        setProfile(user);
        setBlockStatus({ blockedByMe: false, blockedMe: false });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const targetId = user?._id ?? user?.id;

  const handleBlock = async () => {
    try {
      await api.post(`/blocks/${targetId}`);
      setBlockStatus(prev => ({ ...prev, blockedByMe: true }));
      showToast('User blocked', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to block', 'error');
    }
    setShowBlockConfirm(false);
  };

  const handleUnblock = async () => {
    try {
      await api.delete(`/blocks/${targetId}`);
      setBlockStatus(prev => ({ ...prev, blockedByMe: false }));
      showToast('User unblocked', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unblock', 'error');
    }
    setShowUnblockConfirm(false);
  };

  const p = profile || user;
  const avatarColor = p?.avatarColor || generateAvatarColor(p?.fullName || p?.username);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm metallic-panel rounded-l-2xl border-r-0 animate-fadeIn flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-white text-sm">Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-2 border-white/10 shadow-xl mb-3"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(p?.fullName || p?.username)}
              </div>
              <h2 className="text-lg font-bold text-white">{p?.fullName || p?.username}</h2>
              <p className="text-sm text-slate-400">@{p?.username}</p>
            </div>

            {p?.bio && (
              <div className="metallic-card p-3 rounded-xl border-white/10">
                <p className="text-xs text-slate-400 leading-relaxed">{p.bio}</p>
              </div>
            )}

            <div className="space-y-2">
              {p?.collegeName && (
                <div className="flex items-center gap-2.5 text-sm">
                  <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-300">{p.collegeName}</span>
                </div>
              )}
              {p?.experienceLevel && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-300 capitalize">{p.experienceLevel}</span>
                </div>
              )}
              {(!p?.collegeName && !p?.experienceLevel) && (
                <p className="text-xs text-slate-500 text-center">No additional info</p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {isFriend ? (
                <button
                  onClick={onMessage}
                  className="w-full py-2.5 rounded-xl glow-button text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Send Message
                </button>
              ) : requestSent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Send className="w-4 h-4" /> Request Sent
                </button>
              ) : (
                <button
                  onClick={() => onSendRequest?.(p._id)}
                  className="w-full py-2.5 rounded-xl glow-button text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Chat Request
                </button>
              )}
              {isFriend && (
                <button
                  onClick={onInvite}
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-bold flex items-center justify-center gap-2 border border-white/[0.08] transition-all"
                >
                  <LogIn className="w-4 h-4" /> Invite to Room
                </button>
              )}
              <button
                onClick={() => window.open(`/users/${p._id}`, '_blank')}
                className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-bold flex items-center justify-center gap-2 border border-white/[0.08] transition-all"
              >
                <User className="w-4 h-4" /> Full Profile
              </button>
              {!blockStatus.blockedMe && (
                blockStatus.blockedByMe ? (
                  <button
                    onClick={() => setShowUnblockConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all"
                  >
                    <ShieldOff className="w-4 h-4" /> Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                  >
                    <Shield className="w-4 h-4" /> Block User
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Block Confirmation */}
        {showBlockConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4">
            <div className="metallic-panel border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <ShieldOff className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Block User</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                Block {p?.fullName || p?.username}? They will no longer be able to send you messages.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm border border-red-400/30 shadow-lg shadow-red-500/20 transition-all"
                >
                  Block
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unblock Confirmation */}
        {showUnblockConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4">
            <div className="metallic-panel border-amber-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Unblock User</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                Unblock {p?.fullName || p?.username}? They will be able to message you again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnblockConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnblock}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm border border-amber-400/30 shadow-lg shadow-amber-500/20 transition-all"
                >
                  Unblock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 animate-fadeIn px-4 w-full">
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border text-sm ${
              toast.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDrawer;
