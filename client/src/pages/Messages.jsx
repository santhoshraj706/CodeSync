import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  ArrowLeft, MessageCircle, UserPlus, CheckCircle2, AlertCircle,
  Send, Inbox, Users, Loader2, Search, LogIn, DoorOpen
} from 'lucide-react';

const SKELETON_ITEMS = [1, 2, 3, 4, 5];

const Messages = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [convRes, incomingRes, outgoingRes] = await Promise.all([
          api.get('/conversations'),
          api.get('/chat-requests/incoming'),
          api.get('/chat-requests/outgoing'),
        ]);
        setConversations(convRes.data);
        setIncomingRequests(incomingRes.data);
        setOutgoingRequests(outgoingRes.data);
      } catch (err) {
        console.error('Failed to load messages data:', err);
      } finally {
        setLoading(false);
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

      <div className="flex-1 flex flex-col relative z-10 max-w-6xl mx-auto w-full p-2 md:p-4 gap-3 overflow-hidden">
        {/* Header */}
        <div className="metallic-panel p-3 md:p-4 rounded-2xl flex items-center justify-between shrink-0">
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
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Left sidebar */}
          <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex bg-white/[0.06] rounded-xl p-0.5 border border-white/[0.06] mb-2 shrink-0">
              <button
                onClick={() => { setActiveTab('messages'); setActiveConversation(null); }}
                className={`flex-1 px-3 py-2 rounded-[9px] flex items-center justify-center text-xs font-bold transition-all gap-1.5 ${
                  activeTab === 'messages'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chats
              </button>
              <button
                onClick={() => { setActiveTab('incoming'); setActiveConversation(null); }}
                className={`flex-1 px-3 py-2 rounded-[9px] flex items-center justify-center text-xs font-bold transition-all gap-1.5 ${
                  activeTab === 'incoming'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" /> Incoming
                {incomingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('invites'); setActiveConversation(null); }}
                className={`flex-1 px-3 py-2 rounded-[9px] flex items-center justify-center text-xs font-bold transition-all gap-1.5 ${
                  activeTab === 'invites'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" /> Invites
              </button>
              <button
                onClick={() => { setActiveTab('outgoing'); setActiveConversation(null); }}
                className={`flex-1 px-3 py-2 rounded-[9px] flex items-center justify-center text-xs font-bold transition-all gap-1.5 ${
                  activeTab === 'outgoing'
                    ? 'bg-indigo-500/20 text-indigo-200 shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" /> Sent
              </button>
            </div>

            {/* Content */}
            <div className="metallic-panel flex-1 rounded-2xl p-3 overflow-y-auto min-h-0">
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
                    <RoomInviteList onViewProfile={handleViewProfile} />
                  )}
                  {activeTab === 'outgoing' && (
                    <ChatRequestList
                      requests={outgoingRequests}
                      type="outgoing"
                      onViewProfile={handleViewProfile}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right chat window */}
          <div className="hidden md:flex flex-1 metallic-panel rounded-2xl overflow-hidden relative">
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
                onViewProfile={handleViewProfile}
                isOnline={isOnline}
                otherUser={activeOtherUser}
              />
            ) : (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
                    <MessageCircle className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No conversation selected</p>
                  <p className="text-xs text-slate-600 mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                    Choose a chat from the sidebar or find new users to connect with
                  </p>
                  <button
                    onClick={() => navigate('/discover')}
                    className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all text-xs font-bold border border-indigo-500/20 inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" /> Find Users
                  </button>
                </div>
              </div>
            )}
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
        <div className={`fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeIn px-4 w-full md:w-auto ${
          toast.type === 'error'
            ? 'bg-red-500/20 border-red-500/30 text-red-300'
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
        } flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Messages;
