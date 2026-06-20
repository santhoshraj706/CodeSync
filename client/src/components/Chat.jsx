import React, { useState, useEffect, useRef, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Send, Smile, MessageSquare, ShieldAlert } from 'lucide-react';
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

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (history) => {
      setMessages(history);
    };

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      
      // Play a soft notification chime if message is from another team member
      if (msg.username !== user.username) {
        playNotificationSound();
      }
    };

    socket.on('chat-history', handleHistory);
    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-history', handleHistory);
      socket.off('chat-message', handleMessage);
    };
  }, [socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      roomId,
      message,
      username: user.username,
      timestamp: new Date().toISOString()
    };

    // Add message locally immediately for instant feedback
    setMessages((prev) => [...prev, { message: newMsg.message, username: newMsg.username, timestamp: newMsg.timestamp }]);

    // Emit to server (server broadcasts to OTHER clients only)
    socket.emit('chat-message', newMsg);
    setMessage('');
    setShowEmoji(false);
  };

  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

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
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-400">
              <MessageSquare className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
              No messages yet. Send a message to start the collaborative discussion.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.username === user.username;
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}>
                <div className={`flex items-center gap-1.5 mb-1.5 px-1`}>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
                    {isMe ? 'You' : msg.username}
                  </span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] shadow-lg transition-all duration-300 hover:scale-[1.01] ${
                  isMe 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none border border-indigo-400/40 shadow-indigo-500/10' 
                    : 'bg-white/5 backdrop-blur-md text-slate-100 rounded-tl-none border border-white/10 shadow-black/10'
                }`}>
                  <p className="break-words text-sm leading-relaxed font-normal">{msg.message}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1 tracking-tight">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10 animate-fadeIn bg-[#151b26]">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height="300px" searchDisabled={true} previewConfig={{ showPreview: false }} />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center relative z-40 gap-2.5 backdrop-blur-xl">
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
          className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/30 active:scale-95"
        >
          <Send className="w-4.5 h-4.5 ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
