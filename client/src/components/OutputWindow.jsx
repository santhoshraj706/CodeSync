import React from 'react';
import { Terminal, AlertCircle, CheckCircle2, Clock, Cpu } from 'lucide-react';

const OutputWindow = ({ output }) => {
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
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl animate-fadeIn">
          <div className="flex items-center text-red-400 mb-2 pb-2 border-b border-red-500/10">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="font-bold text-xs uppercase tracking-wider">Error</span>
          </div>
          <pre className="whitespace-pre-wrap text-red-300 text-sm font-mono leading-relaxed">{output.stderr}</pre>
        </div>
      )}
      
      {output.compile_output && !output.stderr && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl animate-fadeIn">
          <div className="flex items-center text-orange-400 mb-2 pb-2 border-b border-orange-500/10">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="font-bold text-xs uppercase tracking-wider">Compile Error</span>
          </div>
          <pre className="whitespace-pre-wrap text-orange-300 text-sm font-mono leading-relaxed">{output.compile_output}</pre>
        </div>
      )}
      
      {output.stdout && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl animate-fadeIn">
          <div className="flex items-center text-emerald-400 mb-2 pb-2 border-b border-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            <span className="font-bold text-xs uppercase tracking-wider">Success Output</span>
          </div>
          <pre className="whitespace-pre-wrap text-emerald-300/90 text-sm font-mono leading-relaxed">{output.stdout}</pre>
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
