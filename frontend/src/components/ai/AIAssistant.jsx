/**
 * AI Assistant Panel — Premium Redesign
 * Sliding panel with refined tabs: Suggest / Coaching / Prioritize
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, RefreshCw, Plus, Brain, ListOrdered, Loader2,
  AlertTriangle, CheckCircle2, Lightbulb, TrendingUp, TrendingDown,
  Target, ArrowUp, Minus,
} from 'lucide-react';
import { aiService } from '@/services';
import { PRIORITY_CONFIG, cn } from '@/utils';
import useTodoStore from '@/hooks/useTodos';

const TABS = [
  { id: 'suggest',    label: 'Suggest',    icon: Sparkles    },
  { id: 'coaching',   label: 'Coaching',   icon: Brain       },
  { id: 'prioritize', label: 'Prioritize', icon: ListOrdered },
];

const INSIGHT_STYLE = {
  positive: { icon: CheckCircle2, bar: 'bg-emerald-500', bg: 'bg-emerald-500/8 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  warning:  { icon: AlertTriangle, bar: 'bg-amber-500',  bg: 'bg-amber-500/8 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/20'  },
  tip:      { icon: Lightbulb,    bar: 'bg-accent-500',  bg: 'bg-accent-500/8 dark:bg-accent-500/10',   text: 'text-accent-500',                      border: 'border-accent-500/20' },
};

// ─── Shared loading / error states ───────────────────────────────────────────
function Loading({ label = 'AI is thinking…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
          <Sparkles size={18} className="text-accent-500" />
        </div>
        <motion.div className="absolute -inset-1 rounded-xl border-2 border-accent-400 opacity-50"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }} />
      </div>
      <p className="text-sm text-text-muted dark:text-ink-subtle">{label}</p>
    </div>
  );
}

function Empty({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border flex items-center justify-center">
        <Icon size={24} className="text-text-muted dark:text-ink-subtle" />
      </div>
      <div>
        <p className="text-sm font-display font-semibold text-text-primary dark:text-white mb-1">{title}</p>
        <p className="text-xs text-text-secondary dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
      <button onClick={onAction} className="btn-primary text-sm">
        <Sparkles size={14} /> {action}
      </button>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <AlertTriangle size={22} className="text-amber-500" />
      </div>
      <p className="text-sm font-semibold text-text-primary dark:text-white">Couldn't reach AI</p>
      <p className="text-xs text-text-secondary dark:text-gray-400">
        Make sure <code className="font-mono bg-surface-secondary dark:bg-ink-tertiary px-1 py-0.5 rounded text-[11px]">ANTHROPIC_API_KEY</code> is set in <code className="font-mono bg-surface-secondary dark:bg-ink-tertiary px-1 py-0.5 rounded text-[11px]">backend/.env</code>
      </p>
      <button onClick={onRetry} className="btn-secondary text-xs mt-1">
        <RefreshCw size={12} /> Try again
      </button>
    </div>
  );
}

// ─── SUGGEST TAB ─────────────────────────────────────────────────────────────
function SuggestTab({ onAddTask }) {
  const [data, setData]   = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const r = await aiService.suggest();
      setData(r.data.suggestions);
      setStatus('done');
    } catch { setStatus('error'); }
  }, []);

  if (status === 'idle')    return <Empty icon={Sparkles} title="AI Task Suggestions" description="Analyzes your existing tasks and recommends what to add next based on your patterns." action="Generate Suggestions" onAction={load} />;
  if (status === 'loading') return <Loading label="Analyzing your tasks…" />;
  if (status === 'error')   return <ErrorState onRetry={() => setStatus('idle')} />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-mono font-semibold text-text-muted dark:text-ink-subtle uppercase tracking-widest">
          AI Recommendations
        </p>
        <button onClick={() => setStatus('idle')} className="btn-ghost py-1 px-2 text-xs gap-1">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {data?.map((s, i) => {
        const pri = PRIORITY_CONFIG[s.priority] || PRIORITY_CONFIG.medium;
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group card p-3.5 hover:shadow-md dark:hover:shadow-dark-md transition-all duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-text-primary dark:text-white leading-snug flex-1">{s.title}</p>
              <button onClick={() => onAddTask(s)}
                className="shrink-0 w-7 h-7 rounded-lg bg-accent-500/10 text-accent-500 flex items-center justify-center hover:bg-accent-500 hover:text-white transition-all duration-150 opacity-0 group-hover:opacity-100">
                <Plus size={14} />
              </button>
            </div>
            <p className="text-xs text-text-secondary dark:text-gray-400 mb-2.5 line-clamp-2 leading-relaxed">{s.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('badge border text-[10px]', pri.cls)}>{pri.label}</span>
              {s.category && <span className="text-[10px] text-text-muted dark:text-ink-subtle">{s.category}</span>}
              {s.tags?.slice(0,2).map(t => (
                <span key={t} className="text-[10px] text-accent-400 font-mono">#{t}</span>
              ))}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-surface-border dark:border-ink-border">
              <p className="text-[11px] text-text-muted dark:text-ink-subtle italic flex items-start gap-1.5">
                <Lightbulb size={11} className="text-amber-500 shrink-0 mt-0.5" />
                {s.reasoning}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── COACHING TAB ─────────────────────────────────────────────────────────────
function CoachingTab() {
  const [data, setData]     = useState(null);
  const [status, setStatus] = useState('idle');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const r = await aiService.coaching();
      setData(r.data);
      setStatus('done');
    } catch { setStatus('error'); }
  }, []);

  if (status === 'idle')    return <Empty icon={Brain} title="Productivity Coaching" description="Get a personalized score, insights, and your focus goal — powered by Claude AI." action="Analyze My Productivity" onAction={load} />;
  if (status === 'loading') return <Loading label="Generating your report…" />;
  if (status === 'error')   return <ErrorState onRetry={() => setStatus('idle')} />;

  const { coaching, stats } = data;
  const s = coaching.score;
  const scoreColor = s >= 70 ? 'text-emerald-500' : s >= 40 ? 'text-amber-500' : 'text-red-500';
  const barColor   = s >= 70 ? 'bg-emerald-500'   : s >= 40 ? 'bg-amber-500'   : 'bg-red-500';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono font-semibold text-text-muted dark:text-ink-subtle uppercase tracking-widest">Your Report</p>
        <button onClick={() => setStatus('idle')} className="btn-ghost py-1 px-2 text-xs gap-1">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Score */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="card p-5 text-center">
        <div className={cn('font-display font-bold text-5xl mb-1 tracking-tight', scoreColor)}>{s}</div>
        <div className="text-xs text-text-muted dark:text-ink-subtle font-mono uppercase tracking-widest mb-4">Productivity Score</div>
        <div className="h-1.5 bg-surface-border dark:bg-ink-border rounded-full overflow-hidden mb-4">
          <motion.div initial={{ width: 0 }} animate={{ width: `${s}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={cn('h-full rounded-full', barColor)} />
        </div>
        <p className="text-sm font-medium text-text-primary dark:text-white leading-relaxed">{coaching.headline}</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total',   value: stats.total,     color: 'text-text-primary dark:text-white' },
          { label: 'Done',    value: stats.completed,  color: 'text-emerald-500' },
          { label: 'Overdue', value: stats.overdue,    color: stats.overdue > 0 ? 'text-red-500' : 'text-text-primary dark:text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <div className={cn('font-display font-bold text-2xl', color)}>{value}</div>
            <div className="text-[10px] text-text-muted dark:text-ink-subtle mt-0.5 font-mono">{label}</div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="space-y-2">
        {coaching.insights?.map((ins, i) => {
          const cfg  = INSIGHT_STYLE[ins.type] || INSIGHT_STYLE.tip;
          const Icon = cfg.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn('flex gap-3 p-3 rounded-xl border text-xs leading-relaxed', cfg.bg, cfg.border)}>
              <Icon size={13} className={cn('shrink-0 mt-0.5', cfg.text)} />
              <p className="text-text-primary dark:text-white">{ins.text}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Focus + Goal */}
      {coaching.focusSuggestion && (
        <div className="card p-3.5 border-l-2 border-accent-500">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target size={12} className="text-accent-500" />
            <span className="text-[11px] font-semibold text-accent-500 uppercase tracking-wide font-mono">Focus Now</span>
          </div>
          <p className="text-sm text-text-primary dark:text-white leading-relaxed">{coaching.focusSuggestion}</p>
        </div>
      )}
      {coaching.weeklyGoal && (
        <div className="card p-3.5 border-l-2 border-violet-500">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={12} className="text-violet-500" />
            <span className="text-[11px] font-semibold text-violet-500 uppercase tracking-wide font-mono">Weekly Goal</span>
          </div>
          <p className="text-sm text-text-primary dark:text-white leading-relaxed">{coaching.weeklyGoal}</p>
        </div>
      )}
    </div>
  );
}

// ─── PRIORITIZE TAB ───────────────────────────────────────────────────────────
function PrioritizeTab() {
  const [data, setData]     = useState(null);
  const [status, setStatus] = useState('idle');
  const allTodos            = useTodoStore(s => s.todos);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const r = await aiService.prioritize();
      setData(r.data.prioritized);
      setStatus('done');
    } catch { setStatus('error'); }
  }, []);

  if (status === 'idle')    return <Empty icon={ListOrdered} title="Smart Prioritization" description="AI re-ranks your pending tasks using Eisenhower Matrix and GTD principles." action="Prioritize My Tasks" onAction={load} />;
  if (status === 'loading') return <Loading label="Ranking your tasks…" />;
  if (status === 'error')   return <ErrorState onRetry={() => setStatus('idle')} />;

  const ranked = (data || [])
    .map(item => ({ ...item, todo: allTodos.find(t => t._id === item.id) }))
    .filter(item => item.todo);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono font-semibold text-text-muted dark:text-ink-subtle uppercase tracking-widest">AI Priority Order</p>
        <button onClick={() => setStatus('idle')} className="btn-ghost py-1 px-2 text-xs gap-1">
          <RefreshCw size={11} /> Re-rank
        </button>
      </div>

      {ranked.length === 0
        ? <p className="text-sm text-text-muted dark:text-ink-subtle text-center py-10">No pending tasks to rank.</p>
        : ranked.map((item, i) => {
            const todo = item.todo;
            const pri  = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
            const rank = i + 1;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-3.5 flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-sm',
                  rank === 1 ? 'bg-accent-500 text-white shadow-accent' :
                  rank === 2 ? 'bg-accent-500/15 text-accent-500' :
                  rank === 3 ? 'bg-surface-secondary dark:bg-ink-tertiary text-text-secondary dark:text-gray-400' :
                               'bg-surface-secondary dark:bg-ink-tertiary text-text-muted dark:text-ink-subtle text-xs'
                )}>
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary dark:text-white truncate">{todo.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('badge border text-[10px]', pri.cls)}>{pri.label}</span>
                    {item.reason && <span className="text-[11px] text-text-muted dark:text-ink-subtle italic truncate">{item.reason}</span>}
                  </div>
                </div>
                {rank === 1 && <ArrowUp size={14} className="text-accent-500 shrink-0" />}
              </motion.div>
            );
          })
      }
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function AIAssistant({ open, onClose, onAddTask }) {
  const [tab, setTab] = useState('suggest');

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] z-50 flex flex-col bg-white dark:bg-ink-secondary border-l border-surface-border dark:border-ink-border shadow-xl dark:shadow-dark-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-ink-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-violet-500 flex items-center justify-center shadow-accent">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-text-primary dark:text-white leading-none">
                    AI Assistant
                  </p>
                  <p className="text-[10px] text-text-muted dark:text-ink-subtle mt-0.5 font-mono">Powered by Groq · Llama 3</p>
                </div>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white hover:bg-surface-secondary dark:hover:bg-ink-tertiary transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-border dark:border-ink-border shrink-0 px-2 pt-2 gap-1">
              {TABS.map(t => {
                const Icon   = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold transition-all border-b-2',
                      active
                        ? 'text-accent-500 border-accent-500 bg-accent-500/5 dark:bg-accent-500/8'
                        : 'text-text-muted dark:text-ink-subtle border-transparent hover:text-text-primary dark:hover:text-white hover:bg-surface-secondary dark:hover:bg-ink-tertiary'
                    )}>
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {tab === 'suggest'    && <SuggestTab    onAddTask={onAddTask} />}
                  {tab === 'coaching'   && <CoachingTab   />}
                  {tab === 'prioritize' && <PrioritizeTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
