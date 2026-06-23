import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../utils/api';
import {
  LogIn, Check, X, User, Hash, Clock, Loader2, Copy, CheckCheck, ExternalLink, FileText
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

const RoomInviteList = ({ onViewProfile }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptedId, setAcceptedId] = useState(null);
  const [acceptedData, setAcceptedData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/room-invites/incoming')
      .then(res => setInvites(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ inviteId }) => {
      setInvites(prev => prev.filter(inv => inv._id !== inviteId));
    };
    socket.on('invite-deleted', handler);
    return () => socket.off('invite-deleted', handler);
  }, [socket]);

  const handleAccept = async (inviteId) => {
    try {
      const res = await api.put(`/room-invites/${inviteId}/accept`);
      setAcceptedId(inviteId);
      setAcceptedData(res.data);
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await api.put(`/room-invites/${inviteId}/reject`);
      setInvites(prev => prev.filter(i => i._id !== inviteId));
    } catch (err) {
      console.error('Failed to reject invite:', err);
    }
  };

  const copyPassword = () => {
    if (acceptedData?.roomPassword) {
      navigator.clipboard.writeText(acceptedData.roomPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
          <LogIn className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">No room invites</p>
        <p className="text-xs text-slate-600 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
          When someone invites you to a workspace, it will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invites.map((inv) => {
        const person = inv.from;
        if (!person) return null;
        const avatarColor = person.avatarColor || generateAvatarColor(person.fullName || person.username);
        const isAccepted = acceptedId === inv._id;

        if (isAccepted) {
          return (
            <div key={inv._id} className="metallic-card p-4 rounded-xl border-white/10">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">Invite Accepted!</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  You can now join <span className="text-indigo-300 font-semibold">{inv.roomId}</span>
                </p>
                <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06] mb-3">
                  <div className="text-[10px] text-slate-500 mb-1">Room Password</div>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-sm font-mono font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                      {acceptedData?.roomPassword}
                    </code>
                    <button
                      onClick={copyPassword}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                      title="Copy password"
                    >
                      {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/room/${inv.roomId}`)}
                  className="w-full py-2.5 rounded-xl glow-button text-xs font-bold flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Join Workspace
                </button>
              </div>
            </div>
          );
        }

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
                <button
                  onClick={() => handleReject(inv._id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-semibold border border-transparent hover:border-red-500/20"
                >
                  <X className="w-3 h-3" /> Decline
                </button>
                <button
                  onClick={() => handleAccept(inv._id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-semibold border border-emerald-500/20"
                >
                  <Check className="w-3 h-3" /> Accept
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomInviteList;
