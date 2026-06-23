import { MessageCircle, UserPlus, Users, Hash, Loader2 } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (name) => {
  if (!name || !name.trim()) return '?';
  return name.trim().charAt(0).toUpperCase();
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const FrequentCollaborators = ({ collaborators, loading, onMessageClick, onInviteClick, onFindUsers, onOpenMessages }) => {
  return (
    <div className="metallic-panel p-5 rounded-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 via-transparent to-purple-500/3 pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-1 relative z-10">
        <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full shrink-0"></span>
        <h3 className="text-sm font-extrabold text-white tracking-tight">Frequent Collaborators</h3>
      </div>
      <p className="text-[10px] text-slate-500 mb-3 ml-3 relative z-10">People you chat or work with often</p>

      {loading ? (
        <div className="flex items-center justify-center py-6 relative z-10">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-5 bg-slate-800/20 rounded-xl border border-dashed border-slate-600/30 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-700/30 flex items-center justify-center mx-auto mb-2.5">
            <Users className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-xs text-slate-300 font-semibold">No frequent collaborators yet</p>
          <p className="text-[10px] text-slate-500 mt-1 mb-3.5 leading-relaxed max-w-[220px] mx-auto">
            Find users, start a chat, and your regular collaborators will appear here.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onFindUsers}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 rounded-lg text-[10px] font-bold border border-indigo-500/25 transition-all"
            >
              <UserPlus className="w-3 h-3" /> Find Users
            </button>
            <button
              onClick={onOpenMessages}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] rounded-lg text-[10px] font-semibold border border-white/[0.08] transition-all"
            >
              <MessageCircle className="w-3 h-3" /> Messages
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 relative z-10">
          {collaborators.map((col) => {
            const avatarColor = col.user.avatarColor || getAvatarColor(col.user.fullName || col.user.username);
            return (
              <div
                key={col.conversationId}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.06] cursor-pointer"
                onClick={() => onMessageClick(col.conversationId, col.user)}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10 relative"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(col.user.fullName || col.user.username)}
                  {col.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-[#0a0e1a]">
                      {col.unreadCount > 9 ? '9+' : col.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white truncate">{col.user.fullName || col.user.username}</span>
                    <span className="text-[9px] text-slate-500 shrink-0">{timeAgo(col.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">@{col.user.username}</span>
                  </div>
                  {col.lastMessage && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{col.lastMessage}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onMessageClick(col.conversationId, col.user)}
                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/20"
                    title="Message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  {onInviteClick && (
                    <button
                      onClick={() => onInviteClick(col.user)}
                      className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all border border-white/[0.06]"
                      title="Invite to Room"
                    >
                      <Hash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FrequentCollaborators;
