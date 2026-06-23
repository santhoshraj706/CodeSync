import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../utils/api';
import NeonWireframeBackground from '../components/NeonWireframeBackground';
import ConversationList from '../components/ConversationList';
import ChatRequestList from '../components/ChatRequestList';
import ChatWindow from '../components/ChatWindow';
import ProfileDrawer from '../components/ProfileDrawer';
import InviteToRoom from '../components/InviteToRoom';
import RoomInviteList from '../components/RoomInviteList';
import SentRoomInviteList from '../components/SentRoomInviteList';
import {
  ArrowLeft, ArrowRight, MessageCircle, UserPlus, CheckCircle2, AlertCircle,
  Send, Inbox, Users, Loader2, Search, LogIn, DoorOpen, Ban, ShieldOff
} from 'lucide-react';

const SKELETON_ITEMS = [1, 2, 3, 4, 5];

const Messages = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUserId = user?._id ?? user?.id;

  const [activeTab, setActiveTab] = useState('messages');
  const [conversations, setConversations] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [profileUser, setProfileUser] = useState(null);
  const [sentRequestIds, setSentRequestIds] = useState(new Set());
  const [inviteFromDrawer, setInviteFromDrawer] = useState(null);
  const [sentInvites, setSentInvites] = useState([]);
  const [sentInvitesLoading, setSentInvitesLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedUsersLoading, setBlockedUsersLoading] = useState(false);

  const showToast = (message, type = 'success', actionRoomId = null) => {
    setToast({ message, type, actionRoomId });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [convRes, incomingRes, outgoingRes, sentInvitesRes, blockRes] = await Promise.all([
          api.get('/conversations'),
          api.get('/chat-requests/incoming'),
          api.get('/chat-requests/outgoing'),
          api.get('/room-invites/outgoing'),
          api.get('/blocks'),
        ]);
        const convs = convRes.data;
        setConversations(convs);
        setIncomingRequests(incomingRes.data);
        setOutgoingRequests(outgoingRes.data);
        setSentInvites(sentInvitesRes.data || []);
        setBlockedUsers(blockRes.data);

        // Auto-select or use URL conversationId
        const urlConvId = searchParams.get('conversationId');
        if (urlConvId) {
          const match = convs.find(c => c._id === urlConvId);
          if (match) setActiveConversation(match);
        } else if (convs.length > 0 && window.innerWidth >= 768) {
          setActiveConversation(convs[0]);
        }
      } catch (err) {
        console.error('Failed to load messages data:', err);
      } finally {
        setLoading(false);
        setSentInvitesLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('user-status-changed', ({ userId, online }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });
    return () => socket.off('user-status-changed');
  }, [socket]);

  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit('user-online', { userId: currentUserId });
    }
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const name = data.fromFullName || data.fromUsername || 'Someone';
      showToast(`${name} accepted your invite to ${data.roomId}! Click to join.`, 'success', data.roomId);
      setSentInvites(prev =>
        prev.map(inv =>
          inv.roomId === data.roomId && inv.status === 'pending'
            ? { ...inv, status: 'accepted' }
            : inv
        )
      );
    };
    socket.on('invite-accepted', handler);
    return () => socket.off('invite-accepted', handler);
  }, [socket, showToast]);

  useEffect(() => {
    if (!socket) return;
    const refreshBlocks = () => { api.get('/blocks').then(r => setBlockedUsers(r.data)).catch(() => {}); };
    socket.on('user-blocked', refreshBlocks);
    socket.on('user-unblocked', refreshBlocks);
    return () => {
      socket.off('user-blocked', refreshBlocks);
      socket.off('user-unblocked', refreshBlocks);
    };
  }, [socket]);

  const hasReachedConvLimit = useMemo(() => {
    if (!conversations.length || !profileUser) return false;
    return conversations.some(conv =>
      conv.participants.some(p => String(p._id ?? p.id) === String(profileUser._id))
    );
  }, [conversations, profileUser]);

  const checkRequestSent = async (userId) => {
    try {
      const res = await api.get(`/chat-requests/outgoing`);
      const sent = res.data.some(r => String(r.to?._id ?? r.to) === String(userId));
      setSentRequestIds(prev => {
        const next = new Set(prev);
        if (sent) next.add(userId);
        return next;
      });
    } catch {}
  };

  const handleUnblock = async (userId) => {
    try {
      await api.delete(`/blocks/${userId}`);
      setBlockedUsers(prev => prev.filter(u => (u._id ?? u.id) !== userId));
      showToast('User unblocked', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unblock', 'error');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const req = incomingRequests.find(r => r._id === requestId);
      await api.put(`/chat-requests/${requestId}/accept`);
      setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
      showToast('Request accepted!', 'success');
      const convRes = await api.get('/conversations');
      setConversations(convRes.data);
      if (req) {
        const fromId = req.from?._id ?? req.from?.id;
        const newConv = convRes.data.find(c =>
          c.participants.some(p => String(p._id ?? p.id) === String(fromId))
        );
        if (newConv) {
          setActiveConversation(newConv);
          setActiveTab('messages');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/chat-requests/${requestId}/reject`);
      setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
      showToast('Request rejected');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    // Mark as read
    try {
      await api.put(`/conversations/${conv._id}/read`);
    } catch {}
  };

  const handleViewProfile = async (person) => {
    setProfileUser(person);
    if (person?._id) {
      await checkRequestSent(person._id);
    }
  };

  const handleSendRequest = async (toId) => {
    try {
      await api.post('/chat-requests', { to: toId });
      setSentRequestIds(prev => new Set([...prev, toId]));
      showToast('Chat request sent!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  // Compute unread counts per other user
  const unreadCounts = useMemo(() => {
    const counts = {};
    const uid = String(currentUserId);
    (conversations || []).forEach(conv => {
      if (conv.unread && conv.unread[uid] && conv.unread[uid] > 0) {
        const other = conv.participants?.find(p => String(p._id ?? p.id) !== uid);
        if (other) {
          counts[other._id ?? other.id] = conv.unread[uid];
        }
      }
    });
    return counts;
  }, [conversations, currentUserId]);

  const activeOtherUser = useMemo(() => {
    if (!activeConversation) return null;
    return activeConversation.participants?.find(
      p => String(p._id ?? p.id) !== String(currentUserId)
    );
  }, [activeConversation, currentUserId]);

  const isOnline = activeOtherUser ? onlineUsers?.has(activeOtherUser._id ?? activeOtherUser.id) : false;

  return (
    <div className="h-screen aurora-bg text-white font-sans relative overflow-hidden flex flex-col">
      <NeonWireframeBackground intensity="subtle" />
      <div className="grid-overlay"></div>
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>
      <div className="bg-orb-3"></div>
      <div className="bg-ring"></div>
      <div className="bg-spotlight"></div>

      <div className="fixed inset-0 bg-black/35 pointer-events-none z-[1]"></div>

      <div className="flex-1 flex flex-col relative z-10 w-full p-1 md:p-2 lg:p-3 gap-2 overflow-hidden">
        {/* Header */}
        <div className="metallic-panel p-2 md:p-2.5 rounded-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-400" /> Messages
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all text-xs font-bold border border-indigo-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" /> Find Users
          </button>
        </div>

        {/* Main layout */}
        <div className="flex-1 flex gap-2 min-h-0">
          {/* Left sidebar */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex bg-white/[0.06] rounded-lg p-0.5 border border-white/[0.06] mb-1.5 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('messages');
                  if (!activeConversation && conversations.length > 0 && window.innerWidth >= 768) {
                    setActiveConversation(conversations[0]);
                  } else if (window.innerWidth < 768) {
                    setActiveConversation(null);
                  }
                }}
                className={`flex-1 px-2 py-1.5 rounded-[7px] flex items-center justify-center text-[10px] font-bold transition-all gap-1 ${
                  activeTab === 'messages'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageCircle className="w-3 h-3" /> Chats
              </button>
              <button
                onClick={() => { setActiveTab('incoming'); setActiveConversation(null); }}
                className={`flex-1 px-2 py-1.5 rounded-[7px] flex items-center justify-center text-[10px] font-bold transition-all gap-1 ${
                  activeTab === 'incoming'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Inbox className="w-3 h-3" /> Incoming
                {incomingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('invites'); setActiveConversation(null); }}
                className={`flex-1 px-2 py-1.5 rounded-[7px] flex items-center justify-center text-[10px] font-bold transition-all gap-1 ${
                  activeTab === 'invites'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DoorOpen className="w-3 h-3" /> Invites
              </button>
              <button
                onClick={() => { setActiveTab('outgoing'); setActiveConversation(null); }}
                className={`flex-1 px-2 py-1.5 rounded-[7px] flex items-center justify-center text-[10px] font-bold transition-all gap-1 ${
                  activeTab === 'outgoing'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3 h-3" /> Sent
              </button>
              <button
                onClick={() => { setActiveTab('blocked'); setActiveConversation(null); }}
                className={`flex-1 px-2 py-1.5 rounded-[7px] flex items-center justify-center text-[10px] font-bold transition-all gap-1 ${
                  activeTab === 'blocked'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Ban className="w-3 h-3" /> Blocked
                {blockedUsers.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {blockedUsers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div key={activeTab} className="metallic-panel flex-1 rounded-xl p-2 overflow-y-auto min-h-0">
              {loading ? (
                <div className="space-y-2">
                  {SKELETON_ITEMS.map(i => (
                    <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/[0.06] rounded w-2/3"></div>
                        <div className="h-2 bg-white/[0.04] rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {activeTab === 'messages' && (
                    <ConversationList
                      conversations={conversations}
                      activeConversationId={activeConversation?._id}
                      onSelect={handleSelectConversation}
                      currentUserId={currentUserId}
                      onlineUsers={onlineUsers}
                      unreadCounts={unreadCounts}
                    />
                  )}
                  {activeTab === 'incoming' && (
                    <ChatRequestList
                      requests={incomingRequests}
                      type="incoming"
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      onViewProfile={handleViewProfile}
                    />
                  )}
                  {activeTab === 'invites' && (
                    <>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                        <LogIn className="w-3 h-3" /> Received
                      </div>
                      <RoomInviteList onViewProfile={handleViewProfile} />
                      <div className="my-3 border-t border-white/[0.06]" />
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                        <Send className="w-3 h-3" /> Sent
                      </div>
                      <SentRoomInviteList
                        sentInvites={sentInvites}
                        loading={sentInvitesLoading}
                        onViewProfile={handleViewProfile}
                        onDelete={(id) => {
                          api.delete(`/room-invites/${id}`)
                            .then(() => setSentInvites(prev => prev.filter(inv => inv._id !== id)))
                            .catch(err => console.error('Failed to delete invite:', err));
                        }}
                      />
                    </>
                  )}
                  {activeTab === 'outgoing' && (
                    <>
                      {outgoingRequests.length > 0 && (
                        <>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                            <UserPlus className="w-3 h-3" /> Chat Requests
                          </div>
                          <ChatRequestList
                            requests={outgoingRequests}
                            type="outgoing"
                            onViewProfile={handleViewProfile}
                          />
                          <div className="my-3 border-t border-white/[0.06]" />
                        </>
                      )}
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                        <LogIn className="w-3 h-3" /> Room Invites
                      </div>
                      <SentRoomInviteList
                        sentInvites={sentInvites}
                        loading={sentInvitesLoading}
                        onViewProfile={handleViewProfile}
                        onDelete={(id) => {
                          api.delete(`/room-invites/${id}`)
                            .then(() => setSentInvites(prev => prev.filter(inv => inv._id !== id)))
                            .catch(err => console.error('Failed to delete invite:', err));
                        }}
                      />
                    </>
                  )}
                  {activeTab === 'blocked' && (
                    <>
                      {blockedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
                            <Ban className="w-5 h-5 text-slate-600" />
                          </div>
                          <p className="text-sm text-slate-500">No blocked users</p>
                          <p className="text-xs text-slate-600 mt-1">Block users to prevent unwanted messages</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                            <Ban className="w-3 h-3" /> Blocked Users ({blockedUsers.length})
                          </div>
                          {blockedUsers.map(u => {
                            const uid = u._id ?? u.id;
                            return (
                              <div key={uid} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-all group">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10"
                                  style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                                >
                                  {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">{u.fullName || u.username}</div>
                                  <div className="text-[10px] text-slate-500">@{u.username}</div>
                                </div>
                                <button
                                  onClick={() => handleUnblock(uid)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                                  title="Unblock"
                                >
                                  <ShieldOff className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right chat window — only renders meaningful content on Chats tab */}
          <div className="hidden md:flex flex-1 min-w-0 metallic-panel rounded-2xl overflow-hidden relative bg-[#0a0e1a]/50">
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
                onViewProfile={handleViewProfile}
                isOnline={isOnline}
                otherUser={activeOtherUser}
              />
            ) : activeTab === 'messages' ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center px-8 max-w-sm">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-5 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <MessageCircle className="w-8 h-8 text-indigo-400/60" />
                  </div>
                  <p className="text-slate-300 text-base font-semibold">No conversation selected</p>
                  <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                    Choose a chat from the sidebar or discover new users to connect and collaborate with.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => navigate('/discover')}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 rounded-xl transition-all text-xs font-bold border border-indigo-400/20 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] inline-flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" /> Find Users
                    </button>
                    {conversations.length > 0 && (
                      <button
                        onClick={() => setActiveConversation(conversations[0])}
                        className="px-4 py-2.5 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] hover:text-white rounded-xl transition-all text-xs font-semibold border border-white/[0.08] inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Open Chats
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile: show chat window full screen */}
      {activeConversation && (
        <div className="fixed inset-0 z-50 md:hidden metallic-panel rounded-none flex flex-col">
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
            onViewProfile={handleViewProfile}
            isOnline={isOnline}
            otherUser={activeOtherUser}
          />
        </div>
      )}

      {/* Profile Drawer */}
      {profileUser && (
        <ProfileDrawer
          user={profileUser}
          onClose={() => setProfileUser(null)}
          onSendRequest={handleSendRequest}
          onMessage={() => {
            setProfileUser(null);
            const conv = conversations.find(c =>
              c.participants.some(p => String(p._id ?? p.id) === String(profileUser._id))
            );
            if (conv) {
              setActiveConversation(conv);
              setActiveTab('messages');
            }
          }}
          onInvite={() => {
            const pUser = profileUser;
            setProfileUser(null);
            setInviteFromDrawer(pUser);
          }}
          requestSent={sentRequestIds.has(profileUser._id)}
          isFriend={hasReachedConvLimit}
        />
      )}

      {/* Invite from Drawer */}
      {inviteFromDrawer && (
        <InviteToRoom
          recipientId={inviteFromDrawer._id ?? inviteFromDrawer.id}
          recipientName={inviteFromDrawer.fullName || inviteFromDrawer.username}
          onClose={() => setInviteFromDrawer(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn px-4 w-full md:w-auto ${toast.actionRoomId ? 'cursor-pointer' : ''}`}
          onClick={() => { if (toast.actionRoomId) { setToast(null); navigate(`/room/${toast.actionRoomId}`); } }}
        >
          <div className={`flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm ${
            toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
            {toast.actionRoomId && <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
