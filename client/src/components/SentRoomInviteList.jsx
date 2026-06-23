import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Hash, Clock, ExternalLink, FileText,
  Hourglass, CheckCircle2, AlertCircle, LogIn, Trash2, X
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

const timeAgo = (ts) => {
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15 flex items-center gap-1">
          <Hourglass className="w-2.5 h-2.5" /> Pending
        </span>
      );
    case 'accepted':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5" /> Accepted
        </span>
      );
    case 'rejected':
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15 flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" /> Rejected
        </span>
      );
    default:
      return null;
  }
};

const SentRoomInviteList = ({ sentInvites = [], loading = false, onViewProfile, onDelete }) => {
  const navigate = useNavigate();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const confirmDelete = (id) => setDeleteConfirmId(id);
  const handleConfirmDelete = () => {
    if (deleteConfirmId && onDelete) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sentInvites.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
          <LogIn className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">No sent invites</p>
        <p className="text-xs text-slate-600 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
          Invite someone to a workspace from their profile
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sentInvites.map((inv) => {
          const person = inv.to;
          if (!person) return null;
          const avatarColor = person.avatarColor || generateAvatarColor(person.fullName || person.username);
          const isAccepted = inv.status === 'accepted';

          return (
            <div key={inv._id} className="metallic-card p-3.5 rounded-xl border-white/10">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(person.fullName || person.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">
                      {person.fullName || person.username}
                    </span>
                    <span className="text-[10px] text-slate-500">@{person.username}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Hash className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-xs font-mono text-indigo-300">{inv.roomId}</span>
                  </div>
                  {inv.note && (
                    <div className="flex items-start gap-1 mt-1">
                      <FileText className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">"{inv.note}"</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(inv.createdAt)}
                    </span>
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
                <div className="flex items-center gap-1.5 ml-auto">
                  {onDelete && (
                    <button
                      onClick={() => confirmDelete(inv._id)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all border border-red-500/20"
                      title="Delete invite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAccepted ? (
                    <button
                      onClick={() => navigate(`/room/${inv.roomId}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-semibold border border-emerald-500/20"
                    >
                      <ExternalLink className="w-3 h-3" /> Join Room
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/room/${inv.roomId}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[10px] font-semibold border border-indigo-500/20"
                    >
                      <ExternalLink className="w-3 h-3" /> View Room
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn px-4">
          <div className="metallic-panel border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Invite</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              This will permanently remove the invite. The other user will no longer see it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm border border-red-400/30 shadow-lg shadow-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SentRoomInviteList;
