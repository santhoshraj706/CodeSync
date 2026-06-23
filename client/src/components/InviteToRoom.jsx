import { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Loader2, CheckCircle2, AlertCircle, Hash, Send, FileText } from 'lucide-react';

const InviteToRoom = ({ recipientId, recipientName, onClose }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/rooms/recent?admin=true')
      .then(res => setRooms(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!selectedRoom) return;
    setSending(true);
    setStatus(null);
    try {
      await api.post('/room-invites', { to: recipientId, roomId: selectedRoom, note: note.trim() || undefined });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
      <div className="metallic-panel p-5 rounded-2xl shadow-2xl max-w-sm w-full border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <LogInIcon /> Invite to Workspace
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-white font-medium">Invite sent!</p>
            <p className="text-xs text-slate-400 mt-1">to {recipientName}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-sm font-bold border border-indigo-500/20 hover:bg-indigo-500/30 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-4">
              Invite <span className="text-white font-semibold">{recipientName}</span> to a workspace:
            </p>

            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-6">
                <Hash className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No workspaces available</p>
                <p className="text-xs text-slate-600 mt-1">Create a workspace first</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                  {rooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() => setSelectedRoom(room.roomId)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                        selectedRoom === room.roomId
                          ? 'bg-indigo-500/15 border border-indigo-500/25'
                          : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.06]'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono text-sm text-white truncate block">{room.roomId}</span>
                        {room.name && (
                          <span className="text-[10px] text-slate-500 truncate block">{room.name}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mb-3">
                  <label className="text-[10px] text-slate-500 font-semibold mb-1 block flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note to your invite..."
                    rows={2}
                    className="w-full glow-input rounded-xl px-3 py-2 text-xs resize-none"
                  />
                </div>
              </>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl mb-3">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Failed to send invite
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-xs border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedRoom || sending}
                className="flex-1 py-2.5 rounded-xl glow-button disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const LogInIcon = () => (
  <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.5 12H3" />
  </svg>
);

export default InviteToRoom;
