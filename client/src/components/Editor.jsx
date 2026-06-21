import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { SocketContext } from '../context/SocketContext';
import { Wand2, WrapText, Sparkles, Play, Loader2 } from 'lucide-react';
import LineComments from './LineComments';
import './editor-comments.css'; // Add CSS for glyphs

const EditorComponent = ({ roomId, code, setCode, language, setLanguage, theme, showToast, fontSize = 14, onRunCode, isExecuting, onToggleAI, activePresenter, currentUser, codeComments, setCodeComments }) => {
  const socket = useContext(SocketContext);
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [wordWrap, setWordWrap] = useState('on');
  
  // Phase 3: Line Comments
  const [activeCommentLine, setActiveCommentLine] = useState(null);
  const [commentPanelPos, setCommentPanelPos] = useState({ top: 0, left: 0 });
  const decorationsRef = useRef([]);
  
  // Keep track of the latest code value (either received from remote or sent locally)
  const latestCodeRef = useRef(code);

  // Sync latestCodeRef whenever the code prop changes from parent
  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  // Register socket listeners ONCE — no dependency on `code`
  useEffect(() => {
    if (!socket) return;

    const handleCodeSync = ({ code: newCode }) => {
      const targetCode = newCode ?? '';
      if (targetCode !== latestCodeRef.current) {
        latestCodeRef.current = targetCode;
        setCode(targetCode);
      }
    };

    const handleLanguageSync = ({ language: newLang }) => {
      setLanguage(newLang);
    };

    const handleRoomState = ({ code: initCode, language: initLang }) => {
      if (initCode !== undefined && initCode !== null) {
        if (initCode !== latestCodeRef.current) {
          latestCodeRef.current = initCode;
          setCode(initCode);
        }
      }
      if (initLang) setLanguage(initLang);
    };

    socket.on('code-sync', handleCodeSync);
    socket.on('language-sync', handleLanguageSync);
    socket.on('room-state', handleRoomState);

    return () => {
      socket.off('code-sync', handleCodeSync);
      socket.off('language-sync', handleLanguageSync);
      socket.off('room-state', handleRoomState);
    };
  }, [socket, setCode, setLanguage]);

  const handleEditorChange = useCallback((value) => {
    const val = value ?? '';
    // If the value is identical to the last synced/sent code, ignore it (prevents echo loops)
    if (val === latestCodeRef.current) {
      return;
    }

    latestCodeRef.current = val;
    setCode(val);
    
    // Broadcast to other users immediately
    if (socket) {
      socket.emit('code-change', { roomId, code: val });
    }
  }, [socket, roomId, setCode]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    editor.onMouseDown((e) => {
      // MouseTargetType.GUTTER_GLYPH_MARGIN is 2, GUTTER_LINE_NUMBERS is 3
      if (e.target.type === 2 || e.target.type === 3) {
        const line = e.target.position.lineNumber;
        // Position panel near the click
        const top = e.event.posy;
        const left = e.event.posx + 20; // Slightly right of the gutter
        setActiveCommentLine(line);
        setCommentPanelPos({ top, left });
      }
    });
  }, []);

  // Presenter Mode Logic
  useEffect(() => {
    if (!socket || !editorRef.current) return;
    const editor = editorRef.current;

    let cursorListener, scrollListener;

    if (activePresenter === currentUser) {
      // I am presenting -> broadcast my movements
      cursorListener = editor.onDidChangeCursorPosition((e) => {
        socket.emit('presenter-sync', { roomId, cursor: e.position, scroll: editor.getScrollTop() });
      });
      scrollListener = editor.onDidScrollChange((e) => {
        socket.emit('presenter-sync', { roomId, cursor: editor.getPosition(), scroll: e.scrollTop });
      });
    } else if (activePresenter) {
      // Someone else is presenting -> listen to their movements
      const handlePresenterSync = ({ cursor, scroll }) => {
        if (cursor) {
          editor.setPosition(cursor);
          editor.revealPositionInCenter(cursor, 0); // 0 = Smooth scrolling
        }
        if (scroll !== undefined && scroll !== null) {
          editor.setScrollTop(scroll);
        }
      };
      socket.on('presenter-sync', handlePresenterSync);
      
      return () => {
        socket.off('presenter-sync', handlePresenterSync);
      };
    }

    return () => {
      if (cursorListener) cursorListener.dispose();
      if (scrollListener) scrollListener.dispose();
    };
  }, [socket, activePresenter, currentUser, roomId, isEditorReady]);

  // Update decorations when comments change
  useEffect(() => {
    if (!editorRef.current || !codeComments) return;
    const editor = editorRef.current;
    
    // Group comments by line number and filter unresolved
    const linesWithComments = new Set(
      codeComments.filter(c => !c.resolved).map(c => c.lineNumber)
    );

    const newDecorations = Array.from(linesWithComments).map(line => ({
      range: new window.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'comment-glyph-icon',
        glyphMarginHoverMessage: { value: 'Click to view comments' }
      }
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [codeComments, isEditorReady]);

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const toggleWordWrap = () => {
    setWordWrap(prev => prev === 'on' ? 'off' : 'on');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    if (showToast) {
      showToast('Code copied to clipboard!', 'success');
    }
  };

  return (
    <div className="w-full h-full relative group">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language === 'c' || language === 'cpp' ? 'cpp' : language}
        theme={theme || 'vs-dark'}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize,
          wordWrap: wordWrap,
          automaticLayout: true,
          formatOnPaste: true,
          glyphMargin: true,
          lineDecorationsWidth: 10,
        }}
      />
      
      {activeCommentLine !== null && (
        <LineComments
          line={activeCommentLine}
          comments={(codeComments || []).filter(c => c.lineNumber === activeCommentLine)}
          position={commentPanelPos}
          onClose={() => setActiveCommentLine(null)}
          currentUser={currentUser}
          onAddComment={(line, text) => {
            const newComment = { id: Date.now().toString(), lineNumber: line, text, username: currentUser, timestamp: Date.now().toString(), resolved: false, replies: [] };
            setCodeComments(prev => [...prev, newComment]);
            socket.emit('add-code-comment', { roomId, comment: newComment });
          }}
          onResolve={(commentId) => {
            setCodeComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c));
            socket.emit('resolve-code-comment', { roomId, commentId });
          }}
          onReply={(commentId, text) => {
            const reply = { id: Date.now().toString(), text, username: currentUser, timestamp: Date.now().toString() };
            setCodeComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c));
            socket.emit('reply-code-comment', { roomId, commentId, reply });
          }}
        />
      )}

      {/* Floating Action Bar */}
      <div className="absolute bottom-6 right-8 flex items-center space-x-2 opacity-20 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <button
          onClick={copyCode}
          className="bg-emerald-500/80 hover:bg-emerald-500 text-white p-2 rounded-xl backdrop-blur-sm border border-emerald-400/50 shadow-lg transition-all hover:scale-105 group/btn flex items-center"
          title="Copy Code"
        >
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs group-hover/btn:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold">Copy</span>
        </button>
        <button
          onClick={onToggleAI}
          className="bg-purple-500/80 hover:bg-purple-500 text-white p-2 rounded-xl backdrop-blur-sm border border-purple-400/50 shadow-lg transition-all hover:scale-105 group/btn flex items-center"
          title="Toggle AI Assistant"
        >
          <Sparkles className="w-4 h-4" />
          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs group-hover/btn:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold">Ask AI</span>
        </button>
        <button
          onClick={formatCode}
          className="bg-indigo-500/80 hover:bg-indigo-500 text-white p-2 rounded-xl backdrop-blur-sm border border-indigo-400/50 shadow-lg transition-all hover:scale-105 group/btn flex items-center"
          title="Format Code"
        >
          <Wand2 className="w-4 h-4" />
          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs group-hover/btn:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold">Format</span>
        </button>
        <button
          onClick={toggleWordWrap}
          className={`${wordWrap === 'on' ? 'bg-slate-700/80 text-white' : 'bg-slate-800/80 text-slate-400'} hover:bg-slate-600/90 p-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg transition-all hover:scale-105 group/btn flex items-center`}
          title="Toggle Word Wrap"
        >
          <WrapText className="w-4 h-4" />
          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs group-hover/btn:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold">Wrap</span>
        </button>
        <div className="w-px h-6 bg-white/20 mx-1"></div>
        <button
          onClick={onRunCode}
          disabled={isExecuting}
          className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl backdrop-blur-sm border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105 hover:-translate-y-1 group/btn flex items-center disabled:opacity-50 disabled:transform-none"
          title="Run Code"
        >
          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs group-hover/btn:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold">{isExecuting ? 'Running' : 'Run Code'}</span>
        </button>
      </div>
    </div>
  );
};

export default EditorComponent;
