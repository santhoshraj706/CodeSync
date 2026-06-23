import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../utils/api';
import {
  Send, Loader2, User, LogIn, ChevronDown, Copy, CheckCheck, Clock, ArrowLeft,
  Hash, Check, X, ExternalLink, Trash2, Hourglass, CheckCircle2, AlertCircle, FileText,
  Shield, ShieldOff, Ban, Edit3, Save
} from 'lucide-react';
import InviteToRoom from './InviteToRoom';
import EmojiPickerButton from './EmojiPickerButton';

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

const formatDateSeparator = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const shouldShowDateSeparator = (msg, idx, messages) => {
  if (idx === 0) return true;
  const prev = messages[idx - 1];
  const currDate = new Date(msg.createdAt).toDateString();
  const prevDate = new Date(prev.createdAt).toDateString();
  return currDate !== prevDate;
};

const ChatWindow = ({ conversation, onBack, onViewProfile, isOnline, otherUser }) => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const currentUserId = user?._id ?? user?.id;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [roomInvites, setRoomInvites] = useState([]);
  const [deleteConfirmInviteId, setDeleteConfirmInviteId] = useState(null);
  const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedMe: false });
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const other = otherUser || conversation?.participants?.find(p => String(p._id ?? p.id) !== String(currentUserId));

  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation]);

  useEffect(() => {
    if (!conversation) return;
    setLoading(true);
    setMessages([]);
    setNewMessage('');
    const otherId = other?._id ?? other?.id;
    Promise.all([
      api.get(`/direct-messages/${conversation._id}`),
      otherId ? api.get(`/room-invites/between/${otherId}`) : Promise.resolve({ data: [] }),
      otherId ? api.get(`/blocks/status/${otherId}`) : Promise.resolve({ data: { blockedByMe: false, blockedMe: false } }),
    ])
      .then(([msgRes, inviteRes, blockRes]) => {
        setMessages(msgRes.data);
        setRoomInvites(inviteRes.data || []);
        setBlockStatus(blockRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversation]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, roomInvites]);

  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isNearBottom());
  }, [isNearBottom]);

  useEffect(() => {
    if (!socket || !conversation) return;
    const cid = conversation._id;
    socket.emit('join-dm', { conversationId: cid });

    const handler = (msg) => {
      if (String(msg.conversation) === String(cid)) {
        setMessages(prev => {
          if (prev.find(m => String(m._id) === String(msg._id))) return prev;
          const withoutOptimistic = prev.filter(m => !String(m._id).startsWith('opt-'));
          return [...withoutOptimistic, msg];
        });
      }
    };

    const typingStartHandler = ({ conversationId, username }) => {
      if (String(conversationId) === String(cid)) {
        setTyping(true);
        setTypingUser(username);
      }
    };

    const typingStopHandler = ({ conversationId }) => {
      if (String(conversationId) === String(cid)) {
        setTyping(false);
        setTypingUser('');
      }
    };

    const inviteSentHandler = (data) => {
      const otherId = other?._id ?? other?.id;
      if (!otherId) return;
      const fromId = String(data.from?._id ?? data.from ?? data.fromUserId);
      const toId = String(data.to?._id ?? data.to ?? data.toUserId);
      if ((fromId === String(currentUserId) && toId === String(otherId)) ||
          (fromId === String(otherId) && toId === String(currentUserId))) {
        setRoomInvites(prev => {
          if (prev.find(inv => inv._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    };
    const inviteAcceptedHandler = (data) => {
      setRoomInvites(prev =>
        prev.map(inv =>
          inv.roomId === data.roomId && inv.status === 'pending'
            ? { ...inv, status: 'accepted' }
            : inv
        )
      );
    };
    const inviteDeletedHandler = ({ inviteId }) => {
      setRoomInvites(prev => prev.filter(inv => inv._id !== inviteId));
    };
    const msgBlockedHandler = (data) => {
      if (String(data.conversationId) === String(cid)) {
        showToast(data.message, 'error');
      }
    };
    const userBlockedHandler = ({ userId }) => {
      const otherId = other?._id ?? other?.id;
      if (String(userId) === String(otherId)) setBlockStatus(prev => ({ ...prev, blockedMe: true }));
    };
    const userUnblockedHandler = ({ userId }) => {
      const otherId = other?._id ?? other?.id;
      if (String(userId) === String(otherId)) setBlockStatus(prev => ({ ...prev, blockedMe: false }));
    };

    socket.on('direct-message', handler);
    socket.on('direct-typing-start', typingStartHandler);
    socket.on('direct-typing-stop', typingStopHandler);
    socket.on('invite-sent', inviteSentHandler);
    socket.on('invite-accepted', inviteAcceptedHandler);
    socket.on('invite-deleted', inviteDeletedHandler);
    socket.on('direct-message-blocked', msgBlockedHandler);
    socket.on('user-blocked', userBlockedHandler);
    const msgEditedHandler = (data) => {
      if (String(data.conversation) === String(cid)) {
        setMessages(prev => prev.map(m =>
          String(m._id) === String(data._id) ? { ...m, text: data.text, isEdited: data.isEdited } : m
        ));
      }
    };

    const msgDeletedHandler = (data) => {
      if (String(data.conversation) === String(cid)) {
        setMessages(prev => prev.filter(m => String(m._id) !== String(data._id)));
      }
    };

    socket.on('direct-message-edited', msgEditedHandler);
    socket.on('direct-message-deleted', msgDeletedHandler);
    socket.on('user-unblocked', userUnblockedHandler);

    return () => {
      socket.off('direct-message', handler);
      socket.off('direct-typing-start', typingStartHandler);
      socket.off('direct-typing-stop', typingStopHandler);
      socket.off('invite-sent', inviteSentHandler);
      socket.off('invite-accepted', inviteAcceptedHandler);
      socket.off('invite-deleted', inviteDeletedHandler);
      socket.off('direct-message-blocked', msgBlockedHandler);
      socket.off('direct-message-edited', msgEditedHandler);
      socket.off('direct-message-deleted', msgDeletedHandler);
      socket.off('user-blocked', userBlockedHandler);
      socket.off('user-unblocked', userUnblockedHandler);
      socket.emit('leave-dm', { conversationId: cid });
      setTyping(false);
    };
  }, [socket, conversation]);

  const emitTyping = useCallback((isTyping) => {
    if (!socket || !conversation || !other || !currentUserId) return;
    if (isTyping) {
      socket.emit('direct-typing-start', {
        conversationId: conversation._id,
        userId: currentUserId,
        username: user?.username,
      });
    } else {
      socket.emit('direct-typing-stop', {
        conversationId: conversation._id,
        userId: currentUserId,
        username: user?.username,
      });
    }
  }, [socket, conversation, other, currentUserId, user]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!typingTimeoutRef.current) {
      emitTyping(true);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !conversation || !other) return;

    clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
    typingTimeoutRef.current = null;

    const text = newMessage.trim();
    setNewMessage('');

    const tempId = 'opt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const optimisticMsg = {
      _id: tempId,
      conversation: conversation._id,
      text,
      sender: { _id: currentUserId, username: user.username, fullName: user.fullName, avatarColor: user.avatarColor },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    if (socket && currentUserId) {
      socket.emit('direct-message', {
        conversationId: conversation._id,
        text,
        senderId: currentUserId,
        recipientId: other._id ?? other.id,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = newMessage;
    const newVal = val.slice(0, start) + emoji + val.slice(end);
    setNewMessage(newVal);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  };

  const handleBlock = async () => {
    try {
      await api.post(`/blocks/${other._id ?? other.id}`);
      setBlockStatus(prev => ({ ...prev, blockedByMe: true }));
    } catch (err) {
      console.error('Failed to block user:', err);
    }
    setShowBlockConfirm(false);
  };

  const handleUnblock = async () => {
    try {
      await api.delete(`/blocks/${other._id ?? other.id}`);
      setBlockStatus(prev => ({ ...prev, blockedByMe: false }));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
    setShowUnblockConfirm(false);
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setEditText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingMessageId || !socket || !conversation) return;
    const text = editText.trim();
    socket.emit('direct-message-edit', {
      conversationId: conversation._id,
      messageId: editingMessageId,
      text,
    });
    setMessages(prev => prev.map(m =>
      String(m._id) === String(editingMessageId) ? { ...m, text, isEdited: true } : m
    ));
    setEditingMessageId(null);
    setEditText('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteMessage = () => {
    if (!deleteConfirmMsgId || !socket || !conversation) return;
    socket.emit('direct-message-delete', {
      conversationId: conversation._id,
      messageId: deleteConfirmMsgId,
    });
    setMessages(prev => prev.filter(m => String(m._id) !== String(deleteConfirmMsgId)));
    setDeleteConfirmMsgId(null);
  };

  if (!conversation || !other) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Select a conversation to start chatting
      </div>
    );
  }

  const otherAvatarColor = other.avatarColor || generateAvatarColor(other.fullName || other.username);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-2 md:p-2.5 border-b border-white/10 shrink-0 metallic-panel rounded-none w-full">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onViewProfile?.(other)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left group"
        >
          <div className="relative shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10 group-hover:border-indigo-500/30 transition-all"
              style={{ backgroundColor: otherAvatarColor }}
            >
              {getInitials(other.fullName || other.username)}
            </div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a0e1a] rounded-full"></div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-white truncate flex items-center gap-1.5">
              {other.fullName || other.username}
              {isOnline && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">@{other.username}</span>
              {isOnline ? (
                <span className="text-[9px] text-emerald-400/70">Online</span>
              ) : (
                <span className="text-[9px] text-slate-600">Offline</span>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onViewProfile?.(other)}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
            title="View Profile"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
            title="Invite to Room"
          >
            <LogIn className="w-4 h-4" />
          </button>
          {blockStatus.blockedMe ? (
            <div className="p-2 rounded-lg text-slate-500 cursor-not-allowed" title="This user has blocked you">
              <Ban className="w-4 h-4" />
            </div>
          ) : blockStatus.blockedByMe ? (
            <button
              onClick={() => setShowUnblockConfirm(true)}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
              title="Unblock user"
            >
              <ShieldOff className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowBlockConfirm(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
              title="Block user"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Block banner */}
      {(blockStatus.blockedByMe || blockStatus.blockedMe) && (
        <div className={`mx-2 mt-1 px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
          blockStatus.blockedByMe
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          <Ban className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium flex-1">
            {blockStatus.blockedByMe
              ? 'You blocked this user. Unblock to continue chatting.'
              : 'You cannot send messages to this user.'}
          </span>
          {blockStatus.blockedByMe && (
            <button
              onClick={() => setShowUnblockConfirm(true)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] transition-all shrink-0"
            >
              Unblock
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto px-3 md:px-5 py-2 md:py-3 space-y-0.5 relative"
      >
        {loading ? (
          <div className="p-3 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="w-full max-w-[70%] md:max-w-[60%]">
                  <div className={`p-3 rounded-2xl ${i % 2 === 0 ? 'rounded-br-md' : 'rounded-bl-md'} bg-white/[0.06] border border-white/[0.06]`}>
                    {i % 2 !== 0 && (
                      <div className="h-2.5 bg-white/[0.06] rounded w-1/3 mb-2"></div>
                    )}
                    <div className="space-y-2">
                      <div className="h-3 bg-white/[0.06] rounded w-full"></div>
                      <div className={`h-3 bg-white/[0.06] rounded ${i % 2 === 0 ? 'w-2/3' : 'w-4/5'}`}></div>
                      {i === 1 && <div className="h-3 bg-white/[0.06] rounded w-1/2"></div>}
                    </div>
                    <div className="flex justify-end mt-2">
                      <div className="h-2 bg-white/[0.04] rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 && roomInvites.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">No messages yet</p>
              <p className="text-xs text-slate-600 mt-1">Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {roomInvites.map((inv) => {
              const isMyInvite = String(inv.from?._id ?? inv.from) === String(currentUserId);
              const person = isMyInvite ? inv.to : inv.from;
              if (!person) return null;
              const avatarColor = person.avatarColor || generateAvatarColor(person.fullName || person.username);
              const pName = person.fullName || person.username;

              return (
                <div key={inv._id} className="py-2 w-full">
                  <div className={`flex w-full ${isMyInvite ? 'justify-end' : 'justify-start'}`}>
                    <div className="w-full max-w-[85%] md:max-w-[70%]">
                      <div className={`relative p-3 rounded-2xl ${
                        isMyInvite
                          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/15 rounded-br-md'
                          : 'bg-white/[0.06] border border-white/10 rounded-bl-md'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {pName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-white">{pName}</span>
                          {inv.status === 'pending' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15 flex items-center gap-1">
                              <Hourglass className="w-2.5 h-2.5" /> Pending
                            </span>
                          )}
                          {inv.status === 'accepted' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Accepted
                            </span>
                          )}
                          {inv.status === 'rejected' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Rejected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Hash className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="text-xs font-mono text-indigo-300 font-semibold">{inv.roomId}</span>
                        </div>
                        {inv.note && (
                          <div className="flex items-start gap-1 mb-1.5">
                            <FileText className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-400 italic">"{inv.note}"</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                          <span className="text-[9px] text-slate-600">
                            {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="ml-auto flex items-center gap-1.5">
                            {isMyInvite && (
                              <button
                                onClick={() => setDeleteConfirmInviteId(inv._id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all border border-red-500/20"
                                title="Delete invite"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            {!isMyInvite && inv.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/room-invites/${inv._id}/accept`);
                                    setRoomInvites(prev =>
                                      prev.map(i => i._id === inv._id ? { ...i, status: 'accepted' } : i)
                                    );
                                  } catch (err) {
                                    console.error('Failed to accept invite:', err);
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[9px] font-semibold border border-emerald-500/20"
                              >
                                <Check className="w-3 h-3" /> Accept
                              </button>
                            )}
                            {!isMyInvite && inv.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/room-invites/${inv._id}/reject`);
                                    setRoomInvites(prev =>
                                      prev.map(i => i._id === inv._id ? { ...i, status: 'rejected' } : i)
                                    );
                                  } catch (err) {
                                    console.error('Failed to reject invite:', err);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                title="Reject"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            {(inv.status === 'accepted') && (
                              <button
                                onClick={() => navigate(`/room/${inv.roomId}`)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[9px] font-semibold border border-emerald-500/20"
                              >
                                <ExternalLink className="w-3 h-3" /> Join Room
                              </button>
                            )}
                            {(inv.status === 'accepted' || inv.status === 'rejected') && (
                              <button
                                onClick={() => navigate(`/room/${inv.roomId}`)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[9px] font-semibold border border-indigo-500/20"
                              >
                                <ExternalLink className="w-3 h-3" /> View Room
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/[0.06]"></div>
              <span className="text-[10px] font-semibold text-slate-500 shrink-0">Messages</span>
              <div className="flex-1 h-px bg-white/[0.06]"></div>
            </div>
            {messages.map((msg, idx) => {
            const isOwn = String(msg.sender?._id ?? msg.sender?.id ?? msg.sender) === String(currentUserId);
            const isOptimistic = String(msg._id).startsWith('opt-');
            const isEditing = editingMessageId === msg._id;

            return (
              <div key={msg._id}>
                {shouldShowDateSeparator(msg, idx, messages) && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-white/[0.06]"></div>
                    <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]"></div>
                  </div>
                )}
                <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} message-item`}>
                  <div className="group relative max-w-[80%] md:max-w-[65%]">
                    <div
                      className={`relative p-2.5 rounded-2xl ${
                        isEditing ? 'border-2 border-indigo-400/40' : ''
                      } ${
                        isOwn
                          ? 'bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-500/20 text-white rounded-br-md'
                          : 'bg-white/[0.06] border border-white/10 text-slate-200 rounded-bl-md'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-[10px] font-semibold mb-1" style={{ color: otherAvatarColor }}>
                          {msg.sender?.fullName || msg.sender?.username || other?.fullName || other?.username}
                        </div>
                      )}
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="w-full glow-input rounded-xl px-3 py-2 text-sm resize-none min-h-[60px] bg-[#0a0e1a]/80"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 text-xs font-semibold transition-all border border-white/[0.08]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editText.trim()}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</div>
                      )}
                      <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] ${isOwn ? 'text-indigo-300/50' : 'text-slate-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isEdited && (
                          <span className="text-[8px] text-slate-500 italic">(edited)</span>
                        )}
                        {isOptimistic && (
                          <Clock className="w-2.5 h-2.5 text-indigo-300/50" />
                        )}
                      </div>
                    </div>
                    {/* Hover actions */}
                    {!isEditing && (
                      <div className={`absolute top-1 ${isOwn ? 'left-0 -translate-x-full pl-1' : 'right-0 translate-x-full pr-1'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5`}>
                        <button
                          onClick={() => handleCopy(msg.text, msg._id)}
                          className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-slate-400 hover:text-white transition-all border border-white/[0.06]"
                          title="Copy"
                        >
                          {copiedId === msg._id ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {isOwn && !isOptimistic && (
                          <>
                            <button
                              onClick={() => handleEditMessage(msg)}
                              className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-slate-400 hover:text-indigo-300 transition-all border border-white/[0.06]"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMsgId(msg._id)}
                              className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-slate-400 hover:text-red-400 transition-all border border-white/[0.06]"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </>
        )}

        {/* Typing indicator */}
        {typing && (
          <div className="flex w-full justify-start message-item">
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-md p-3 flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ backgroundColor: otherAvatarColor }}
              >
                {getInitials(typingUser || other?.fullName || other?.username)}
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-[10px] text-slate-400">
                {typingUser || other?.fullName || other?.username} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-16 right-4 z-10 p-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all shadow-lg backdrop-blur-md"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="w-full p-2.5 md:p-3 lg:p-4 border-t border-white/10 shrink-0 flex gap-2 md:gap-3 items-end bg-[#0a0e1a]/80 backdrop-blur-md">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={blockStatus.blockedByMe || blockStatus.blockedMe ? 'Chat is unavailable' : 'Type a message...'}
          rows={1}
          disabled={blockStatus.blockedByMe || blockStatus.blockedMe}
          className="flex-1 glow-input rounded-xl px-4 py-3 md:py-3.5 text-sm resize-none max-h-32 min-h-[44px] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ height: 'auto' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
          }}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <EmojiPickerButton
            onEmojiSelect={handleEmojiSelect}
            disabled={blockStatus.blockedByMe || blockStatus.blockedMe}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || blockStatus.blockedByMe || blockStatus.blockedMe}
            className="p-3 rounded-xl glow-button disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Block Confirmation */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="metallic-panel border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <ShieldOff className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Block User</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Block this user? They will no longer be able to send you personal messages.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm border border-red-400/30 shadow-lg shadow-red-500/20 transition-all"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Confirmation */}
      {showUnblockConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="metallic-panel border-amber-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Unblock User</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Unblock this user? They will be able to message you again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnblockConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUnblock}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm border border-amber-400/30 shadow-lg shadow-amber-500/20 transition-all"
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invite Confirmation */}
      {deleteConfirmInviteId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="metallic-panel border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Invite</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Permanently delete this invite? The other user will no longer see it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmInviteId(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = deleteConfirmInviteId;
                  setDeleteConfirmInviteId(null);
                  api.delete(`/room-invites/${id}`)
                    .then(() => setRoomInvites(prev => prev.filter(i => i._id !== id)))
                    .catch(console.error);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm border border-red-400/30 shadow-lg shadow-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation */}
      {deleteConfirmMsgId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn px-4">
          <div className="metallic-panel border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Message</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Permanently delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmMsgId(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-sm border border-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm border border-red-400/30 shadow-lg shadow-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn px-4 w-full md:w-auto">
          <div className={`flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm ${
            toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Invite to Room Modal */}
      {showInvite && (
        <InviteToRoom
          recipientId={other._id ?? other.id}
          recipientName={other.fullName || other.username}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
