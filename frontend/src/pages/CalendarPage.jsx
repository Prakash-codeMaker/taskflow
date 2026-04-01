/**
 * CalendarPage — Premium redesign
 * Clean white/dark cells, visible grid, rich task pills, smooth interactions
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Circle, Dot } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isToday, isPast,
  parseISO, addMonths, subMonths, addWeeks, subWeeks,
  startOfWeek as sowFn, endOfWeek as eowFn,
} from 'date-fns';
import { useTodos } from '@/hooks/useTodos';
import { PRIORITY_CONFIG, cn } from '@/utils';
import TodoForm from '@/components/todo/TodoForm';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_PILL = {
  urgent: 'bg-red-500/15 text-red-500 border-red-500/25',
  high:   'bg-orange-500/15 text-orange-500 border-orange-500/25',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
  low:    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
};

const DOT_COLOR = {
  urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-emerald-500',
};

// ─── Task Pill inside day cell ────────────────────────────────────────────────
function TaskPill({ todo, onClick }) {
  const done   = todo.status === 'completed';
  const over   = !done && todo.dueDate && isPast(parseISO(todo.dueDate));
  const pillCls = done
    ? 'bg-surface-border dark:bg-ink-border text-text-muted dark:text-ink-subtle line-through border-transparent'
    : over
    ? 'bg-red-500/12 text-red-500 border-red-500/25'
    : PRIORITY_PILL[todo.priority] || PRIORITY_PILL.medium;

  return (
    <button onClick={e => { e.stopPropagation(); onClick(todo); }}
      title={todo.title}
      className={cn(
        'w-full text-left px-2 py-0.5 rounded-md text-[11px] font-medium border truncate',
        'transition-opacity hover:opacity-75 leading-5',
        pillCls
      )}>
      {todo.title}
    </button>
  );
}

// ─── Month Day Cell ───────────────────────────────────────────────────────────
function DayCell({ date, todos, isCurrentMonth, onDayClick, onTaskClick }) {
  const today   = isToday(date);
  const MAX     = 3;
  const visible = todos.slice(0, MAX);
  const more    = todos.length - MAX;

  return (
    <div onClick={() => onDayClick(date)}
      className={cn(
        'relative flex flex-col p-2 border-b border-r border-surface-border dark:border-ink-border',
        'cursor-pointer transition-colors duration-100 min-h-[100px]',
        isCurrentMonth
          ? 'bg-white dark:bg-ink-secondary hover:bg-surface-secondary dark:hover:bg-ink-tertiary'
          : 'bg-surface-secondary dark:bg-ink opacity-40',
        today && 'bg-accent-500/5 dark:bg-accent-500/8 hover:bg-accent-500/8 dark:hover:bg-accent-500/12',
      )}>

      {/* Date number */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn(
          'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold font-mono',
          today
            ? 'bg-accent-500 text-white shadow-accent'
            : 'text-text-secondary dark:text-gray-400'
        )}>
          {format(date, 'd')}
        </span>
        {todos.length > 0 && (
          <span className="text-[9px] font-mono text-text-muted dark:text-ink-subtle">{todos.length}</span>
        )}
      </div>

      {/* Task pills */}
      <div className="space-y-0.5 flex-1">
        {visible.map(t => (
          <TaskPill key={t._id} todo={t} onClick={onTaskClick} />
        ))}
        {more > 0 && (
          <p className="text-[10px] text-text-muted dark:text-ink-subtle pl-1 font-medium">+{more} more</p>
        )}
      </div>

      {/* Hover "add" hint */}
      {todos.length === 0 && isCurrentMonth && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Plus size={16} className="text-text-muted dark:text-ink-subtle" />
        </div>
      )}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ currentDate, todos, onDayClick, onTaskClick }) {
  const days = eachDayOfInterval({ start: sowFn(currentDate), end: eowFn(currentDate) });

  const byDay = useMemo(() => {
    const map = {};
    days.forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      map[key] = todos.filter(t => {
        if (!t.dueDate) return false;
        try { return isSameDay(parseISO(t.dueDate), d); } catch { return false; }
      });
    });
    return map;
  }, [days, todos]);

  return (
    <div className="flex-1 overflow-auto">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b border-surface-border dark:border-ink-border sticky top-0 z-10 bg-white dark:bg-ink-secondary">
        {days.map(day => (
          <div key={day.toString()}
            className={cn('py-3 text-center border-r border-surface-border dark:border-ink-border last:border-r-0',
              isToday(day) && 'bg-accent-500/8 dark:bg-accent-500/10')}>
            <p className="text-[10px] uppercase tracking-widest text-text-muted dark:text-ink-subtle font-mono mb-0.5">
              {format(day, 'EEE')}
            </p>
            <div className={cn(
              'text-sm font-display font-semibold mx-auto w-7 h-7 flex items-center justify-center rounded-full',
              isToday(day)
                ? 'bg-accent-500 text-white shadow-accent'
                : 'text-text-primary dark:text-white'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Task columns */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTodos = byDay[key] || [];
          return (
            <div key={day.toString()} onClick={() => onDayClick(day)}
              className={cn(
                'border-r border-b border-surface-border dark:border-ink-border last:border-r-0',
                'p-2 min-h-[220px] cursor-pointer transition-colors',
                'hover:bg-surface-secondary dark:hover:bg-ink-tertiary',
                isToday(day) && 'bg-accent-500/5 dark:bg-accent-500/8'
              )}>
              <div className="space-y-1">
                {dayTodos.map(t => (
                  <TaskPill key={t._id} todo={t} onClick={onTaskClick} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [view, setView]           = useState('month');
  const [current, setCurrent]     = useState(new Date());
  const [showForm, setShowForm]   = useState(false);
  const [formDefaults, setFormDef]= useState({});
  const [editTodo, setEditTodo]   = useState(null);

  const { todos, fetchTodos, createTodo, updateTodo } = useTodos();

  useEffect(() => { fetchTodos({ limit: 300 }); }, []);

  // Build date → todos map
  const byDate = useMemo(() => {
    const map = {};
    todos.forEach(t => {
      if (!t.dueDate) return;
      try {
        const k = format(parseISO(t.dueDate), 'yyyy-MM-dd');
        (map[k] = map[k] || []).push(t);
      } catch {}
    });
    return map;
  }, [todos]);

  // Calendar grid for month view
  const calDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(current)),
      end:   endOfWeek(endOfMonth(current)),
    });
  }, [current]);

  const nav = (dir) => {
    if (view === 'month') setCurrent(dir === 'next' ? addMonths(current, 1) : subMonths(current, 1));
    else                  setCurrent(dir === 'next' ? addWeeks(current, 1)  : subWeeks(current, 1));
  };

  const handleDayClick = useCallback((date) => {
    setEditTodo(null);
    setFormDef({ dueDate: format(date, 'yyyy-MM-dd') });
    setShowForm(true);
  }, []);

  const handleTaskClick = useCallback((todo) => {
    setEditTodo(todo);
    setFormDef({});
    setShowForm(true);
  }, []);

  const label = view === 'month'
    ? format(current, 'MMMM yyyy')
    : `${format(sowFn(current), 'MMM d')} – ${format(eowFn(current), 'MMM d, yyyy')}`;

  // Stats
  const stats = useMemo(() => {
    const visible = view === 'month'
      ? calDays.filter(d => isSameMonth(d, current)).flatMap(d => byDate[format(d, 'yyyy-MM-dd')] || [])
      : eachDayOfInterval({ start: sowFn(current), end: eowFn(current) }).flatMap(d => byDate[format(d, 'yyyy-MM-dd')] || []);
    return {
      total:   visible.length,
      done:    visible.filter(t => t.status === 'completed').length,
      overdue: visible.filter(t => t.dueDate && !isSameDay(parseISO(t.dueDate), new Date()) && isPast(parseISO(t.dueDate)) && t.status !== 'completed').length,
    };
  }, [calDays, current, byDate, view]);

  const unscheduled = useMemo(() => todos.filter(t => !t.dueDate && t.status !== 'completed'), [todos]);

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-surface-secondary dark:bg-ink">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-ink-secondary border-b border-surface-border dark:border-ink-border shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <CalendarDays size={16} className="text-accent-500" />
            <h1 className="font-display font-bold text-lg text-text-primary dark:text-white">Calendar</h1>
          </div>
          <p className="text-xs text-text-muted dark:text-ink-subtle font-mono">
            {stats.total} tasks · {stats.done} done
            {stats.overdue > 0 && <span className="text-red-500"> · {stats.overdue} overdue</span>}
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border rounded-lg p-0.5">
          {['month', 'week'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all duration-150',
                view === v
                  ? 'bg-white dark:bg-ink-secondary text-text-primary dark:text-white shadow-xs'
                  : 'text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white')}>
              {v}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1 bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border rounded-lg p-0.5">
          <button onClick={() => nav('prev')}
            className="p-1.5 rounded-md text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white hover:bg-white dark:hover:bg-ink-secondary transition-all">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 text-xs font-semibold rounded-md text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white hover:bg-white dark:hover:bg-ink-secondary transition-all">
            Today
          </button>
          <button onClick={() => nav('next')}
            className="p-1.5 rounded-md text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white hover:bg-white dark:hover:bg-ink-secondary transition-all">
            <ChevronRight size={15} />
          </button>
        </div>

        <span className="font-display font-bold text-base text-text-primary dark:text-white min-w-[160px] text-center">
          {label}
        </span>

        <button onClick={() => { setEditTodo(null); setFormDef({}); setShowForm(true); }}
          className="btn-primary text-sm">
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 px-6 py-2 bg-surface-secondary dark:bg-ink-tertiary border-b border-surface-border dark:border-ink-border shrink-0">
        {[
          { label: 'Urgent',    dot: 'bg-red-500'     },
          { label: 'High',      dot: 'bg-orange-500'  },
          { label: 'Medium',    dot: 'bg-amber-500'   },
          { label: 'Low',       dot: 'bg-emerald-500' },
          { label: 'Overdue',   dot: 'bg-red-400 opacity-50'  },
          { label: 'Completed', dot: 'bg-surface-border dark:bg-ink-border' },
        ].map(({ label, dot }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
            <span className="text-[11px] text-text-muted dark:text-ink-subtle">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Calendar body ── */}
      <div className="flex-1 overflow-auto min-h-0">
        {view === 'month' ? (
          <div className="min-w-[640px] h-full flex flex-col">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-surface-border dark:border-ink-border bg-white dark:bg-ink-secondary sticky top-0 z-10">
              {WEEK_DAYS.map(d => (
                <div key={d} className="py-2.5 text-center border-r border-surface-border dark:border-ink-border last:border-r-0">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted dark:text-ink-subtle font-mono">{d}</span>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 flex-1">
              {calDays.map(day => (
                <DayCell
                  key={day.toString()}
                  date={day}
                  todos={byDate[format(day, 'yyyy-MM-dd')] || []}
                  isCurrentMonth={isSameMonth(day, current)}
                  onDayClick={handleDayClick}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
          </div>
        ) : (
          <WeekView
            currentDate={current}
            todos={todos}
            onDayClick={handleDayClick}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* ── Unscheduled strip ── */}
      {unscheduled.length > 0 && (
        <div className="shrink-0 border-t border-surface-border dark:border-ink-border bg-white dark:bg-ink-secondary px-6 py-3">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono font-semibold text-text-muted dark:text-ink-subtle uppercase tracking-widest whitespace-nowrap">
              No due date ({unscheduled.length})
            </span>
            <div className="w-px h-4 bg-surface-border dark:bg-ink-border shrink-0" />
            {unscheduled.slice(0, 10).map(t => {
              const pri = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
              return (
                <button key={t._id} onClick={() => handleTaskClick(t)}
                  className={cn('badge border whitespace-nowrap text-[11px] hover:opacity-80 transition-opacity', pri.cls)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', pri.dot)} />
                  {t.title.length > 28 ? t.title.slice(0, 28) + '…' : t.title}
                </button>
              );
            })}
            {unscheduled.length > 10 && (
              <span className="text-[11px] text-text-muted dark:text-ink-subtle whitespace-nowrap font-mono">
                +{unscheduled.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Form modal ── */}
      <AnimatePresence>
        {showForm && (
          <TodoForm
            initialData={editTodo}
            initial={formDefaults}
            onSubmit={async (data) => {
              if (editTodo) await updateTodo(editTodo._id, data);
              else await createTodo(data);
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
