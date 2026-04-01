import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';

const STATUSES   = ['pending', 'in-progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const SORTS      = [
  { value: 'order',     label: 'Custom order' },
  { value: 'createdAt', label: 'Date created' },
  { value: 'dueDate',   label: 'Due date'     },
  { value: 'priority',  label: 'Priority'     },
];

const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
      active
        ? 'bg-brand-500 border-brand-500 text-white'
        : 'border-surface-border dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-700'
    )}
  >
    {children}
  </button>
);

export default function TodoFilters({ filters, onChange, onReset }) {
  const hasFilters = filters.status || filters.priority;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filters</span>
        {hasFilters && (
          <button onClick={onReset} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Status */}
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <FilterChip
              key={s}
              active={filters.status === s}
              onClick={() => onChange({ status: filters.status === s ? '' : s })}
            >
              {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Priority</p>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => (
            <FilterChip
              key={p}
              active={filters.priority === p}
              onClick={() => onChange({ priority: filters.priority === p ? '' : p })}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0">Sort by</p>
        <select
          value={filters.sortBy || 'order'}
          onChange={(e) => onChange({ sortBy: e.target.value })}
          className="input-field text-xs py-1.5 flex-1"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filters.sortOrder || 'asc'}
          onChange={(e) => onChange({ sortOrder: e.target.value })}
          className="input-field text-xs py-1.5 w-28"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
}
