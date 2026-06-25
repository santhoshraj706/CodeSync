import { useState, useEffect, useRef, useContext } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, X, AlertCircle, Users } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../utils/api';
import { SocketContext } from '../context/SocketContext';

const AgoraRoomCall = ({ roomId, currentUser, participants, onLeave }) => {
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
    await cleanupAgoraCall();
    onLeave();
  };

  useEffect(() => {
    mountedRef.current = true;

    if (clientRef.current || isJoinedRef.current) {
      return;
    }

    const initCall = async () => {
      try {
        const tokenRes = await api.post('/agora/room-token', { roomId });
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
        console.error('Agora room call error:', err);
        const isPermissionDenied =
          err.name === 'NotAllowedError' ||
          err.message?.includes('Permission denied') ||
          err.message?.includes('PERMISSION_DENIED') ||
          err.code === 'PERMISSION_DENIED';
        setError(isPermissionDenied
          ? 'Microphone access denied. Allow microphone access in your browser settings and try again.'
          : (err.message || 'Failed to start room audio call'));
        setStatus('error');
      }
    };

    initCall();

    return () => {
      mountedRef.current = false;
      cleanupAgoraCall();
    };
  }, [roomId, retryCount]);

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

  const userInitial = (currentUser?.fullName || currentUser?.username || 'U').charAt(0).toUpperCase();
  const userAvatarColor = currentUser?.avatarColor || '#6366f1';

  const isConnected = status === 'connected';
  const isError = status === 'error';

  return (
    <div className="metallic-panel border-indigo-500/30 rounded-xl p-3 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white border border-white/10"
            style={{ backgroundColor: userAvatarColor }}>
            {userInitial}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Room Voice Call</h4>
            {isConnected && (
              <p className="text-[10px] text-emerald-400 font-mono">{formatDuration(callDuration)}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          title="Leave Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {status === 'connecting' && (
        <div className="flex items-center gap-2 py-2 text-indigo-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Connecting to room voice...</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col gap-2 py-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{error || 'Call failed'}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-all text-xs font-semibold border border-indigo-500/30"
            >
              Try Again
            </button>
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] rounded-lg transition-all text-xs border border-white/[0.08]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isConnected && (
        <>
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">{participants?.length || 1} participant{(participants?.length || 1) !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-all ${
                isMuted
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                  : 'bg-white/[0.08] text-slate-300 border border-white/[0.1] hover:bg-white/[0.12]'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <span className="text-[10px] text-slate-500">
              {isMuted ? 'Muted' : 'Live'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AgoraRoomCall;
