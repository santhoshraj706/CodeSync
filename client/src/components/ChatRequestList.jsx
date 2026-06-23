import { Check, X, Clock, User, GraduationCap, MessageCircle } from 'lucide-react';

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
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

const ChatRequestList = ({ requests, type, onAccept, onReject, onViewProfile }) => {
  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
          <Clock className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          {type === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
        </p>
        <p className="text-xs text-slate-600 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
          {type === 'incoming'
            ? 'When someone sends you a chat request, it will appear here'
            : 'When you send a chat request, it will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const person = type === 'incoming' ? req.from : req.to;
        if (!person) return null;
        const avatarColor = person.avatarColor || generateAvatarColor(person.fullName || person.username);

        return (
          <div key={req._id} className="metallic-card p-3.5 rounded-xl border-white/10">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(person.fullName || person.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white truncate">
                    {person.fullName || person.username}
                  </span>
                  <span className="text-[10px] text-slate-500">@{person.username}</span>
                  {req.status === 'pending' && (
                    <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Pending</span>
                  )}
                  {req.status === 'accepted' && (
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Accepted</span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Rejected</span>
                  )}
                </div>

                {person.bio && (
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{person.bio}</p>
                )}
                {person.collegeName && (
                  <div className="flex items-center gap-1 mt-1">
                    <GraduationCap className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-[10px] text-slate-500">{person.collegeName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-600">{timeAgo(req.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => onViewProfile?.(person)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all text-[10px] font-semibold border border-transparent hover:border-indigo-500/20"
              >
                <User className="w-3 h-3" /> View Profile
              </button>

              {type === 'incoming' && req.status === 'pending' && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => onReject(req._id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-semibold border border-transparent hover:border-red-500/20"
                  >
                    <X className="w-3 h-3" /> Decline
                  </button>
                  <button
                    onClick={() => onAccept(req._id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-semibold border border-emerald-500/20"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                </div>
              )}

              {type === 'outgoing' && req.status === 'pending' && (
                <span className="text-[10px] text-slate-500 italic ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Awaiting response
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatRequestList;
