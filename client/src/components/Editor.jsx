import React, { useEffect, useRef, useContext, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { SocketContext } from '../context/SocketContext';

const EditorComponent = ({ roomId, code, setCode, language, setLanguage }) => {
  const socket = useContext(SocketContext);
  const editorRef = useRef(null);
  
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

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language === 'c' || language === 'cpp' ? 'cpp' : language}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default EditorComponent;
