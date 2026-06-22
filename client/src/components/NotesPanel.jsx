import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import TowerLoader from './TowerLoader';
import { FileText, Plus, X, Check, Edit2, Trash2, Save, RotateCcw, Download, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  { value: 'doing', label: 'Doing', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  { value: 'done', label: 'Done', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
];

const NotesPanel = ({ roomId, socket }) => {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', status: 'todo' });
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${roomId}/notes`);
      setNotes(res.data.notes);
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 404) {
        showToast('Unable to load session notes. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (!socket) return;
    const handleNotesUpdated = (data) => {
      if (data?.notes) {
        setNotes(data.notes);
      }
    };
    socket.on('notes-updated', handleNotesUpdated);
    return () => {
      socket.off('notes-updated', handleNotesUpdated);
    };
  }, [socket]);

  const handleFieldChange = (field, value) => {
    setNotes(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        aim: notes?.aim || '',
        agenda: notes?.agenda || '',
        tasks: notes?.tasks || [],
        expectedResult: notes?.expectedResult || '',
        decisions: notes?.decisions || '',
        pendingWork: notes?.pendingWork || '',
      };
      const res = await api.put(`/rooms/${roomId}/notes`, payload);
      setNotes(res.data.notes);
      showToast('Session notes saved successfully');
    } catch (err) {
      console.error(err);
      showToast('Unable to save session notes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await api.delete(`/rooms/${roomId}/notes`);
      setNotes({
        aim: '',
        agenda: '',
        tasks: [],
        expectedResult: '',
        decisions: '',
        pendingWork: '',
        createdBy: null,
        updatedBy: null,
        createdAt: null,
        updatedAt: null,
      });
      showToast('Session notes reset successfully');
      setResetConfirm(false);
    } catch (err) {
      console.error(err);
      showToast('Unable to reset session notes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      setSaving(true);
      const res = await api.post(`/rooms/${roomId}/notes/tasks`, {
        title: newTask.title.trim(),
        description: newTask.description,
        assignedTo: newTask.assignedTo,
        status: newTask.status,
      });
      setNotes(res.data.notes);
      setNewTask({ title: '', description: '', assignedTo: '', status: 'todo' });
      setTaskFormOpen(false);
      showToast('Task added');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Unable to add task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask.title.trim()) return;
    try {
      setSaving(true);
      const res = await api.put(`/rooms/${roomId}/notes/tasks/${editingTask._id}`, {
        title: editingTask.title.trim(),
        description: editingTask.description,
        assignedTo: editingTask.assignedTo,
        status: editingTask.status,
      });
      setNotes(res.data.notes);
      setEditingTask(null);
      showToast('Task updated');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Unable to update task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const res = await api.patch(`/rooms/${roomId}/notes/tasks/${taskId}/status`, { status });
      setNotes(res.data.notes);
    } catch (err) {
      console.error(err);
      showToast('Unable to update task status', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setSaving(true);
      const res = await api.delete(`/rooms/${roomId}/notes/tasks/${taskId}`);
      setNotes(res.data.notes);
      showToast('Task deleted');
    } catch (err) {
      console.error(err);
      showToast('Unable to delete task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportMarkdown = () => {
    const statusIcon = (s) => s === 'done' ? '[x]' : '[ ]';
    const tasksMd = notes?.tasks?.length
      ? notes.tasks.map(t => `* ${statusIcon(t.status)} ${t.title}${t.assignedTo ? ` - ${t.assignedTo}` : ''}${t.status !== 'todo' ? ` - ${t.status}` : ''}`).join('\n')
      : 'No tasks added yet.';

    const md = `# CodeSync Session Notes\n\n## Aim / Objective\n\n${notes?.aim || 'Not specified'}\n\n## Meeting Agenda\n\n${notes?.agenda || 'Not specified'}\n\n## Tasks\n\n${tasksMd}\n\n## Expected Result\n\n${notes?.expectedResult || 'Not specified'}\n\n## Decisions Taken\n\n${notes?.decisions || 'Not specified'}\n\n## Pending Work / Next Steps\n\n${notes?.pendingWork || 'Not specified'}\n\n## Last Updated\n\n${notes?.updatedAt ? new Date(notes.updatedAt).toLocaleString() : 'Not available'}`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-notes-${roomId}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Notes exported as Markdown');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-[#0c0f1a] rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Session Notes
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <TowerLoader text="Loading notes..." />
        </div>
      </div>
    );
  }

  const renderField = (label, field, placeholder, maxLength) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        <span className={`text-[10px] ${(notes?.[field]?.length || 0) > (maxLength * 0.8) ? 'text-amber-400' : 'text-slate-600'}`}>
          {(notes?.[field]?.length || 0)}/{maxLength}
        </span>
      </div>
      <textarea
        value={notes?.[field] || ''}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            handleFieldChange(field, e.target.value);
          }
        }}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl bg-black/30 border border-white/10 focus:border-indigo-500/40 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
      />
    </div>
  );

  const getStatusColor = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return opt ? opt.color : 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  const statusIcon = (status) => {
    if (status === 'done') return <Check className="w-3 h-3" />;
    if (status === 'doing') return <Loader2 className="w-3 h-3" />;
    return <span className="w-3 h-3 rounded-full border border-slate-500 inline-block" />;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0c0f1a] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          Session Notes
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportMarkdown}
            disabled={!notes}
            className="h-7 px-2.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-all disabled:opacity-30 flex items-center gap-1"
            title="Export as Markdown"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          {resetConfirm ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                disabled={saving}
                className="h-7 px-2.5 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-all"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="h-7 px-2 rounded-lg text-[10px] text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="h-7 px-2.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 bg-white/[0.04] hover:bg-red-500/10 transition-all flex items-center gap-1"
              title="Reset notes"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
        {/* Empty state */}
        {!notes?.aim && !notes?.agenda && !notes?.expectedResult && !notes?.decisions && !notes?.pendingWork && (!notes?.tasks || notes.tasks.length === 0) && (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600/50" />
            <p className="text-sm text-slate-400 font-medium">No session notes yet</p>
            <p className="text-xs text-slate-500 mt-1">Add the aim, tasks, and expected result for this room.</p>
          </div>
        )}

        {/* Collapsible Sections */}
        {[
          { key: 'aim', label: 'Aim / Objective', field: 'aim', placeholder: 'What is the main objective of this session?', maxLen: 1000 },
          { key: 'agenda', label: 'Meeting Agenda', field: 'agenda', placeholder: 'List the topics to cover in order...', maxLen: 1500 },
          { key: 'expectedResult', label: 'Expected Result', field: 'expectedResult', placeholder: 'What outcome do you expect from this session?', maxLen: 1000 },
          { key: 'decisions', label: 'Decisions Taken', field: 'decisions', placeholder: 'Record key decisions made during this session...', maxLen: 1500 },
          { key: 'pendingWork', label: 'Pending Work / Next Steps', field: 'pendingWork', placeholder: 'What still needs to be done after this session?', maxLen: 1500 },
        ].map(({ key, label, field, placeholder, maxLen }) => (
          <div key={key} className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => toggleSection(key)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/[0.02]"
            >
              <span>{label}</span>
              {expandedSections[key] ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            {expandedSections[key] && (
              <div className="px-4 pb-3 pt-1">
                {renderField(label, field, placeholder, maxLen)}
              </div>
            )}
          </div>
        ))}

        {/* Tasks Section */}
        <div className="glass-panel rounded-xl border border-white/[0.06] overflow-hidden">
          <button
            onClick={() => toggleSection('tasks')}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/[0.02]"
          >
            <span>Tasks ({notes?.tasks?.length || 0})</span>
            {expandedSections['tasks'] ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          {expandedSections['tasks'] && (
            <div className="px-4 pb-3 pt-1">
              {/* Task list */}
              {notes?.tasks?.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {notes.tasks.map(task => (
                    <div key={task._id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      {editingTask?._id === task._id ? (
                        /* Edit mode */
                        <div className="space-y-2">
                          <input
                            value={editingTask.title}
                            onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Task title"
                            className="w-full bg-black/30 border border-white/10 focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                          />
                          <input
                            value={editingTask.description}
                            onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description (optional)"
                            className="w-full bg-black/30 border border-white/10 focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              value={editingTask.assignedTo}
                              onChange={(e) => setEditingTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                              placeholder="Assigned to"
                              className="flex-1 bg-black/30 border border-white/10 focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                            />
                            <select
                              value={editingTask.status}
                              onChange={(e) => setEditingTask(prev => ({ ...prev, status: e.target.value }))}
                              className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none"
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
                              ))}
                            </select>
                            <button onClick={handleUpdateTask} disabled={saving || !editingTask.title.trim()} className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all disabled:opacity-30">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingTask(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View mode */
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <button
                                onClick={() => {
                                  const next = task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';
                                  handleUpdateTaskStatus(task._id, next);
                                }}
                                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-all ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : task.status === 'doing' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-slate-500 hover:border-indigo-400'}`}
                                title={`Change status (currently ${task.status})`}
                              >
                                {task.status === 'done' && <Check className="w-2.5 h-2.5" />}
                                {task.status === 'doing' && <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />}
                              </button>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.title}</p>
                                {task.description && <p className="text-[10px] text-slate-500 mt-0.5">{task.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${getStatusColor(task.status)}`}>
                                {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                              </span>
                              <button onClick={() => setEditingTask({ ...task })} className="p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-white/10 transition-all">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteTask(task._id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/10 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {task.assignedTo && (
                            <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                              <span className="text-[9px] text-slate-600">Assigned to:</span>
                              <span className="text-[9px] font-medium text-indigo-400/70 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">{task.assignedTo}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No tasks added yet.</p>
              )}

              {/* Add task button/form */}
              {!taskFormOpen ? (
                <button
                  onClick={() => setTaskFormOpen(true)}
                  className="w-full py-2 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              ) : (
                <div className="bg-white/[0.03] border border-indigo-500/20 rounded-xl p-3 space-y-2">
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title *"
                    className="w-full bg-black/30 border border-white/10 focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                    autoFocus
                  />
                  <input
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="w-full bg-black/30 border border-white/10 focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      value={newTask.assignedTo}
                      onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                      placeholder="Assigned to"
                      className="flex-1 bg-black/30 border border-white/10 focus:border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                      className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAddTask}
                      disabled={saving || !newTask.title.trim()}
                      className="flex-1 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-400/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add Task
                    </button>
                    <button
                      onClick={() => { setTaskFormOpen(false); setNewTask({ title: '', description: '', assignedTo: '', status: 'todo' }); }}
                      className="h-8 px-3 rounded-lg text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold border border-indigo-400/30 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Notes</>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-20 left-4 right-4 z-50 animate-fadeIn">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
