import { Phone, PhoneOff, X } from 'lucide-react';

const IncomingCallModal = ({ call, onAccept, onReject, countdown }) => {
  if (!call) return null;

  const callerName = call.callerName || 'Someone';
  const callerInitial = callerName.charAt(0).toUpperCase();
  const avatarColor = call.callerAvatar || '#6366f1';

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn px-4">
      <div className="metallic-panel border-emerald-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative animate-bounce-gentle">
        <div className="flex flex-col items-center py-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-4 border border-white/10 shadow-lg ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-[#0a0e1a]"
            style={{ backgroundColor: avatarColor }}
          >
            {callerInitial}
          </div>
          <h3 className="text-lg font-bold text-white">{callerName}</h3>
          <p className="text-sm text-emerald-400 mt-1 font-semibold flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Incoming audio call
          </p>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            {countdown}s
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-2">
          <button
            onClick={onReject}
            className="p-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all hover:scale-105"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={onAccept}
            className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all hover:scale-105 animate-pulse"
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[10px] text-slate-600 text-center mt-4">
          Call will be securely connected via Agora
        </p>
      </div>
    </div>
  );
};

export default IncomingCallModal;
