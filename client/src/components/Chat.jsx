import { useState, useEffect, useRef, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Send, Smile, MessageSquare, Search, Volume2, VolumeX, Download, ArrowDown, Reply, Edit2, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    
    const playTone = (freq, duration, startTime) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.05, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playTone(587.33, 0.1, now); // D5
    playTone(880, 0.15, now + 0.08); // A5
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};

const Chat = ({ roomId, onMessagesUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (history) => {
      setMessages(history);
    };

    const handleMessage = (msg) => {
      setMessages((prev) => {
        const updated = [...prev, msg];
        onMessagesUpdate?.(updated);
        return updated;
      });
      
      // Play a soft notification chime if message is from another team member
      if (!isMuted && user && msg.username !== user.username) {
        playNotificationSound();
      }
    };

    const handleEditMessage = ({ id, newMessage }) => {
      setMessages((prev) => prev.map(msg => 
        msg.id === id ? { ...msg, message: newMessage, isEdited: true } : msg
      ));
    };

    socket.on('chat-history', handleHistory);
    socket.on('chat-message', handleMessage);
    socket.on('edit-message', handleEditMessage);

    return () => {
      socket.off('chat-history', handleHistory);
      socket.off('chat-message', handleMessage);
      socket.off('edit-message', handleEditMessage);
    };
  }, [socket, user, isMuted, onMessagesUpdate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (editingMessage) {
      socket.emit('edit-message', { roomId, id: editingMessage.id, newMessage: message });
      setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, message, isEdited: true } : m));
      setEditingMessage(null);
    } else {
      const newMsg = {
        roomId,
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        message,
        username: user.username,
        timestamp: new Date().toISOString(),
        replyTo: replyingTo?.id,
        replyToText: replyingTo?.message,
        replyToUser: replyingTo?.username
      };

      // Add message locally immediately for instant feedback
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        onMessagesUpdate?.(updated);
        return updated;
      });

      // Emit to server
      socket.emit('chat-message', newMsg);
      setReplyingTo(null);
    }
    
    setMessage('');
    setShowEmoji(false);
  };

  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  const scrollToLatest = () => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const content = messages.map((msg) => {
      const time = new Date(msg.timestamp).toLocaleString();
      return `[${time}] ${msg.username}: ${msg.message}`;
    }).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codesync-chat-${roomId}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleMessages = messages.filter((msg) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      msg.message?.toLowerCase().includes(query) ||
      msg.username?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Premium Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-wide">Live Discussion</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Sync Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportChat}
            disabled={messages.length === 0}
            className="p-2 rounded-xl border bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:bg-white/5"
            title="Export chat"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/5 bg-slate-950/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/40 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Message Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/20 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-400">
              <MessageSquare className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
              No messages yet. Send a message to start the collaborative discussion.
            </p>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-400">
              <Search className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
              No messages match your search.
            </p>
          </div>
        ) : (
          visibleMessages.map((msg, idx) => {
            const isMe = msg.username === user.username;
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}>
                <div className={`flex items-center gap-1.5 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div 
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-white/10 shrink-0"
                      style={{ background: `linear-gradient(135deg, hsl(${msg.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 55%), hsl(${(msg.username?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360 + 40) % 360}, 70%, 35%))` }}
                    >
                      {msg.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold shrink-0">
                    {isMe ? 'You' : msg.username}
                  </span>
                </div>
                
                {msg.replyTo && (
                  <div className={`flex items-center gap-2 mb-1 opacity-70 text-[10px] ${isMe ? 'mr-2' : 'ml-8'}`}>
                    <Reply className="w-3 h-3 text-slate-400" />
                    <div className="bg-white/5 border border-white/5 rounded-lg px-2 py-1 max-w-[150px] truncate">
                      <span className="font-bold text-indigo-300 mr-1">{msg.replyToUser}:</span>
                      <span className="text-slate-300">{msg.replyToText}</span>
                    </div>
                  </div>
                )}

                <div className="relative group/bubble flex items-center max-w-full">
                  {isMe && (
                    <div className="absolute right-full mr-2 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity pointer-events-none group-hover/bubble:pointer-events-auto">
                      <button onClick={() => { setEditingMessage(msg); setMessage(msg.message); setReplyingTo(null); }} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full shadow-lg border border-white/10 hover:bg-slate-700" title="Edit"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => { setReplyingTo(msg); setEditingMessage(null); }} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full shadow-lg border border-white/10 hover:bg-slate-700" title="Reply"><Reply className="w-3 h-3" /></button>
                    </div>
                  )}

                  <div className={`px-4 py-2.5 rounded-2xl max-w-xs md:max-w-sm lg:max-w-md shadow-lg transition-all duration-300 hover:scale-[1.01] relative ${
                    isMe 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none border border-indigo-400/40 shadow-indigo-500/10' 
                      : 'bg-white/5 backdrop-blur-md text-slate-100 rounded-tl-none border border-white/10 shadow-black/10'
                  }`}>
                    <p className="break-words text-sm leading-relaxed font-normal whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {!isMe && (
                    <div className="absolute left-full ml-2 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity pointer-events-none group-hover/bubble:pointer-events-auto">
                      <button onClick={() => { setReplyingTo(msg); setEditingMessage(null); }} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full shadow-lg border border-white/10 hover:bg-slate-700" title="Reply"><Reply className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[9px] text-slate-500 tracking-tight flex items-center gap-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.isEdited && <span className="italic opacity-70">(edited)</span>}
                  </span>
                  {isMe && (
                    <svg className="w-3 h-3 text-indigo-400 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10 animate-fadeIn bg-[#151b26]">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height="300px" searchDisabled={true} previewConfig={{ showPreview: false }} />
        </div>
      )}

      {/* Typing Indicator & Input Form */}
      <div className="bg-slate-950/60 border-t border-white/10 relative z-40 backdrop-blur-xl">
        {messages.length > 4 && (
          <button
            type="button"
            onClick={scrollToLatest}
            className="absolute -top-12 right-4 bg-slate-900/90 hover:bg-indigo-500 text-slate-300 hover:text-white border border-white/10 hover:border-indigo-400/40 rounded-full p-2 shadow-xl transition-all"
            title="Jump to latest"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
        {message.length > 0 && (
          <div className="absolute -top-6 left-4 flex items-center gap-2 text-[10px] text-indigo-300 font-medium animate-fadeIn">
            <div className="flex space-x-0.5">
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            Typing message...
          </div>
        )}
        {(replyingTo || editingMessage) && (
          <div className="absolute bottom-full left-0 right-0 bg-slate-900/90 border-t border-b border-indigo-500/30 px-4 py-2.5 flex items-center justify-between text-xs animate-fadeIn backdrop-blur-md">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                {replyingTo ? <><Reply className="w-3.5 h-3.5" /> Replying to {replyingTo.username}</> : <><Edit2 className="w-3.5 h-3.5" /> Editing message</>}
              </span>
              <span className="text-slate-300 truncate w-full opacity-80">
                {replyingTo ? replyingTo.message : editingMessage.message}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => { setReplyingTo(null); setEditingMessage(null); setMessage(''); }} 
              className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="p-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="text-slate-400 hover:text-indigo-400 p-2.5 rounded-xl hover:bg-white/5 transition-all border border-white/5 hover:border-indigo-500/20 active:scale-95"
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            className="flex-1 bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none transition-all duration-300 focus:ring-1 focus:ring-indigo-500/30"
            placeholder="Send a message to team..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/30 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            disabled={!message.trim()}
          >
            <Send className="w-4.5 h-4.5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
