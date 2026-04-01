import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Inbox } from 'lucide-react';

export default function EmptyState({ onAdd, hasFilters }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border flex items-center justify-center mb-4">
        {hasFilters
          ? <Search size={22} className="text-text-muted dark:text-ink-subtle" />
          : <Inbox size={22} className="text-text-muted dark:text-ink-subtle" />}
      </div>
      <h3 className="font-display font-semibold text-base text-text-primary dark:text-white mb-1.5">
        {hasFilters ? 'No matching tasks' : 'No tasks yet'}
      </h3>
      <p className="text-sm text-text-secondary dark:text-gray-400 max-w-xs mb-6">
        {hasFilters
          ? 'Try clearing your filters to see all tasks.'
          : 'Create your first task and start being productive today.'}
      </p>
      {!hasFilters && (
        <button onClick={onAdd} className="btn-primary text-sm">
          <Plus size={15} /> Create Task
        </button>
      )}
    </motion.div>
  );
}
