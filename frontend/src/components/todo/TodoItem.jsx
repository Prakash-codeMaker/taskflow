import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Pencil, Trash2, CalendarClock, ChevronDown,
  CheckCircle2, Circle, MoreHorizontal, Hash, AlertCircle,
} from 'lucide-react';
import TodoForm from './TodoForm';
import { PRIORITY_CONFIG, formatRelative, cn } from '@/utils';
import { useClickOutside } from '@/hooks/index';

export default function TodoItem({ todo, selected, onSelect, onToggle, onUpdate, onDelete }) {
  const [editing,  setEditing]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useClickOutside(() => setMenuOpen(false));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex:  isDragging ? 999 : undefined,
    opacity: isDragging ? 0.45 : 1,
  };

  const pri         = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
  const isCompleted = todo.status === 'completed';
  const isInProgress= todo.status === 'in-progress';
  const sub         = todo.subtasks || [];
  const doneCount   = sub.filter(s => s.completed).length;
  const overdue     = !isCompleted && todo.dueDate && new Date(todo.dueDate) < new Date() && new Date(todo.dueDate).getFullYear() > 2000;
  const relDate     = formatRelative(todo.dueDate);

  return (
    <>
      <motion.li
        ref={setNodeRef} style={style} layout
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border',
          'bg-white dark:bg-ink-secondary transition-all duration-150',
          selected
            ? 'border-accent-400 dark:border-accent-600 ring-1 ring-accent-400/30'
            : 'border-surface-border dark:border-ink-border hover:border-surface-tertiary dark:hover:border-ink-muted hover:shadow-sm dark:hover:shadow-dark-sm',
          isCompleted && 'opacity-50',
          isDragging  && 'shadow-xl rotate-1 scale-[1.02]',
        )}>

        {/* Drag handle — only shown on hover */}
        <button {...attributes} {...listeners}
          className="shrink-0 text-surface-border dark:text-ink-border hover:text-text-muted dark:hover:text-ink-subtle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none -ml-1">
          <GripVertical size={15} strokeWidth={1.5} />
        </button>

        {/* Bulk checkbox */}
        <input type="checkbox" checked={selected} onChange={onSelect}
          className="shrink-0 w-3.5 h-3.5 rounded accent-accent-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Completion button */}
        <button onClick={onToggle} className="shrink-0 transition-all duration-200 hover:scale-110">
          {isCompleted
            ? <CheckCircle2 size={19} className="text-emerald-500" strokeWidth={2} />
            : isInProgress
            ? <Circle size={19} className="text-blue-400" strokeWidth={2} />
            : <Circle size={19} className="text-surface-border dark:text-ink-border hover:text-accent-400 dark:hover:text-accent-500 transition-colors" strokeWidth={1.8} />
          }
        </button>

        {/* Priority accent bar */}
        <div className={cn('w-0.5 h-9 rounded-full shrink-0', pri.dot, isCompleted && 'opacity-40')} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium text-text-primary dark:text-white leading-snug',
            isCompleted && 'line-through text-text-muted dark:text-ink-subtle',
          )}>
            {todo.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {/* Due date */}
            {relDate && (
              <span className={cn(
                'flex items-center gap-1 text-[11px] font-mono',
                overdue ? 'text-red-500' : 'text-text-muted dark:text-ink-subtle'
              )}>
                {overdue
                  ? <AlertCircle size={10} />
                  : <CalendarClock size={10} />}
                {relDate}
              </span>
            )}

            {/* Category */}
            {todo.category && todo.category !== 'General' && (
              <span className="text-[11px] text-text-muted dark:text-ink-subtle bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border px-1.5 py-px rounded-md">
                {todo.category}
              </span>
            )}

            {/* Tags */}
            {todo.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="flex items-center gap-0.5 text-[11px] text-accent-500 dark:text-accent-400 font-mono">
                <Hash size={9} />{tag}
              </span>
            ))}

            {/* Subtask progress */}
            {sub.length > 0 && (
              <span className="text-[11px] text-text-muted dark:text-ink-subtle font-mono">
                {doneCount}/{sub.length} subtasks
              </span>
            )}
          </div>

          {/* Subtask progress bar */}
          {sub.length > 0 && (
            <div className="mt-2 h-0.5 bg-surface-border dark:bg-ink-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${sub.length ? (doneCount / sub.length) * 100 : 0}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}

          {/* Expanded subtasks */}
          <AnimatePresence>
            {expanded && sub.length > 0 && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                className="mt-2.5 space-y-1.5 overflow-hidden">
                {sub.map(st => (
                  <li key={st._id || st.title} className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-400">
                    <div className={cn('w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                      st.completed ? 'bg-emerald-500 border-emerald-500' : 'border-surface-border dark:border-ink-border')}>
                      {st.completed && (
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                          <path d="M1 3.5L3 5.5L6 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={cn(st.completed && 'line-through text-text-muted dark:text-ink-subtle')}>
                      {st.title}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: priority badge + actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn('badge border text-[10px] hidden sm:inline-flex', pri.cls)}>
            {pri.label}
          </span>

          {/* Expand subtasks */}
          {sub.length > 0 && (
            <button onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white hover:bg-surface-secondary dark:hover:bg-ink-tertiary transition-all opacity-0 group-hover:opacity-100">
              <ChevronDown size={13} strokeWidth={2} className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
            </button>
          )}

          {/* Kebab menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(m => !m)}
              className="p-1.5 rounded-lg text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white hover:bg-surface-secondary dark:hover:bg-ink-tertiary transition-all opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={15} strokeWidth={1.8} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.94, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -4 }} transition={{ duration: 0.12 }}
                  className="absolute right-0 top-9 z-50 w-40 card shadow-xl dark:shadow-dark-lg py-1">
                  <button onClick={() => { setEditing(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-ink-tertiary transition-colors">
                    <Pencil size={13} strokeWidth={1.8} /> Edit task
                  </button>
                  <div className="my-1 border-t border-surface-border dark:border-ink-border" />
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-500/8 transition-colors">
                    <Trash2 size={13} strokeWidth={1.8} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.li>

      {editing && (
        <TodoForm
          initialData={todo}
          onSubmit={async (data) => { await onUpdate(data); setEditing(false); }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
