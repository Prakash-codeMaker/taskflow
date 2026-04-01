import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, XCircle, Pencil, Trash2, Calendar, Flag } from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDate, isOverdue, cn } from '@/utils';

const COLUMNS = [
  { key: 'pending',     label: 'To Do',       icon: Circle,       color: 'text-gray-500' },
  { key: 'in-progress', label: 'In Progress',  icon: Clock,        color: 'text-blue-500' },
  { key: 'completed',   label: 'Done',         icon: CheckCircle2, color: 'text-emerald-500' },
  { key: 'cancelled',   label: 'Cancelled',    icon: XCircle,      color: 'text-gray-400' },
];

const BoardCard = ({ todo, onToggle, onUpdate, onDelete }) => {
  const priority = PRIORITY_CONFIG[todo.priority] ?? PRIORITY_CONFIG.medium;
  const overdue  = isOverdue(todo.dueDate, todo.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card p-3 group cursor-pointer hover:shadow-medium transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <button onClick={onToggle} className={cn('mt-0.5 shrink-0', todo.status === 'completed' ? 'text-emerald-500' : 'text-gray-300 hover:text-brand-400')}>
          {todo.status === 'completed' ? <CheckCircle2 size={15} /> : <Circle size={15} />}
        </button>
        <p className={cn('flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug',
          todo.status === 'completed' && 'line-through text-gray-400')}>
          {todo.title}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onUpdate(todo)} className="p-1 text-gray-400 hover:text-brand-500 rounded">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 rounded">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('badge text-[10px]', priority.bg, priority.color)}>
          <Flag size={9} /> {priority.label}
        </span>
        {todo.dueDate && (
          <span className={cn('flex items-center gap-0.5 text-[10px]', overdue ? 'text-red-500' : 'text-gray-400')}>
            <Calendar size={9} /> {formatDate(todo.dueDate)}
          </span>
        )}
      </div>

      {todo.subtaskProgress && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
            <span>Progress</span>
            <span>{todo.subtaskProgress.percentage}%</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-dark-tertiary rounded-full">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${todo.subtaskProgress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function TodoBoardView({ todos, onToggle, onUpdate, onDelete }) {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = todos.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const items = grouped[col.key] || [];
        return (
          <div key={col.key} className="min-w-[220px]">
            <div className="flex items-center gap-1.5 mb-3 px-1">
              <Icon size={14} className={col.color} />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{col.label}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-600 font-mono">{items.length}</span>
            </div>
            <div className="space-y-2 min-h-[120px] p-2 rounded-xl bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border">
              {items.map((todo) => (
                <BoardCard
                  key={todo._id}
                  todo={todo}
                  onToggle={() => onToggle(todo._id)}
                  onUpdate={onUpdate}
                  onDelete={() => onDelete(todo._id)}
                />
              ))}
              {items.length === 0 && (
                <p className="text-center text-xs text-gray-300 dark:text-gray-700 py-6">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
