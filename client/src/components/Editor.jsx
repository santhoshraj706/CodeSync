import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { SocketContext } from '../context/SocketContext';
import { Wand2, WrapText } from 'lucide-react';

const EditorComponent = ({ roomId, code, setCode, language, setLanguage, theme, showToast, fontSize = 14 }) => {
  const socket = useContext(SocketContext);
  const editorRef = useRef(null);
  const [wordWrap, setWordWrap] = useState('on');
  
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

  const handleEditorDidMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

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
        }}
      />
      
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
      </div>
    </div>
  );
};

export default EditorComponent;
