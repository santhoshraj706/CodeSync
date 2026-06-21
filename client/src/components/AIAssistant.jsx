import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { Sparkles, Code, Wand2, MessageSquare, FileText, Send, X, ChevronDown, Loader2, Copy, CheckCheck } from 'lucide-react';

const AIAssistant = ({ code, language, chatMessages, onInsertCode, onClose }) => {
  const [activeMode, setActiveMode] = useState('chat'); // chat | explain | fix | generate | summarize
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'ai',
      text: `Hey! 👋 I'm **CodeSync AI**, powered by Gemini. I can help you:\n• **Explain** your current code\n• **Fix** bugs automatically\n• **Generate** code from a description\n• **Summarize** your team chat\n\nJust ask me anything!`
    }
  ]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const modes = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'indigo' },
    { id: 'explain', label: 'Explain', icon: Sparkles, color: 'purple' },
    { id: 'fix', label: 'Fix Code', icon: Wand2, color: 'amber' },
    { id: 'generate', label: 'Generate', icon: Code, color: 'emerald' },
    { id: 'summarize', label: 'Summary', icon: FileText, color: 'blue' },
  ];

  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600 border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
    purple: 'from-purple-500 to-purple-600 border-purple-500/30 bg-purple-500/10 text-purple-400',
    amber: 'from-amber-500 to-amber-600 border-amber-500/30 bg-amber-500/10 text-amber-400',
    emerald: 'from-emerald-500 to-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    blue: 'from-blue-500 to-blue-600 border-blue-500/30 bg-blue-500/10 text-blue-400',
  };

  const handleSend = async () => {
    const trimmed = input.trim();

    let userMessage = trimmed;
    let endpoint = '';
    let payload = {};
    let isAutoAction = false;

    if (activeMode === 'explain') {
      if (!code) return;
      endpoint = '/ai/explain';
      payload = { code, language };
      userMessage = `Explain my ${language} code`;
      isAutoAction = true;
    } else if (activeMode === 'fix') {
      if (!code) return;
      endpoint = '/ai/fix';
      payload = { code, language };
      userMessage = `Fix bugs in my ${language} code`;
      isAutoAction = true;
    } else if (activeMode === 'summarize') {
      if (!chatMessages?.length) return;
      endpoint = '/ai/summarize-chat';
      payload = { messages: chatMessages };
      userMessage = 'Summarize the team chat';
      isAutoAction = true;
    } else if (activeMode === 'generate') {
      if (!trimmed) return;
      endpoint = '/ai/generate';
      payload = { description: trimmed, language };
      userMessage = trimmed;
    } else {
      if (!trimmed) return;
      endpoint = '/ai/chat';
      payload = { message: trimmed, context: code };
      userMessage = trimmed;
    }

    setInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post(endpoint, payload);
      setAiMessages(prev => [...prev, { role: 'ai', text: res.data.result, isCode: activeMode === 'fix' || activeMode === 'generate' }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'ai', text: '⚠️ Sorry, I ran into an error. Please try again.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const extractCode = (text) => {
    const match = text.match(/```[\w]*\n?([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  };

  const renderMessage = (msg, idx) => {
    const isUser = msg.role === 'user';
    const hue = 250;

    // Format AI message: bold **text**, bullet points
    const formatText = (text) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
        .replace(/^•/gm, '<span class="text-indigo-400">•</span>')
        .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
          `<pre class="bg-black/50 border border-white/10 rounded-lg p-3 mt-2 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">${code.trim()}</pre>`
        );
    };

    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none'
            : `bg-white/5 border border-white/10 text-slate-200 rounded-tl-none ${msg.isError ? 'border-red-500/30 bg-red-500/10 text-red-300' : ''}`
        }`}>
          {isUser ? (
            <p className="leading-relaxed">{msg.text}</p>
          ) : (
            <div>
              <div
                className="leading-relaxed space-y-1"
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
              />
              {(msg.isCode) && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyText(extractCode(msg.text), idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-all"
                  >
                    {copiedIdx === idx ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedIdx === idx ? 'Copied!' : 'Copy Code'}
                  </button>
                  {onInsertCode && (
                    <button
                      onClick={() => onInsertCode(extractCode(msg.text))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 hover:text-white transition-all"
                    >
                      <Code className="w-3 h-3" /> Insert to Editor
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeModeMeta = modes.find(m => m.id === activeMode);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">CodeSync AI</h3>
              <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {modes.map(({ id, label, icon: Icon, color }) => {
            const c = colorMap[color];
            const isActive = activeMode === id;
            return (
              <button
                key={id}
                onClick={() => setActiveMode(id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                  isActive
                    ? `bg-gradient-to-r ${c.split(' ')[0]} ${c.split(' ')[1]} text-white border-transparent shadow-md`
                    : `bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10`
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {aiMessages.map((msg, idx) => renderMessage(msg, idx))}
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center">
                <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                <span className="text-slate-400 text-xs italic">Gemini is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-white/3 shrink-0">
        {(activeMode === 'explain' || activeMode === 'fix' || activeMode === 'summarize') ? (
          <button
            onClick={handleSend}
            disabled={isLoading || (activeMode !== 'summarize' && !code) || (activeMode === 'summarize' && !chatMessages?.length)}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <activeModeMeta.icon className="w-4 h-4" />}
            {activeMode === 'explain' && 'Explain My Code'}
            {activeMode === 'fix' && 'Fix Bugs in Code'}
            {activeMode === 'summarize' && 'Summarize Chat'}
          </button>
        ) : (
          <div className="flex gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeMode === 'generate' ? 'Describe the code you want...' : 'Ask me anything about your code...'}
              className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 resize-none outline-none placeholder-slate-500 focus:border-indigo-500/50 focus:bg-white/8 transition-all custom-scrollbar"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/20 self-end shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
