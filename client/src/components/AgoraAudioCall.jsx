import { useState, useEffect, useRef, useContext } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, X, AlertCircle } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../utils/api';
import { SocketContext } from '../context/SocketContext';

const AgoraAudioCall = ({ conversationId, currentUser, otherUser, callId, onClose }) => {
  const socket = useContext(SocketContext);
  const [status, setStatus] = useState('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const isJoinedRef = useRef(false);
  const remoteUsersRef = useRef([]);

  const cleanupAgoraCall = async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const client = clientRef.current;
      const localTrack = localAudioTrackRef.current;

      if (client && localTrack) {
        try {
          await client.unpublish([localTrack]);
        } catch (err) {
          if (err.message !== 'RUNTIME_ERROR') console.warn('Agora unpublish warning:', err?.message);
        }
      }

      if (localTrack) {
        try {
          localTrack.stop();
        } catch (err) {
          console.warn('Agora local track stop warning:', err?.message);
        }
        try {
          localTrack.close();
        } catch (err) {
          console.warn('Agora local track close warning:', err?.message);
        }
        localAudioTrackRef.current = null;
      }

      const remoteUsers = remoteUsersRef.current;
      if (remoteUsers.length > 0) {
        remoteUsers.forEach(user => {
          if (user.audioTrack) {
            try {
              user.audioTrack.stop();
            } catch (err) {
              console.warn('Agora remote track stop warning:', err?.message);
            }
          }
        });
        remoteUsersRef.current = [];
      }

      if (client) {
        try {
          client.removeAllListeners();
        } catch (err) {
          console.warn('Agora remove listener warning:', err?.message);
        }

        try {
          await client.leave();
        } catch (err) {
          if (err.message !== 'RUNTIME_ERROR') console.warn('Agora leave warning:', err?.message);
        }

        clientRef.current = null;
      }

      isJoinedRef.current = false;
    } finally {
      isCleaningUpRef.current = false;
    }
  };

  const handleLeave = async () => {
    if (isCleaningUpRef.current) return;
    const hadJoined = isJoinedRef.current;
    await cleanupAgoraCall();
    if (socket && callId && conversationId && hadJoined) {
      socket.emit('direct-call-ended', { callId, conversationId });
    }
    onClose();
  };

  useEffect(() => {
    mountedRef.current = true;

    if (clientRef.current || isJoinedRef.current) {
      return;
    }

    const initCall = async () => {
      try {
        const tokenRes = await api.post('/agora/direct-token', { conversationId });
        if (!tokenRes.data.success) {
          throw new Error(tokenRes.data.message || 'Failed to get Agora token');
        }
        const { appId, channel, token, uid } = tokenRes.data;

        if (!mountedRef.current) return;

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        if (clientRef.current) {
          return;
        }
        clientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
          if (isCleaningUpRef.current) return;
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'audio' && user.audioTrack) {
              user.audioTrack.play();
              if (!remoteUsersRef.current.find(u => u.uid === user.uid)) {
                remoteUsersRef.current.push(user);
              }
            }
          } catch (err) {
            console.warn('Agora subscribe error:', err?.message);
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'audio' && user.audioTrack) {
            try {
              user.audioTrack.stop();
            } catch (err) {
              console.warn('Agora remote track stop on unpublish error:', err?.message);
            }
          }
          remoteUsersRef.current = remoteUsersRef.current.filter(u => u.uid !== user.uid);
        });

        client.on('user-left', (user) => {
          remoteUsersRef.current = remoteUsersRef.current.filter(u => u.uid !== user.uid);
          if (!mountedRef.current || isCleaningUpRef.current) return;
          handleLeave();
        });

        client.on('connection-state-change', (cur, prev) => {
          if (cur === 'DISCONNECTED' && prev !== 'DISCONNECTED' && prev !== '') {
            if (!mountedRef.current || isCleaningUpRef.current) return;
            handleLeave();
          }
        });

        await client.join(appId, channel, token, uid);
        if (!mountedRef.current || isCleaningUpRef.current) return;
        isJoinedRef.current = true;

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        if (!mountedRef.current || isCleaningUpRef.current) {
          audioTrack.stop();
          audioTrack.close();
          return;
        }
        localAudioTrackRef.current = audioTrack;

        await client.publish([audioTrack]);
        if (!mountedRef.current || isCleaningUpRef.current) return;

        setStatus('connected');
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        if (!mountedRef.current) return;
        console.error('Agora call error:', err);
        const isPermissionDenied =
          err.name === 'NotAllowedError' ||
          err.message?.includes('Permission denied') ||
          err.message?.includes('PERMISSION_DENIED') ||
          err.code === 'PERMISSION_DENIED';
        setError(isPermissionDenied
          ? 'Microphone access denied. Allow microphone access in your browser settings and try again.'
          : (err.message || 'Failed to start audio call'));
        setStatus('error');
      }
    };

    initCall();

    return () => {
      mountedRef.current = false;
      cleanupAgoraCall();
    };
  }, [conversationId, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      const newMuted = !isMuted;
      localAudioTrackRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const otherName = otherUser?.fullName || otherUser?.username || 'User';
  const otherInitial = otherName.charAt(0).toUpperCase();
  const avatarColor = otherUser?.avatarColor || '#6366f1';

  const isConnected = status === 'connected';
  const isEnded = status === 'ended';
  const isError = status === 'error';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn px-4">
      <div className="metallic-panel border-indigo-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
        {!isEnded && (
          <button
            type="button"
            onClick={handleLeave}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col items-center py-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-4 border border-white/10 shadow-lg"
            style={{ backgroundColor: avatarColor }}
          >
            {otherInitial}
          </div>
          <h3 className="text-lg font-bold text-white">{otherName}</h3>
          <p className="text-sm text-slate-400 mt-1">Audio Call</p>

          {status === 'connecting' && (
            <div className="flex items-center gap-2 mt-4 text-indigo-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Connecting...</span>
            </div>
          )}

          {isConnected && (
            <p className="text-sm text-emerald-400 mt-2 font-mono">
              {formatDuration(callDuration)}
            </p>
          )}

          {isError && (
            <div className="flex items-center gap-2 mt-4 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error || 'Call failed'}</span>
            </div>
          )}

          {isEnded && (
            <p className="text-sm text-slate-500 mt-4">Call ended</p>
          )}
        </div>

        {isConnected && (
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                  : 'bg-white/[0.08] text-slate-300 border border-white/[0.1] hover:bg-white/[0.12]'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLeave}
              className="p-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {!isConnected && !isEnded && (
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={handleLeave}
              className="p-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {isError && (
          <div className="mt-4 text-center flex gap-2 justify-center">
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-xl transition-all text-xs font-bold border border-indigo-500/30"
            >
              <Phone className="w-3.5 h-3.5 inline mr-1.5" /> Try Again
            </button>
            <button
              onClick={handleLeave}
              className="px-5 py-2.5 bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] rounded-xl transition-all text-xs font-semibold border border-white/[0.08]"
            >
              Close
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-600 text-center mt-4">
          End-to-end encrypted via Agora
        </p>
      </div>
    </div>
  );
};

export default AgoraAudioCall;
