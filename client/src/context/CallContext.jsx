import { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';
import AgoraAudioCall from '../components/AgoraAudioCall';
import IncomingCallModal from '../components/IncomingCallModal';
import OutgoingCallModal from '../components/OutgoingCallModal';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const currentUserId = user?._id ?? user?.id;

  // Direct call state
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState('idle');
  const [outgoingCallCountdown, setOutgoingCallCountdown] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingCallCountdown, setIncomingCallCountdown] = useState(0);
  const [activeCall, setActiveCall] = useState(null);

  // Room call state
  const [roomCall, setRoomCall] = useState(null);
  const [inRoomCall, setInRoomCall] = useState(false);
  const [roomCallActive, setRoomCallActive] = useState(false);

  const outgoingTimerRef = useRef(null);
  const incomingTimerRef = useRef(null);
  const otherUserForCallRef = useRef(null);

  const isInCall = !!activeCall || inRoomCall;

  const startDirectCall = useCallback((conversationId, receiverId, otherUser) => {
    if (!socket || !conversationId || !receiverId) return;
    if (inRoomCall) return;
    otherUserForCallRef.current = otherUser;
    setOutgoingCall({
      callId: null,
      conversationId,
      receiverId,
      receiverName: otherUser?.fullName || otherUser?.username || 'User',
      receiverAvatar: otherUser?.avatarColor || '#6366f1',
    });
    setOutgoingCallStatus('calling');
    socket.emit('direct-call-initiate', { conversationId, receiverId });
  }, [socket, inRoomCall]);

  const cancelDirectCall = useCallback(() => {
    if (socket && outgoingCall?.callId) {
      socket.emit('direct-call-cancel', { callId: outgoingCall.callId });
    }
    setOutgoingCall(null);
    setOutgoingCallStatus('idle');
    setOutgoingCallCountdown(0);
    otherUserForCallRef.current = null;
  }, [socket, outgoingCall]);

  const acceptDirectCall = useCallback(() => {
    if (socket && incomingCall?.callId) {
      socket.emit('direct-call-accept', { callId: incomingCall.callId });
      otherUserForCallRef.current = {
        _id: incomingCall.callerId,
        username: incomingCall.callerUsername,
        fullName: incomingCall.callerName,
        avatarColor: incomingCall.callerAvatar,
      };
    }
  }, [socket, incomingCall]);

  const rejectDirectCall = useCallback(() => {
    if (socket && incomingCall?.callId) {
      socket.emit('direct-call-reject', { callId: incomingCall.callId });
    }
    setIncomingCall(null);
    setIncomingCallCountdown(0);
    otherUserForCallRef.current = null;
  }, [socket, incomingCall]);

  const endDirectCall = useCallback(() => {
    if (socket && activeCall) {
      socket.emit('direct-call-ended', {
        callId: activeCall.callId,
        conversationId: activeCall.conversationId,
      });
    }
    setActiveCall(null);
    otherUserForCallRef.current = null;
  }, [socket, activeCall]);

  const startRoomCall = useCallback((roomId) => {
    if (!socket || !roomId) return;
    if (activeCall) return;
    setInRoomCall(true);
    setRoomCallActive(true);
    socket.emit('room-call-start', { roomId });
  }, [socket, activeCall]);

  const joinRoomCall = useCallback((roomId) => {
    if (!socket || !roomId) return;
    if (activeCall) return;
    socket.emit('room-call-join', { roomId });
  }, [socket, activeCall]);

  const leaveRoomCall = useCallback((roomId) => {
    if (!socket || !roomId) return;
    socket.emit('room-call-leave', { roomId });
    setInRoomCall(false);
    setRoomCallActive(false);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onRinging = (data) => {
      if (inRoomCall) return;
      setOutgoingCall(prev => ({
        ...prev,
        callId: data.callId,
        conversationId: data.conversationId,
      }));
      setOutgoingCallStatus('ringing');
      setOutgoingCallCountdown(data.timeoutSeconds || 30);
    };

    const onIncomingCall = (data) => {
      if (inRoomCall) return;
      setIncomingCall(data);
      setIncomingCallCountdown(data.timeoutSeconds || 30);
    };

    const onCallAccepted = (data) => {
      setOutgoingCall(null);
      setOutgoingCallStatus('idle');
      setIncomingCall(null);
      setActiveCall({
        callId: data.callId,
        conversationId: data.conversationId,
        otherUser: otherUserForCallRef.current,
      });
    };

    const onCallTimeout = () => {
      setOutgoingCallStatus('timeout');
      setIncomingCall(null);
      setIncomingCallCountdown(0);
    };

    const onCallRejected = () => {
      setOutgoingCallStatus('rejected');
      setIncomingCall(null);
      setIncomingCallCountdown(0);
    };

    const onCallCancelled = () => {
      setIncomingCall(null);
      setIncomingCallCountdown(0);
    };

    const onCallMissed = () => {
      setIncomingCall(null);
      setIncomingCallCountdown(0);
    };

    const onCallUnavailable = (data) => {
      setOutgoingCall(prev => ({
        ...prev,
        unavailableMessage: data.message || 'User is offline',
      }));
      setOutgoingCallStatus('unavailable');
    };

    const onCallEnded = (data) => {
      if (activeCall && data.conversationId === activeCall.conversationId) {
        setActiveCall(null);
      }
      setOutgoingCall(null);
      setOutgoingCallStatus('idle');
      setIncomingCall(null);
    };

    socket.on('direct-call-ringing', onRinging);
    socket.on('incoming-direct-call', onIncomingCall);
    socket.on('direct-call-accepted', onCallAccepted);
    socket.on('direct-call-timeout', onCallTimeout);
    socket.on('direct-call-rejected', onCallRejected);
    socket.on('direct-call-cancelled', onCallCancelled);
    socket.on('direct-call-missed', onCallMissed);
    socket.on('direct-call-unavailable', onCallUnavailable);
    socket.on('direct-call-ended', onCallEnded);

    return () => {
      socket.off('direct-call-ringing', onRinging);
      socket.off('incoming-direct-call', onIncomingCall);
      socket.off('direct-call-accepted', onCallAccepted);
      socket.off('direct-call-timeout', onCallTimeout);
      socket.off('direct-call-rejected', onCallRejected);
      socket.off('direct-call-cancelled', onCallCancelled);
      socket.off('direct-call-missed', onCallMissed);
      socket.off('direct-call-unavailable', onCallUnavailable);
      socket.off('direct-call-ended', onCallEnded);
    };
  }, [socket, activeCall, inRoomCall]);

  useEffect(() => {
    if (outgoingCallStatus === 'ringing' && outgoingCallCountdown > 0) {
      outgoingTimerRef.current = setInterval(() => {
        setOutgoingCallCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(outgoingTimerRef.current);
    }
  }, [outgoingCallStatus, outgoingCallCountdown]);

  useEffect(() => {
    if (incomingCall && incomingCallCountdown > 0) {
      incomingTimerRef.current = setInterval(() => {
        setIncomingCallCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(incomingTimerRef.current);
    }
  }, [incomingCall, incomingCallCountdown]);

  const contextValue = {
    outgoingCall,
    outgoingCallStatus,
    outgoingCallCountdown,
    incomingCall,
    incomingCallCountdown,
    activeCall,
    roomCall,
    inRoomCall,
    roomCallActive,
    isInCall,
    startDirectCall,
    cancelDirectCall,
    acceptDirectCall,
    rejectDirectCall,
    endDirectCall,
    startRoomCall,
    joinRoomCall,
    leaveRoomCall,
    setRoomCall,
    setInRoomCall,
    setRoomCallActive,
  };

  return (
    <CallContext.Provider value={contextValue}>
      {children}

      {/* Outgoing Call Modal */}
      {outgoingCall && (
        <OutgoingCallModal
          call={outgoingCall}
          onCancel={cancelDirectCall}
          status={outgoingCallStatus}
          countdown={outgoingCallCountdown}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={acceptDirectCall}
          onReject={rejectDirectCall}
          countdown={incomingCallCountdown}
        />
      )}

      {/* Active Agora Audio Call (direct) */}
      {activeCall && user && activeCall.otherUser && (
        <AgoraAudioCall
          conversationId={activeCall.conversationId}
          currentUser={user}
          otherUser={activeCall.otherUser}
          callId={activeCall.callId}
          onClose={() => {
            setActiveCall(null);
            otherUserForCallRef.current = null;
          }}
        />
      )}
    </CallContext.Provider>
  );
};

export default CallContext;
