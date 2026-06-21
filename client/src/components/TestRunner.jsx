import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, Trash2, Plus, Terminal, RefreshCw, Layers } from 'lucide-react';
import api from '../utils/api';

const TestRunner = ({ code, language, roomId, testCases, setTestCases, runHistory, setRunHistory, socket, showToast }) => {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'history'
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [localOutputs, setLocalOutputs] = useState({});

  const addTestCase = () => {
    const newTest = { id: Date.now().toString(), input: '', expectedOutput: '' };
    const updated = [...testCases, newTest];
    setTestCases(updated);
    socket.emit('save-test-cases', { roomId, testCases: updated });
  };

  const removeTestCase = (id) => {
    const updated = testCases.filter(t => t.id !== id);
    setTestCases(updated);
    socket.emit('save-test-cases', { roomId, testCases: updated });
  };

  const updateTestCase = (id, field, value) => {
    const updated = testCases.map(t => t.id === id ? { ...t, [field]: value } : t);
    setTestCases(updated);
    // Debounce this in a real app, but for now we emit immediately on blur or let user click "Save"
    socket.emit('save-test-cases', { roomId, testCases: updated });
  };

  const runAllTests = async () => {
    if (testCases.length === 0) return showToast('No test cases to run.', 'error');
    setIsRunningAll(true);
    setLocalOutputs({});
    
    let passedCount = 0;
    const results = [];

    for (const test of testCases) {
      try {
        const res = await api.post('/execute/run-code', {
          source_code: code,
          language,
          stdin: test.input
        });
        
        const stdout = (res.data.stdout || '').trim();
        const expected = (test.expectedOutput || '').trim();
        const passed = !res.data.stderr && !res.data.compile_output && stdout === expected;
        
        if (passed) passedCount++;
        
        const resultObj = {
          testId: test.id,
          passed,
          actual: stdout,
          stderr: res.data.stderr || res.data.compile_output,
          time: res.data.time,
          memory: res.data.memory
        };
        results.push(resultObj);
        
        setLocalOutputs(prev => ({ ...prev, [test.id]: resultObj }));
      } catch (err) {
        const resultObj = { testId: test.id, passed: false, stderr: 'Execution Failed', actual: '' };
        results.push(resultObj);
        setLocalOutputs(prev => ({ ...prev, [test.id]: resultObj }));
      }
    }

    const runResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      code,
      language,
      passedCount,
      totalCount: testCases.length,
      results
    };

    setRunHistory(prev => [runResult, ...prev].slice(0, 20));
    socket.emit('add-run-history', { roomId, runResult });
    
    setIsRunningAll(false);
    if (passedCount === testCases.length) {
      showToast('All Test Cases Passed! 🎉', 'success');
    } else {
      showToast(`${passedCount}/${testCases.length} Passed.`, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0f111a] overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-4 py-2 shrink-0">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${activeTab === 'tests' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Test Cases
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Clock className="w-3.5 h-3.5" /> Run History
          </button>
        </div>
        
        {activeTab === 'tests' && (
          <button
            onClick={runAllTests}
            disabled={isRunningAll || testCases.length === 0}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            {isRunningAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunningAll ? 'Running...' : 'Run All Tests'}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {activeTab === 'tests' ? (
          <>
            {testCases.map((tc, index) => (
              <div key={tc.id} className="bg-white/5 border border-white/10 rounded-xl p-3 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Test Case {index + 1}</div>
                  <div className="flex items-center gap-2">
                    {localOutputs[tc.id] && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${localOutputs[tc.id].passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {localOutputs[tc.id].passed ? 'Passed' : 'Failed'}
                      </span>
                    )}
                    <button onClick={() => removeTestCase(tc.id)} className="text-slate-500 hover:text-red-400 transition-colors bg-black/20 p-1.5 rounded-lg border border-transparent hover:border-red-500/30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Input (stdin)</label>
                    <textarea 
                      value={tc.input}
                      onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                      onBlur={() => socket.emit('save-test-cases', { roomId, testCases })}
                      className="w-full h-16 bg-black/40 border border-white/5 rounded-lg p-2 text-xs font-mono text-slate-300 resize-none outline-none focus:border-indigo-500/50"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Expected Output</label>
                    <textarea 
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                      onBlur={() => socket.emit('save-test-cases', { roomId, testCases })}
                      className="w-full h-16 bg-black/40 border border-white/5 rounded-lg p-2 text-xs font-mono text-slate-300 resize-none outline-none focus:border-indigo-500/50"
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>
                {/* Result Display */}
                {localOutputs[tc.id] && !localOutputs[tc.id].passed && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <div className="text-[10px] text-red-300 font-bold mb-1 uppercase tracking-widest">Actual Output:</div>
                    <pre className="text-xs font-mono text-red-200 whitespace-pre-wrap">{localOutputs[tc.id].actual || localOutputs[tc.id].stderr}</pre>
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={addTestCase}
              className="w-full py-3 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Add Test Case
            </button>
          </>
        ) : (
          <div className="space-y-3">
            {runHistory.length === 0 ? (
              <div className="text-center text-slate-500 mt-10 text-sm italic">No run history available.</div>
            ) : (
              runHistory.map((run, i) => (
                <div key={run.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">Run #{runHistory.length - i}</span>
                      <span className="text-[10px] text-slate-400 bg-white/10 px-2 py-0.5 rounded-full font-mono uppercase border border-white/5">{run.language}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{new Date(run.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${run.passedCount === run.totalCount && run.totalCount > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {run.passedCount} / {run.totalCount} Passed
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRunner;
