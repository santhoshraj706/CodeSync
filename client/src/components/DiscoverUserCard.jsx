import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Send } from 'lucide-react';

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

const DiscoverUserCard = ({ user, onSendRequest, requestSent }) => {
  const navigate = useNavigate();
  const avatarColor = user.avatarColor || generateAvatarColor(user.fullName || user.username);

  return (
    <div className="metallic-card p-4 rounded-xl border-white/10 hover:border-indigo-500/30 transition-all duration-300 group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0 border border-white/10"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(user.fullName || user.username)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white truncate">
              {user.fullName || user.username}
            </span>
            {user.experienceLevel && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/15 shrink-0">
                {user.experienceLevel}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">@{user.username}</div>
          {user.collegeName && (
            <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.collegeName}</div>
          )}
          {user.bio && (
            <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.bio}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => navigate(`/users/${user._id}`)}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
            title="View profile"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSendRequest(user._id)}
            disabled={requestSent}
            className={`p-2 rounded-lg transition-all border ${
              requestSent
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 cursor-not-allowed'
                : 'text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'
            }`}
            title={requestSent ? 'Request sent' : 'Send chat request'}
          >
            {requestSent ? <Send className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverUserCard;
