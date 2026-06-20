import React, { useEffect, useRef, useContext } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { SocketContext } from '../context/SocketContext';

const EditorComponent = ({ roomId, code, setCode, language, setLanguage }) => {
  const socket = useContext(SocketContext);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('code-sync', ({ code: newCode }) => {
      // Only update if we aren't currently typing to prevent loops
      if (newCode !== code) {
        setCode(newCode);
      }
    });

    socket.on('language-sync', ({ language: newLang }) => {
      setLanguage(newLang);
    });

    socket.on('room-state', ({ code: initCode, language: initLang }) => {
      if (initCode) setCode(initCode);
      if (initLang) setLanguage(initLang);
    });

    return () => {
      socket.off('code-sync');
      socket.off('language-sync');
      socket.off('room-state');
    };
  }, [socket, code, setCode, setLanguage]);

  const handleEditorChange = (value) => {
    setCode(value);
    // Send to socket
    if (socket) {
      socket.emit('code-change', { roomId, code: value });
    }
  };

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language === 'c' || language === 'cpp' ? 'cpp' : language}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
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
