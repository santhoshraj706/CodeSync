import { useState, useMemo } from 'react';
import { MessageCircle, Search } from 'lucide-react';

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

const timeAgo = (ts) => {
  if (!ts) return '';
  const now = Date.now();
  const d = new Date(ts).getTime();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'yesterday';
  return `${days}d`;
};

const ConversationList = ({ conversations, activeConversationId, onSelect, currentUserId, onlineUsers, unreadCounts }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations || [];
    const q = search.toLowerCase().trim();
    return (conversations || []).filter(conv => {
      const other = conv.participants?.find(p => String(p._id ?? p.id) !== String(currentUserId));
      if (!other) return false;
      const name = (other.fullName || other.username || '').toLowerCase();
      const uname = (other.username || '').toLowerCase();
      return name.includes(q) || uname.includes(q);
    });
  }, [conversations, search, currentUserId]);

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
          <MessageCircle className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">No conversations yet</p>
        <p className="text-xs text-slate-600 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
          Find users and send a chat request to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-9 pr-3 py-2 rounded-xl glow-input text-xs"
        />
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 -mx-1 px-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No conversations match "{search}"
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants?.find(p => String(p._id ?? p.id) !== String(currentUserId));
            if (!other) return null;
            const otherId = other._id ?? other.id;
            const avatarColor = other.avatarColor || generateAvatarColor(other.fullName || other.username);
            const isOnline = onlineUsers?.has(otherId);
            const isActive = String(conv._id ?? conv.id) === String(activeConversationId);
            const unread = unreadCounts?.[otherId] || 0;

            return (
              <button
                key={conv._id}
                onClick={() => { setSearch(''); onSelect(conv); }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group ${
                  isActive
                    ? 'bg-indigo-500/15 border border-indigo-500/25'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white border border-white/10"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {getInitials(other.fullName || other.username)}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0e1a] rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-sm text-white truncate">
                      {other.fullName || other.username}
                    </span>
                    {conv.lastMessage?.timestamp && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {timeAgo(conv.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500">@{other.username}</span>
                    {isOnline && (
                      <span className="text-[9px] text-emerald-400/70">online</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-slate-500 truncate flex-1 min-w-0">
                      {conv.lastMessage?.text || 'No messages yet'}
                    </span>
                    {unread > 0 && (
                      <span className="shrink-0 ml-2 min-w-[18px] h-[18px] flex items-center justify-center bg-indigo-500 text-white text-[9px] font-bold rounded-full px-1.5">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
