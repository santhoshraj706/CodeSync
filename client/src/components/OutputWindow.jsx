import React, { useState } from 'react';
import { Terminal, AlertCircle, CheckCircle2, Clock, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

const OutputWindow = ({ output, isExecuting }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isExecuting) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-indigo-400 opacity-90 animate-pulse">
        <div className="relative mb-4">
          <Terminal className="w-12 h-12 text-indigo-500/50 absolute top-0 left-0 animate-ping" />
          <Terminal className="w-12 h-12 relative z-10" />
        </div>
        <p className="font-mono text-sm tracking-widest uppercase">Executing Code...</p>
        <div className="flex gap-1 mt-3">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-70">
        <Terminal className="w-10 h-10 mb-3 text-slate-600" />
        <p className="italic text-[13px] tracking-wide">Click "Run Code" to execute...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 h-full w-full">
      {output.stderr && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl animate-fadeIn overflow-hidden">
          <button onClick={() => toggleSection('stderr')} className="flex items-center justify-between w-full p-3 pb-2 border-b border-red-500/10 hover:bg-red-500/5 transition-colors">
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="font-bold text-xs uppercase tracking-wider">Error</span>
            </div>
            {collapsed.stderr ? <ChevronUp className="w-3.5 h-3.5 text-red-400" /> : <ChevronDown className="w-3.5 h-3.5 text-red-400" />}
          </button>
          {!collapsed.stderr && <pre className="whitespace-pre-wrap text-red-300 text-sm font-mono leading-relaxed p-3 pt-2">{output.stderr}</pre>}
        </div>
      )}
      
      {output.compile_output && !output.stderr && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl animate-fadeIn overflow-hidden">
          <button onClick={() => toggleSection('compile')} className="flex items-center justify-between w-full p-3 pb-2 border-b border-orange-500/10 hover:bg-orange-500/5 transition-colors">
            <div className="flex items-center text-orange-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="font-bold text-xs uppercase tracking-wider">Compile Error</span>
            </div>
            {collapsed.compile ? <ChevronUp className="w-3.5 h-3.5 text-orange-400" /> : <ChevronDown className="w-3.5 h-3.5 text-orange-400" />}
          </button>
          {!collapsed.compile && <pre className="whitespace-pre-wrap text-orange-300 text-sm font-mono leading-relaxed p-3 pt-2">{output.compile_output}</pre>}
        </div>
      )}
      
      {output.stdout && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-fadeIn overflow-hidden">
          <button onClick={() => toggleSection('stdout')} className="flex items-center justify-between w-full p-3 pb-2 border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors">
            <div className="flex items-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span className="font-bold text-xs uppercase tracking-wider">Success Output</span>
            </div>
            {collapsed.stdout ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          {!collapsed.stdout && <pre className="whitespace-pre-wrap text-emerald-300/90 text-sm font-mono leading-relaxed p-3 pt-2">{output.stdout}</pre>}
        </div>
      )}
      
      {!output.stdout && !output.stderr && !output.compile_output && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl animate-fadeIn text-yellow-400/90 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">Program exited with no output.</span>
        </div>
      )}
      
      {(output.time || output.memory) && (
        <div className="mt-auto pt-3 border-t border-white/5 flex gap-4 text-[11px] font-medium text-slate-400 tracking-wider">
          <div className="flex items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Clock className="w-3 h-3 mr-1.5 text-indigo-400" />
            Time: <span className="text-white ml-1">{output.time || '0'}s</span>
          </div>
          <div className="flex items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Cpu className="w-3 h-3 mr-1.5 text-indigo-400" />
            Memory: <span className="text-white ml-1">{output.memory || '0'}KB</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputWindow;
