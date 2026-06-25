import { PhoneOff, Loader2, X } from 'lucide-react';

const OutgoingCallModal = ({ call, onCancel, status, countdown }) => {
  if (!call) return null;

  const otherName = call.receiverName || 'User';
  const otherInitial = otherName.charAt(0).toUpperCase();
  const avatarColor = call.receiverAvatar || '#6366f1';

  const renderContent = () => {
    switch (status) {
      case 'ringing':
        return (
          <>
            <div className="flex items-center gap-2 text-indigo-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Calling {otherName}...</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Waiting for answer... {countdown}s
            </p>
          </>
        );
      case 'timeout':
        return (
          <div className="flex flex-col items-center gap-2 text-amber-400">
            <span className="text-sm font-semibold">They didn't pick the phone</span>
            <p className="text-xs text-slate-500">No answer</p>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col items-center gap-2 text-red-400">
            <span className="text-sm font-semibold">Call declined</span>
          </div>
        );
      case 'unavailable':
        return (
          <div className="flex flex-col items-center gap-2 text-red-400">
            <span className="text-sm font-semibold">{call.unavailableMessage || 'User is offline'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const showCancel = status === 'ringing';
  const showClose = status === 'timeout' || status === 'rejected' || status === 'unavailable';

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn px-4">
      <div className="metallic-panel border-indigo-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
        <div className="flex flex-col items-center py-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-4 border border-white/10 shadow-lg"
            style={{ backgroundColor: avatarColor }}
          >
            {otherInitial}
          </div>
          <h3 className="text-lg font-bold text-white">{otherName}</h3>
          <p className="text-sm text-slate-400 mt-1">Audio Call</p>

          <div className="mt-4 text-center">
            {renderContent()}
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-2">
          {showCancel && (
            <button
              onClick={onCancel}
              className="p-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
              title="Cancel Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          )}
          {showClose && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-xl transition-all text-xs font-bold border border-indigo-500/30"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallModal;
