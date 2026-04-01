import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Calendar, Tag, Flag, Loader2, AlignLeft, Sparkles } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/utils';
import { cn } from '@/utils';
import { aiService } from '@/services';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['pending', 'in-progress', 'completed'];
const CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Learning', 'Finance'];

const OVERLAY = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const PANEL   = { hidden: { opacity: 0, scale: 0.96, y: 12 }, visible: { opacity: 1, scale: 1, y: 0 } };

// ─── NLP Quick-Parse Bar ──────────────────────────────────────────────────────
function NLPBar({ onParsed }) {
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const parse = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await aiService.parse(input.trim());
      onParsed(res.data.task);
      setDone(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <div className="rounded-xl border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={12} className="text-violet-500" />
        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
          Smart Input — describe your task naturally
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), parse())}
          placeholder={"e.g. \"Call John tomorrow at 3pm high priority\""}
          className="input-field flex-1 text-xs py-2"
        />
        <button
          type="button"
          onClick={parse}
          disabled={loading || !input.trim()}
          className="btn-primary text-xs px-3 py-2 shrink-0"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        </button>
      </div>
      <p className="text-[10px] text-violet-400 dark:text-violet-500 mt-1.5">
        AI will auto-fill title, priority, due date, and category below ↓
      </p>
    </div>
  );
}

export default function TodoForm({ onSubmit, onClose, initial = null, initialData = null }) {
  // support both `initial` (direct) and `initialData` (from TodoItem)
  const data = initial || initialData;
  const isEdit = !!data;

  const [form, setForm] = useState({
    title:       data?.title       ?? '',
    description: data?.description ?? '',
    status:      data?.status      ?? 'pending',
    priority:    data?.priority    ?? 'medium',
    dueDate:     data?.dueDate ? data.dueDate.split('T')[0] : '',
    category:    data?.category    ?? 'General',
    tags:        data?.tags        ?? [],
    subtasks:    data?.subtasks    ?? [],
  });

  const [tagInput, setTagInput]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [aiLoading, setAiLoading]   = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.title.length > 200) e.title = 'Title is too long';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || null,
        subtasks: form.subtasks.filter((s) => s.title.trim()),
        tags: form.tags.filter(Boolean),
      };
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      set('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const addSubtask = () => {
    set('subtasks', [...form.subtasks, { title: '', completed: false }]);
  };

  const updateSubtask = (i, value) => {
    const updated = [...form.subtasks];
    updated[i] = { ...updated[i], title: value };
    set('subtasks', updated);
  };

  const removeSubtask = (i) => {
    set('subtasks', form.subtasks.filter((_, idx) => idx !== i));
  };

  const generateSubtasksWithAI = async () => {
    if (!form.title.trim()) {
      setErrors((e) => ({ ...e, title: 'Add a title first so AI knows what to break down' }));
      return;
    }
    setAiLoading(true);
    try {
      const res = await aiService.subtasks({ title: form.title, description: form.description, count: 5 });
      const aiSubtasks = res.data.subtasks.map((s) => ({ title: s.title, completed: false }));
      set('subtasks', [...form.subtasks, ...aiSubtasks]);
    } catch {
      // silently fail — user can add manually
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <motion.div
      variants={OVERLAY} initial="hidden" animate="visible" exit="hidden"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        variants={PANEL} initial="hidden" animate="visible" exit="hidden"
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-dark-border">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-md">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* ── AI Natural Language Input ── */}
            {!initialData && (
              <NLPBar onParsed={(parsed) => {
                if (parsed.title)       set('title', parsed.title);
                if (parsed.description) set('description', parsed.description);
                if (parsed.priority)    set('priority', parsed.priority);
                if (parsed.category)    set('category', parsed.category);
                if (parsed.dueDate)     set('dueDate', parsed.dueDate);
                if (parsed.tags?.length) set('tags', parsed.tags);
              }} />
            )}

            {/* Title */}
            <div>
              <input
                autoFocus
                type="text"
                placeholder="Task title…"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={cn('input-field text-base font-medium', errors.title && 'border-red-400 focus:ring-red-300')}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="relative">
              <AlignLeft size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <textarea
                rows={3}
                placeholder="Add a description…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="input-field pl-8 resize-none"
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <Flag size={12} /> Priority
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => set('priority', p)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                          form.priority === p
                            ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                            : 'border-surface-border dark:border-dark-border text-gray-500 hover:border-gray-300'
                        )}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="input-field"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className="input-field"
                />
                {form.dueDate && new Date(form.dueDate) < new Date(new Date().toDateString()) && (
                  <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                    ⚠ This date is in the past
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="input-field"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                <Tag size={12} /> Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  className="input-field flex-1"
                />
                <button type="button" onClick={addTag} className="btn-secondary px-3">
                  <Plus size={14} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 pr-1 gap-1"
                    >
                      {tag}
                      <button type="button" onClick={() => set('tags', form.tags.filter((t) => t !== tag))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Subtasks</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateSubtasksWithAI}
                    disabled={aiLoading}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-0.5 disabled:opacity-50"
                  >
                    {aiLoading
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Sparkles size={11} />}
                    AI Generate
                  </button>
                  <span className="text-gray-300 dark:text-dark-border">|</span>
                  <button type="button" onClick={addSubtask} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {form.subtasks.map((sub, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Subtask ${i + 1}`}
                      value={sub.title}
                      onChange={(e) => updateSubtask(i, e.target.value)}
                      className="input-field flex-1 text-sm py-2"
                    />
                    <button type="button" onClick={() => removeSubtask(i)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-surface-border dark:border-dark-border">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary min-w-[100px]">
              {loading ? <Loader2 size={15} className="animate-spin" /> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
