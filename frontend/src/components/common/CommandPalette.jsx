/**
 * CommandPalette
 * ⌘K / Ctrl+K global command palette — search, navigate, quick-create, AI actions.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, CheckSquare, BarChart2, Settings,
  CalendarDays, Plus, Zap, Sparkles, LogOut, Sun, Moon,
  ArrowRight, Clock, AlertTriangle, CheckCircle2, Hash,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import useTodoStore from '@/hooks/useTodos';
import { PRIORITY_CONFIG, cn } from '@/utils';
import { format, parseISO } from 'date-fns';

// ─── Static commands ──────────────────────────────────────────────────────────
const STATIC_COMMANDS = [
  { id: 'nav-dashboard',  group: 'Navigate', icon: LayoutDashboard, label: 'Go to Dashboard',  shortcut: 'G D', action: 'navigate', to: '/'          },
  { id: 'nav-todos',      group: 'Navigate', icon: CheckSquare,     label: 'Go to My Tasks',   shortcut: 'G T', action: 'navigate', to: '/todos'      },
  { id: 'nav-calendar',   group: 'Navigate', icon: CalendarDays,    label: 'Go to Calendar',   shortcut: 'G C', action: 'navigate', to: '/calendar'   },
  { id: 'nav-analytics',  group: 'Navigate', icon: BarChart2,       label: 'Go to Analytics',  shortcut: 'G A', action: 'navigate', to: '/analytics'  },
  { id: 'nav-settings',   group: 'Navigate', icon: Settings,        label: 'Go to Settings',   shortcut: 'G S', action: 'navigate', to: '/settings'   },
  { id: 'new-task',       group: 'Actions',  icon: Plus,            label: 'Create New Task',  shortcut: 'N',   action: 'new-task'                    },
  { id: 'ai-suggest',     group: 'AI',       icon: Sparkles,        label: 'AI: Suggest Tasks',shortcut: null,  action: 'navigate', to: '/todos?ai=1' },
  { id: 'ai-coach',       group: 'AI',       icon: Zap,             label: 'AI: Get Coaching', shortcut: null,  action: 'navigate', to: '/?coach=1'   },
  { id: 'toggle-theme',   group: 'Actions',  icon: Sun,             label: 'Toggle Dark Mode', shortcut: null,  action: 'theme'                       },
  { id: 'logout',         group: 'Account',  icon: LogOut,          label: 'Sign Out',         shortcut: null,  action: 'logout'                      },
];

const PRIORITY_ICONS = {
  urgent: { icon: AlertTriangle, cls: 'text-red-500' },
  high:   { icon: AlertTriangle, cls: 'text-orange-500' },
  medium: { icon: Clock,         cls: 'text-yellow-500' },
  low:    { icon: CheckCircle2,  cls: 'text-green-500' },
};

export default function CommandPalette({ open, onClose, onNewTask }) {
  const navigate         = useNavigate();
  const { logout }       = useAuth();
  const { toggleTheme, theme } = useTheme();
  const { todos }        = useTodoStore();

  const [query, setQuery]   = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef            = useRef(null);
  const listRef             = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build todo commands from live store
  const todoCommands = useMemo(() =>
    todos.slice(0, 100).map((t) => ({
      id:     `todo-${t._id}`,
      group:  'Tasks',
      icon:   Hash,
      label:  t.title,
      sub:    t.category,
      priority: t.priority,
      status: t.status,
      action: 'navigate',
      to:     '/todos',
    })),
  [todos]);

  // All commands merged
  const allCommands = useMemo(() => [...STATIC_COMMANDS, ...todoCommands], [todoCommands]);

  // Filtered results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allCommands.filter((c) => c.group !== 'Tasks').slice(0, 12);
    return allCommands
      .filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
      .slice(0, 15);
  }, [query, allCommands]);

  // Group results
  const grouped = useMemo(() => {
    const map = {};
    results.forEach((cmd) => {
      if (!map[cmd.group]) map[cmd.group] = [];
      map[cmd.group].push(cmd);
    });
    return map;
  }, [results]);

  // Flat list for keyboard nav
  const flat = useMemo(() => results, [results]);

  // Execute a command
  const execute = useCallback((cmd) => {
    onClose();
    switch (cmd.action) {
      case 'navigate': navigate(cmd.to); break;
      case 'new-task': onNewTask?.(); break;
      case 'theme':    toggleTheme(); break;
      case 'logout':   logout(); navigate('/login'); break;
    }
  }, [navigate, logout, toggleTheme, onClose, onNewTask]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flat[cursor]) execute(flat[cursor]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flat, cursor, execute, onClose]);

  // Scroll cursor into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  // Reset cursor on query change
  useEffect(() => { setCursor(0); }, [query]);

  let flatIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <div className="card shadow-strong overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-border dark:border-dark-border">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, navigate, or run actions…"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 border border-surface-border dark:border-dark-border rounded px-1.5 py-0.5 font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                {flat.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-400">
                    No results for "{query}"
                  </div>
                ) : (
                  Object.entries(grouped).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                        {group}
                      </div>
                      {items.map((cmd) => {
                        const idx      = flatIdx++;
                        const isCursor = idx === cursor;
                        const Icon     = cmd.icon;
                        const priCfg   = cmd.priority ? PRIORITY_ICONS[cmd.priority] : null;

                        return (
                          <button
                            key={cmd.id}
                            data-idx={idx}
                            onClick={() => execute(cmd)}
                            onMouseEnter={() => setCursor(idx)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              isCursor
                                ? 'bg-brand-50 dark:bg-brand-950/30'
                                : 'hover:bg-surface-secondary dark:hover:bg-dark-tertiary'
                            )}
                          >
                            {/* Icon */}
                            <div className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                              isCursor ? 'bg-brand-500 text-white' : 'bg-surface-secondary dark:bg-dark-tertiary text-gray-500 dark:text-gray-400'
                            )}>
                              <Icon size={14} />
                            </div>

                            {/* Label */}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-sm font-medium truncate',
                                isCursor ? 'text-brand-700 dark:text-brand-300' : 'text-gray-800 dark:text-gray-200',
                                cmd.status === 'completed' && 'line-through text-gray-400'
                              )}>
                                {cmd.label}
                              </p>
                              {cmd.sub && (
                                <p className="text-xs text-gray-400 truncate">{cmd.sub}</p>
                              )}
                            </div>

                            {/* Right side: priority badge or shortcut */}
                            {priCfg && (
                              <priCfg.icon size={13} className={cn('shrink-0', priCfg.cls)} />
                            )}
                            {cmd.shortcut && (
                              <kbd className="hidden sm:block text-[10px] text-gray-400 border border-surface-border dark:border-dark-border rounded px-1.5 py-0.5 font-mono shrink-0">
                                {cmd.shortcut}
                              </kbd>
                            )}
                            {isCursor && !cmd.shortcut && !priCfg && (
                              <ArrowRight size={13} className="text-brand-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-surface-border dark:border-dark-border bg-surface-secondary dark:bg-dark-tertiary">
                {[
                  ['↑↓', 'navigate'],
                  ['↵', 'select'],
                  ['esc', 'close'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="text-[10px] text-gray-500 border border-surface-border dark:border-dark-border rounded px-1.5 py-0.5 font-mono bg-white dark:bg-dark-secondary">
                      {key}
                    </kbd>
                    <span className="text-[10px] text-gray-400">{label}</span>
                  </div>
                ))}
                <div className="flex-1" />
                <div className="flex items-center gap-1.5">
                  <Zap size={11} className="text-brand-500" />
                  <span className="text-[10px] text-gray-400 font-medium">TaskFlow</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
