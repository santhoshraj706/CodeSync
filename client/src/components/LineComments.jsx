import React, { useState } from 'react';
import { MessageSquare, X, Send, Check } from 'lucide-react';

const LineComments = ({ line, comments, position, onClose, onAddComment, onResolve, onReply, currentUser }) => {
  const [newText, setNewText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const handleSend = () => {
    if (!newText.trim()) return;
    onAddComment(line, newText);
    setNewText('');
  };

  const handleReply = (commentId) => {
    if (!replyText.trim()) return;
    onReply(commentId, replyText);
    setReplyText('');
    setReplyingTo(null);
  };

  return (
    <div 
      className="absolute z-50 bg-slate-900 border border-white/10 shadow-2xl rounded-xl w-80 flex flex-col overflow-hidden animate-fadeIn"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center text-xs font-bold text-slate-300">
          <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          Line {line} Discussion
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 max-h-60 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-xs text-slate-500 italic text-center py-4">No comments on this line yet.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`p-2.5 rounded-lg border ${c.resolved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-indigo-300">{c.username}</span>
                <span className="text-[9px] text-slate-500">{new Date(parseInt(c.timestamp)).toLocaleTimeString()}</span>
              </div>
              <div className={`text-xs text-slate-300 ${c.resolved ? 'line-through opacity-70' : ''}`}>{c.text}</div>
              
              {!c.resolved && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider">
                    {c.replies?.length > 0 ? `${c.replies.length} Replies` : 'Reply'}
                  </button>
                  <button onClick={() => onResolve(c.id)} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider flex items-center">
                    <Check className="w-3 h-3 mr-1" /> Resolve
                  </button>
                </div>
              )}

              {c.replies && c.replies.length > 0 && (
                <div className="mt-2 pl-2 border-l-2 border-white/10 space-y-2">
                  {c.replies.map(r => (
                    <div key={r.id}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400">{r.username}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">{r.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === c.id && !c.resolved && (
                <div className="mt-2 flex gap-1 animate-fadeIn">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(c.id)}
                    placeholder="Type reply..."
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button onClick={() => handleReply(c.id)} className="bg-indigo-500/20 text-indigo-300 p-1 rounded hover:bg-indigo-500/40">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Add a comment..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleSend}
            disabled={!newText.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineComments;
