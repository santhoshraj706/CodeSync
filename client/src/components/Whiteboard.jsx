import React, { useRef, useEffect, useState, useContext, useCallback } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Trash2, Pen, Eraser, Undo2, Circle, Square, Minus, Type, FileText, Download, AlertTriangle, Grid, Eye, EyeOff } from 'lucide-react';

const COLORS = [
  '#FFFFFF', '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C42', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA', '#F1948A'
];

const COLOR_NAMES = {
  '#FFFFFF': 'White', '#FF6B6B': 'Red', '#FFE66D': 'Yellow', '#4ECDC4': 'Teal', '#45B7D1': 'Blue',
  '#96CEB4': 'Sage', '#FFEAA7': 'Cream', '#DDA0DD': 'Plum', '#FF8C42': 'Orange', '#98D8C8': 'Mint',
  '#F7DC6F': 'Gold', '#BB8FCE': 'Lavender', '#85C1E9': 'Sky', '#82E0AA': 'Green', '#F1948A': 'Salmon'
};

const BRUSH_SIZES = [2, 4, 6, 10, 16];

// Unified Virtual coordinate space dimensions (16:9 ratio)
const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;

const toVirtualX = (actualX, canvasWidth) => (actualX / canvasWidth) * VIRTUAL_WIDTH;
const toVirtualY = (actualY, canvasHeight) => (actualY / canvasHeight) * VIRTUAL_HEIGHT;
const toActualX = (virtualX, canvasWidth) => (virtualX / VIRTUAL_WIDTH) * canvasWidth;
const toActualY = (virtualY, canvasHeight) => (virtualY / VIRTUAL_HEIGHT) * canvasHeight;

// Helper to check if a color is light or dark (for text contrast on sticky notes)
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1e293b' : '#ffffff';
};

const Whiteboard = ({ roomId, isVisible, sharedStrokesRef }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socket = useContext(SocketContext);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState('pen');
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [shapeStart, setShapeStart] = useState(null);
  const [snapshotData, setSnapshotData] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const localStrokesRef = useRef([]);
  const strokesRef = sharedStrokesRef || localStrokesRef;

  // Track canvas size in state to trigger React re-renders for absolute elements (like Sticky Notes)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Modal Form state for Text tool
  const [textInsertCoords, setTextInsertCoords] = useState(null); // { x, y }
  const [textValue, setTextValue] = useState('');

  // Sticky Notes State
  const [notes, setNotes] = useState([]);

  // Board UI extras
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Compute sticky notes state from whiteboard history
  const rebuildNotesFromHistory = (history) => {
    const activeNotes = {};
    (history || []).forEach((stroke) => {
      if (stroke.type === 'stickynote') {
        const { action, id, x0, y0, text, strokeColor } = stroke;
        if (action === 'create' || action === 'update') {
          activeNotes[id] = {
            id,
            x0: x0 ?? 100,
            y0: y0 ?? 100,
            text: text ?? '',
            color: strokeColor || '#FFE66D'
          };
        } else if (action === 'delete') {
          delete activeNotes[id];
        }
      }
    });
    setNotes(Object.values(activeNotes));
  };

  // Draw a single stroke on the given canvas context (ignores sticky notes on 2D context)
  const drawStroke = (drawData, ctx) => {
    if (!ctx || drawData.type === 'stickynote') return;
    const { type, x0, y0, x1, y1, strokeColor, lineWidth: lw, text } = drawData;

    ctx.save();
    ctx.strokeStyle = strokeColor || '#FFFFFF';
    ctx.lineWidth = lw || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'line' || type === 'pen') {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();
    } else if (type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';
    } else if (type === 'rect') {
      ctx.beginPath();
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    } else if (type === 'circle') {
      const rx = Math.abs(x1 - x0) / 2;
      const ry = Math.abs(y1 - y0) / 2;
      const cx2 = (x0 + x1) / 2;
      const cy2 = (y0 + y1) / 2;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (type === 'straightline') {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    } else if (type === 'text' && text) {
      ctx.fillStyle = strokeColor || '#FFFFFF';
      ctx.font = `${lw * 4 + 12}px 'Inter', sans-serif`;
      ctx.fillText(text, x0, y0);
    }
    ctx.restore();
  };

  // Redraw all strokes from strokesRef
  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    strokesRef.current.forEach((s) => drawStroke(s, ctx));
  };

  // Socket listeners — registered ONCE
  useEffect(() => {
    if (!socket) return;

    const onHistory = (history) => {
      strokesRef.current = history || [];
      rebuildNotesFromHistory(strokesRef.current);
      // Try to redraw if canvas is ready
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        strokesRef.current.forEach((s) => drawStroke(s, ctx));
      }
    };

    const onDraw = ({ drawData }) => {
      strokesRef.current.push(drawData);
      
      // Update sticky notes state directly in response to realtime socket events
      if (drawData.type === 'stickynote') {
        const { action, id, x0, y0, text, strokeColor } = drawData;
        if (action === 'create') {
          setNotes(prev => [...prev, { id, x0, y0, text, color: strokeColor }]);
        } else if (action === 'update') {
          setNotes(prev => prev.map(n => n.id === id ? { ...n, x0: x0 ?? n.x0, y0: y0 ?? n.y0, text: text ?? n.text, color: strokeColor ?? n.color } : n));
        } else if (action === 'delete') {
          setNotes(prev => prev.filter(n => n.id !== id));
        }
      } else {
        const canvas = canvasRef.current;
        if (canvas && canvas.width > 0) {
          drawStroke(drawData, canvas.getContext('2d'));
        }
      }
    };

    const onClear = () => {
      strokesRef.current = [];
      setNotes([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }
      setUndoStack([]);
    };

    socket.on('whiteboard-history', onHistory);
    socket.on('whiteboard-draw', onDraw);
    socket.on('whiteboard-clear', onClear);

    return () => {
      socket.off('whiteboard-history', onHistory);
      socket.off('whiteboard-draw', onDraw);
      socket.off('whiteboard-clear', onClear);
    };
  }, [socket]);

  // Rebuild sticky notes from existing history on mount (crucial for tab switching sync)
  useEffect(() => {
    if (strokesRef.current && strokesRef.current.length > 0) {
      rebuildNotesFromHistory(strokesRef.current);
    }
  }, []);

  // Use ResizeObserver to detect parent panel resize (handles resizable panels & window resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Update state to trigger re-positioning of sticky notes
        setCanvasSize({ width, height });

        // Configure context with scale factor
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.scale(width / VIRTUAL_WIDTH, height / VIRTUAL_HEIGHT);
        contextRef.current = ctx;

        // Redraw all strokes
        redrawAll();
      }
    });

    resizeObserver.observe(canvas.parentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const emitDraw = (drawData) => {
    strokesRef.current.push(drawData);
    socket.emit('whiteboard-draw', { roomId, drawData });
  };

  const saveUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUndoStack(prev => {
      const next = [...prev, canvas.toDataURL()];
      if (next.length > 20) next.shift();
      return next;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    const img = new Image();
    img.onload = () => {
      ctx.save();
      // Reset transform temporarily to draw full background snapshot
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    img.src = prev;
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const actualX = e.clientX - rect.left;
    const actualY = e.clientY - rect.top;
    const virtualX = toVirtualX(actualX, canvasSize.width);
    const virtualY = toVirtualY(actualY, canvasSize.height);

    if (tool === 'text') {
      setTextInsertCoords({ x: virtualX, y: virtualY });
      return;
    }

    if (tool === 'note') {
      const noteId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      const noteColor = color === '#FFFFFF' ? '#FFE66D' : color; // fallback to yellow if color is white
      const defaultText = '';
      
      setNotes(prev => [...prev, { id: noteId, x0: virtualX, y0: virtualY, text: defaultText, color: noteColor }]);
      emitDraw({
        type: 'stickynote',
        action: 'create',
        id: noteId,
        x0: virtualX,
        y0: virtualY,
        text: defaultText,
        strokeColor: noteColor
      });
      return;
    }

    saveUndo();

    if (tool === 'rect' || tool === 'circle' || tool === 'straightline') {
      setShapeStart({ x: virtualX, y: virtualY });
      setSnapshotData(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height));
    }

    setLastPos({ x: virtualX, y: virtualY });
    lastPosRef.current = { x: virtualX, y: virtualY };
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const actualX = e.clientX - rect.left;
    const actualY = e.clientY - rect.top;
    setMousePos({ x: Math.round(actualX), y: Math.round(actualY) });

    if (!isDrawing) return;

    const virtualX = toVirtualX(actualX, canvasSize.width);
    const virtualY = toVirtualY(actualY, canvasSize.height);
    const ctx = contextRef.current;
    if (!ctx) return;

    if (tool === 'pen') {
      const prev = lastPosRef.current;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(virtualX, virtualY);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
      emitDraw({ type: 'pen', x0: prev.x, y0: prev.y, x1: virtualX, y1: virtualY, strokeColor: color, lineWidth: brushSize });
      lastPosRef.current = { x: virtualX, y: virtualY };
      setLastPos({ x: virtualX, y: virtualY });
    } else if (tool === 'eraser') {
      const prev = lastPosRef.current;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 3;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(virtualX, virtualY);
      ctx.stroke();
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      emitDraw({ type: 'eraser', x0: prev.x, y0: prev.y, x1: virtualX, y1: virtualY, strokeColor: color, lineWidth: brushSize * 3 });
      lastPosRef.current = { x: virtualX, y: virtualY };
      setLastPos({ x: virtualX, y: virtualY });
    } else if ((tool === 'rect' || tool === 'circle' || tool === 'straightline') && shapeStart && snapshotData) {
      // Restore previous snapshot first
      const rawCtx = canvas.getContext('2d');
      rawCtx.putImageData(snapshotData, 0, 0);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;

      if (tool === 'rect') {
        ctx.strokeRect(shapeStart.x, shapeStart.y, virtualX - shapeStart.x, virtualY - shapeStart.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(virtualX - shapeStart.x) / 2;
        const ry = Math.abs(virtualY - shapeStart.y) / 2;
        const cx = (shapeStart.x + virtualX) / 2;
        const cy = (shapeStart.y + virtualY) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'straightline') {
        ctx.beginPath();
        ctx.moveTo(shapeStart.x, shapeStart.y);
        ctx.lineTo(virtualX, virtualY);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const actualX = e.clientX - rect.left;
    const actualY = e.clientY - rect.top;
    const virtualX = toVirtualX(actualX, canvasSize.width);
    const virtualY = toVirtualY(actualY, canvasSize.height);

    if ((tool === 'rect' || tool === 'circle' || tool === 'straightline') && shapeStart) {
      emitDraw({
        type: tool,
        x0: shapeStart.x,
        y0: shapeStart.y,
        x1: virtualX,
        y1: virtualY,
        strokeColor: color,
        lineWidth: brushSize
      });
      setShapeStart(null);
      setSnapshotData(null);
    }
    setIsDrawing(false);
  };

  const clearCanvas = (emit = true) => {
    strokesRef.current = [];
    setNotes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }
    setUndoStack([]);
    if (emit && socket) {
      socket.emit('whiteboard-clear', { roomId });
    }
  };

  // Dragging logic for Sticky Notes
  const handleNoteDragStart = (e, noteId) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const actualX0 = toActualX(note.x0, canvasSize.width);
    const actualY0 = toActualY(note.y0, canvasSize.height);

    const startX = e.clientX - actualX0;
    const startY = e.clientY - actualY0;

    const handleMouseMoveNote = (moveEvent) => {
      const actualNewX = moveEvent.clientX - startX;
      const actualNewY = moveEvent.clientY - startY;

      const virtualNewX = toVirtualX(actualNewX, canvasSize.width);
      const virtualNewY = toVirtualY(actualNewY, canvasSize.height);

      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, x0: virtualNewX, y0: virtualNewY } : n));
    };

    const handleMouseUpNote = (upEvent) => {
      document.removeEventListener('mousemove', handleMouseMoveNote);
      document.removeEventListener('mouseup', handleMouseUpNote);

      const actualNewX = upEvent.clientX - startX;
      const actualNewY = upEvent.clientY - startY;

      const virtualNewX = toVirtualX(actualNewX, canvasSize.width);
      const virtualNewY = toVirtualY(actualNewY, canvasSize.height);

      const currentNote = notes.find(n => n.id === noteId);
      if (currentNote) {
        emitDraw({
          type: 'stickynote',
          action: 'update',
          id: noteId,
          x0: virtualNewX,
          y0: virtualNewY,
          text: currentNote.text,
          strokeColor: currentNote.color
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMoveNote);
    document.addEventListener('mouseup', handleMouseUpNote);
  };

  // Sync content edits
  const handleNoteTextChange = (noteId, textVal) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, text: textVal } : n));
    const targetNote = notes.find(n => n.id === noteId);
    if (targetNote) {
      emitDraw({
        type: 'stickynote',
        action: 'update',
        id: noteId,
        x0: targetNote.x0,
        y0: targetNote.y0,
        text: textVal,
        strokeColor: targetNote.color
      });
    }
  };

  // Sync deletion
  const handleNoteDelete = (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    emitDraw({
      type: 'stickynote',
      action: 'delete',
      id: noteId
    });
  };

  // Download entire whiteboard with sticky notes rendered on top
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas matching the current dimensions of the whiteboard
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw dark slate board background
    tempCtx.fillStyle = '#0f111a';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw existing canvas drawings
    tempCtx.drawImage(canvas, 0, 0);

    // Draw sticky notes on top of drawings
    notes.forEach(note => {
      const leftPos = toActualX(note.x0, canvasSize.width);
      const topPos = toActualY(note.y0, canvasSize.height);
      const noteW = 208; // width 52 in tailwind is 13rem = 208px
      const noteH = 130;

      tempCtx.save();
      tempCtx.fillStyle = note.color;

      // Draw rounded card body
      tempCtx.beginPath();
      if (tempCtx.roundRect) {
        tempCtx.roundRect(leftPos, topPos, noteW, noteH, 16);
      } else {
        tempCtx.rect(leftPos, topPos, noteW, noteH);
      }
      tempCtx.fill();

      // Draw header separator line
      tempCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      tempCtx.fillRect(leftPos, topPos + 24, noteW, 1);

      // Draw three tiny binder holes on note header
      tempCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      tempCtx.beginPath();
      tempCtx.arc(leftPos + 16, topPos + 12, 2.5, 0, 2 * Math.PI);
      tempCtx.arc(leftPos + 26, topPos + 12, 2.5, 0, 2 * Math.PI);
      tempCtx.arc(leftPos + 36, topPos + 12, 2.5, 0, 2 * Math.PI);
      tempCtx.fill();

      // Render note text content
      tempCtx.fillStyle = getContrastColor(note.color);
      tempCtx.font = "bold 11px 'Inter', sans-serif";

      const words = (note.text || '').split(' ');
      let line = '';
      let y = topPos + 42;
      const lineHeight = 16;
      const maxWidth = noteW - 24;

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = tempCtx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          tempCtx.fillText(line, leftPos + 12, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      tempCtx.fillText(line, leftPos + 12, y);
      tempCtx.restore();
    });

    // Download image link trigger
    const link = document.createElement('a');
    link.download = `codesync-board-${roomId}-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const ToolButton = ({ icon: Icon, toolName, label }) => (
    <button
      onClick={() => setTool(toolName)}
      className={`p-2.5 rounded-xl transition-all duration-200 ${
        tool === toolName
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110 border border-indigo-400/30'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden rounded-b-2xl">
      
      {/* Absolute layer of Sticky Notes on top of the canvas */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {notes.map((note) => {
          const fontColor = getContrastColor(note.color);
          const leftPos = toActualX(note.x0, canvasSize.width);
          const topPos = toActualY(note.y0, canvasSize.height);

          return (
            <div
              key={note.id}
              style={{
                left: `${leftPos}px`,
                top: `${topPos}px`,
                backgroundColor: note.color,
                color: fontColor
              }}
              className="absolute w-52 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col pointer-events-auto cursor-default animate-fadeIn select-none border border-black/10 group active:scale-[0.99] transition-transform overflow-hidden"
            >
              {/* Pin icon at top center */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,0,0,0.25)" className="drop-shadow-sm">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                </svg>
              </div>

              {/* Header/Dragbar */}
              <div 
                onMouseDown={(e) => handleNoteDragStart(e, note.id)}
                className="h-6 flex items-center justify-between cursor-grab active:cursor-grabbing px-3 pt-2"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-black/25"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-black/25"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-black/25"></span>
                </div>
                <button
                  onClick={() => handleNoteDelete(note.id)}
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-xs opacity-30 hover:opacity-100 hover:bg-black/15 transition-all text-black border-none cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Textarea body */}
              <textarea
                value={note.text}
                onChange={(e) => handleNoteTextChange(note.id, e.target.value)}
                placeholder="Type note content..."
                style={{ color: fontColor }}
                className="w-full h-24 bg-transparent outline-none border-none text-xs font-semibold leading-relaxed resize-none placeholder-black/30 px-3 pb-3 pt-1"
              />
            </div>
          );
        })}
      </div>

      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 glass-panel p-2 rounded-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex-wrap">
        <ToolButton icon={Pen} toolName="pen" label="Pen" />
        <ToolButton icon={Eraser} toolName="eraser" label="Eraser" />
        <ToolButton icon={Minus} toolName="straightline" label="Line" />
        <ToolButton icon={Square} toolName="rect" label="Rectangle" />
        <ToolButton icon={Circle} toolName="circle" label="Circle" />
        <ToolButton icon={Type} toolName="text" label="Text" />
        <ToolButton icon={FileText} toolName="note" label="Sticky Note" />

        <div className="w-px h-8 bg-white/10 mx-2" />

        <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`rounded-full flex items-center justify-center transition-all duration-200 ${
                brushSize === size ? 'ring-2 ring-indigo-400 bg-slate-700 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800 hover:bg-slate-700'
              }`}
              style={{ width: 26, height: 26 }}
              title={`Size ${size}`}
            >
              <span className="rounded-full bg-white shadow-sm" style={{ width: Math.min(size + 2, 16), height: Math.min(size + 2, 16) }} />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <div className="flex items-center gap-1.5 flex-wrap max-w-[200px] bg-black/20 p-1.5 rounded-xl border border-white/5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
              className={`w-6 h-6 rounded-full transition-all duration-300 border-2 ${
                color === c ? 'border-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.5)] z-10' : 'border-transparent hover:scale-110 hover:border-white/50'
              }`}
              style={{ backgroundColor: c }}
              title={`${COLOR_NAMES[c] || c} (${c})`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-slate-500 min-w-[52px]">{color}</span>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <button
          onClick={handleUndo}
          className="p-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:hover:bg-white/5 border border-transparent hover:border-white/10"
          title="Undo"
          disabled={undoStack.length === 0}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleDownload}
          className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-200 border border-emerald-500/20 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] ml-1"
          title="Download Board as PNG"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            notes.forEach(note => {
              emitDraw({ type: 'stickynote', action: 'delete', id: note.id });
            });
            setNotes([]);
          }}
          className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all duration-200 border border-amber-500/20 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] ml-1"
          title="Clear All Sticky Notes"
        >
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><line x1="9" y1="15" x2="15" y2="9"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 border border-red-500/20 hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          title="Clear Entire Board"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={() => setShowGrid(prev => !prev)}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            showGrid
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-transparent hover:border-white/10'
          }`}
          title={showGrid ? 'Hide Grid' : 'Show Grid'}
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      <div className={`absolute inset-0 pointer-events-none ${showGrid ? '' : 'opacity-0'}`}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (isDrawing) handleMouseUp({ nativeEvent: { offsetX: lastPos.x, offsetY: lastPos.y } }); }}
        className={`block touch-none relative z-10 ${tool === 'eraser' ? 'cursor-cell' : tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
      />

      {/* Bottom status bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3 text-[10px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          {tool.charAt(0).toUpperCase() + tool.slice(1)}
        </span>
        <span className="w-px h-3 bg-white/10"></span>
        <span>{strokesRef.current.filter(s => s.type !== 'stickynote').length} strokes</span>
        <span className="w-px h-3 bg-white/10"></span>
        <span className="font-mono">{mousePos.x}, {mousePos.y}</span>
      </div>

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-red-500/20 w-80 flex flex-col gap-4 shadow-2xl bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/15 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Clear Board</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => { clearCanvas(true); setShowClearConfirm(false); }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 border border-red-400/30 rounded-xl text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Dialog Form for entering text */}
      {textInsertCoords && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (textValue.trim()) {
                saveUndo();
                const ctx = contextRef.current;
                if (ctx) {
                  ctx.save();
                  ctx.fillStyle = color;
                  ctx.font = `${brushSize * 4 + 12}px 'Inter', sans-serif`;
                  ctx.fillText(textValue, textInsertCoords.x, textInsertCoords.y);
                  ctx.restore();
                }
                emitDraw({
                  type: 'text',
                  x0: textInsertCoords.x,
                  y0: textInsertCoords.y,
                  x1: 0,
                  y1: 0,
                  strokeColor: color,
                  lineWidth: brushSize,
                  text: textValue
                });
              }
              setTextInsertCoords(null);
              setTextValue('');
            }}
            className="glass-panel p-6 rounded-2xl border border-white/10 w-80 flex flex-col gap-4 shadow-2xl bg-slate-900/90"
          >
            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">Insert Text</h3>
            <input
              type="text"
              autoFocus
              placeholder="Type your text..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setTextInsertCoords(null);
                  setTextValue('');
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/30 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
