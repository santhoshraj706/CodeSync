import { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile } from 'lucide-react';

const EmojiPickerButton = ({ onEmojiSelect, disabled = false, className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="Emoji"
      >
        <Smile className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 z-[300]">
          <div className="shadow-2xl rounded-xl overflow-hidden border border-white/10" style={{ maxWidth: '90vw' }}>
            <EmojiPicker
              onEmojiClick={({ emoji }) => {
                onEmojiSelect(emoji);
                setOpen(false);
              }}
              theme="dark"
              searchDisabled={false}
              skinTonesDisabled
              width={320}
              height={380}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
