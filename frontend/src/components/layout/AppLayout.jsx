import React, { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, ClipboardList, CalendarRange, BarChart3,
  SlidersHorizontal, LogOut, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, Sparkles, Search, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils';
import CommandPalette from '@/components/common/CommandPalette';
import AIAssistant from '@/components/ai/AIAssistant';
import TodoForm from '@/components/todo/TodoForm';
import { useTodos } from '@/hooks/useTodos';
import { useKeyboard } from '@/hooks/index';

const NAV = [
  { to: '/',          icon: LayoutGrid,    label: 'Dashboard' },
  { to: '/todos',     icon: ClipboardList, label: 'My Tasks'  },
  { to: '/calendar',  icon: CalendarRange, label: 'Calendar'  },
  { to: '/analytics', icon: BarChart3,     label: 'Analytics' },
];

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink to={to} end={to === '/'}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
        'transition-all duration-150 relative group',
        isActive
          ? 'bg-accent-500 text-white shadow-accent'
          : 'text-text-secondary dark:text-gray-400 hover:bg-surface-hover dark:hover:bg-ink-tertiary hover:text-text-primary dark:hover:text-white'
      )}>
      <Icon size={17} strokeWidth={1.8} className="shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {collapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink dark:bg-gray-100 text-white dark:text-ink text-xs font-medium rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { createTodo }         = useTodos();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiOpen, setAiOpen]           = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const navigate = useNavigate();

  useKeyboard('k', () => setPaletteOpen(true), { ctrl: true });

  const handleLogout  = async () => { await logout(); navigate('/login'); };
  const handleNewTask = useCallback(() => { setPaletteOpen(false); setNewTaskOpen(true); }, []);
  const handleAIAdd   = useCallback(async (s) => {
    try { await createTodo({ title: s.title, description: s.description || '', priority: s.priority || 'medium', category: s.category || 'General', tags: s.tags || [] }); }
    catch {}
  }, [createTodo]);

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const Sidebar = (
    <div className="flex flex-col h-full select-none">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-3')}>
        <div className="w-8 h-8 bg-accent-500 rounded-xl flex items-center justify-center shrink-0 shadow-accent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6 11.5L13 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-display font-bold text-lg tracking-tight text-text-primary dark:text-white">
              TaskFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Search bar */}
      {!collapsed && (
        <div className="px-3 mb-3">
          <button onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted dark:text-ink-subtle bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border hover:border-accent-300 dark:hover:border-accent-700 transition-colors group">
            <Search size={13} />
            <span className="flex-1 text-left">Search tasks…</span>
            <span className="flex items-center gap-0.5">
              <kbd className="text-[9px] bg-white dark:bg-ink-secondary border border-surface-border dark:border-ink-border rounded px-1 py-0.5 font-mono text-text-muted dark:text-ink-subtle">⌘</kbd>
              <kbd className="text-[9px] bg-white dark:bg-ink-secondary border border-surface-border dark:border-ink-border rounded px-1 py-0.5 font-mono text-text-muted dark:text-ink-subtle">K</kbd>
            </span>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <p className={cn('px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted dark:text-ink-subtle font-mono', collapsed && 'hidden')}>
          Navigation
        </p>
        {NAV.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}

        <div className="pt-4">
          <p className={cn('px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted dark:text-ink-subtle font-mono', collapsed && 'hidden')}>
            Intelligence
          </p>
          <button onClick={() => setAiOpen(true)}
            className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              'text-violet-500 dark:text-violet-400 hover:bg-violet-500/8 dark:hover:bg-violet-500/10 group relative')}>
            <Sparkles size={17} strokeWidth={1.8} className="shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">AI Assistant</span>
            )}
            {!collapsed && (
              <span className="text-[9px] font-mono bg-violet-500/15 text-violet-500 px-1.5 py-0.5 rounded-md border border-violet-500/20">
                Groq
              </span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink dark:bg-gray-100 text-white dark:text-ink text-xs font-medium rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50">
                AI Assistant
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-3 border-t border-surface-border dark:border-ink-border space-y-0.5">
        <NavLink to="/settings"
          className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive
              ? 'bg-accent-500 text-white shadow-accent'
              : 'text-text-secondary dark:text-gray-400 hover:bg-surface-hover dark:hover:bg-ink-tertiary hover:text-text-primary dark:hover:text-white')}>
          <SlidersHorizontal size={17} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary dark:text-gray-400 hover:bg-surface-hover dark:hover:bg-ink-tertiary hover:text-text-primary dark:hover:text-white transition-all">
          {theme === 'dark'
            ? <Sun size={17} strokeWidth={1.8} className="shrink-0" />
            : <Moon size={17} strokeWidth={1.8} className="shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary dark:text-gray-400 hover:bg-red-500/8 hover:text-red-500 dark:hover:text-red-400 transition-all">
          <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && user && (
          <div className="flex items-center gap-2.5 mt-2 px-3 py-2.5 rounded-xl bg-surface-secondary dark:bg-ink-tertiary border border-surface-border dark:border-ink-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-accent">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary dark:text-white truncate leading-snug">{user.name}</p>
              <p className="text-[10px] text-text-muted dark:text-ink-subtle truncate font-mono">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-secondary dark:bg-ink overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col bg-white dark:bg-ink-secondary border-r border-surface-border dark:border-ink-border shrink-0 overflow-hidden relative">
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute top-5 right-3 p-1.5 rounded-md text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white hover:bg-surface-secondary dark:hover:bg-ink-tertiary transition-all z-10">
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
        {Sidebar}
      </motion.aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-ink-secondary border-r border-surface-border dark:border-ink-border z-50">
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-ink-secondary border-b border-surface-border dark:border-ink-border shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-surface-secondary dark:hover:bg-ink-tertiary transition-colors">
            <Menu size={18} className="text-text-secondary dark:text-gray-400" />
          </button>
          <span className="font-display font-bold text-base text-text-primary dark:text-white">TaskFlow</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPaletteOpen(true)} className="p-2 rounded-lg hover:bg-surface-secondary dark:hover:bg-ink-tertiary">
              <Search size={17} className="text-text-secondary dark:text-gray-400" />
            </button>
            <button onClick={() => setAiOpen(true)} className="p-2 rounded-lg hover:bg-surface-secondary dark:hover:bg-ink-tertiary">
              <Sparkles size={17} className="text-violet-500" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global overlays */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNewTask={handleNewTask} />
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} onAddTask={handleAIAdd} />
      <AnimatePresence>
        {newTaskOpen && (
          <TodoForm
            onSubmit={async (data) => { await createTodo(data); setNewTaskOpen(false); }}
            onClose={() => setNewTaskOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
