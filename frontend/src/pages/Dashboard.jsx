import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Plus, ArrowRight, CircleDot, Zap, Target, Flame, BarChart3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService, analyticsService } from '@/services';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatRelative, cn } from '@/utils';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item:      { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16,1,0.3,1] } } },
};

function StatCard({ icon: Icon, label, value, sub, accent = false, trend }) {
  return (
    <motion.div variants={stagger.item}
      className={cn('card p-5 relative overflow-hidden group hover:shadow-md dark:hover:shadow-dark-md transition-all duration-200',
        accent && 'border-accent-200 dark:border-accent-800/50')}>
      {accent && <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent pointer-events-none" />}
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', accent ? 'bg-accent-500/12' : 'bg-surface-secondary dark:bg-ink-tertiary')}>
          <Icon size={16} className={accent ? 'text-accent-500' : 'text-text-muted dark:text-gray-400'} />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-text-primary dark:text-white leading-none mb-1">{value}</p>
      <p className="text-xs text-text-secondary dark:text-gray-400">{label}</p>
      {sub && <p className="text-[11px] text-text-muted dark:text-ink-subtle mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user }      = useAuth();
  const [dash, setDash]  = useState(null);
  const [prod, setProd]  = useState(null);
  const [loading, setL]  = useState(true);

  useEffect(() => {
    Promise.all([userService.getDashboard(), analyticsService.getProductivity()])
      .then(([d, p]) => { setDash(d.data); setProd(p.data); })
      .catch(console.error)
      .finally(() => setL(false));
  }, []);

  const stats = dash?.stats || {};
  const rate  = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const first = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-semibold text-text-muted dark:text-ink-subtle uppercase tracking-widest mb-1 font-mono">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display font-bold text-3xl text-text-primary dark:text-white">
          {greeting()}, {first}.
        </h1>
        <p className="text-text-secondary dark:text-gray-400 mt-1 text-sm">
          {rate > 70 ? "You're crushing it today." : rate > 40 ? "Keep the momentum going." : "Let's make today count."}
        </p>
      </motion.div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger.container} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Target}       label="Total Tasks"    value={stats.total ?? 0}      accent />
          <StatCard icon={CheckCircle2} label="Completed"      value={stats.completed ?? 0}  sub={`${rate}% completion`} />
          <StatCard icon={Clock}        label="In Progress"    value={stats.inProgress ?? 0} />
          <StatCard icon={Zap}          label="This Week"      value={prod?.thisWeek ?? 0}
            trend={prod?.trend} sub="tasks completed" />
        </motion.div>
      )}

      {/* Progress bar */}
      {!loading && stats.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-orange-500" />
              <span className="text-sm font-semibold text-text-primary dark:text-white font-display">Overall Progress</span>
            </div>
            <span className="text-sm font-bold font-mono text-accent-500">{rate}%</span>
          </div>
          <div className="h-1.5 bg-surface-border dark:bg-ink-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${rate}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted dark:text-ink-subtle mt-2 font-mono">
            <span>{stats.completed} done</span>
            <span>{(stats.pending ?? 0) + (stats.inProgress ?? 0)} remaining</span>
          </div>
        </motion.div>
      )}

      {/* Body grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent todos */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base text-text-primary dark:text-white">Up Next</h2>
            <Link to="/todos" className="flex items-center gap-1 text-xs text-accent-500 hover:text-accent-400 font-medium transition-colors">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : !dash?.recentTodos?.length ? (
            <div className="card p-10 text-center">
              <div className="w-11 h-11 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={20} className="text-accent-500" />
              </div>
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">All caught up. Add a task to get started.</p>
              <Link to="/todos" className="btn-primary text-sm mx-auto w-fit">
                <Plus size={14} /> New Task
              </Link>
            </div>
          ) : (
            <motion.ul variants={stagger.container} initial="hidden" animate="show" className="space-y-2">
              {dash.recentTodos.map((todo) => {
                const pri = PRIORITY_CONFIG[todo.priority];
                return (
                  <motion.li key={todo._id} variants={stagger.item}>
                    <Link to="/todos"
                      className="card flex items-center gap-3.5 px-4 py-3 hover:shadow-md dark:hover:shadow-dark-md hover:-translate-y-px transition-all duration-200 group">
                      <div className={cn('w-1.5 h-10 rounded-full shrink-0', pri?.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary dark:text-white truncate">{todo.title}</p>
                        {todo.dueDate && (
                          <p className={cn('text-xs mt-0.5 font-mono', todo.isOverdue ? 'text-red-500' : 'text-text-muted dark:text-ink-subtle')}>
                            {todo.isOverdue && '⚠ '}{formatRelative(todo.dueDate)}
                          </p>
                        )}
                      </div>
                      <span className={cn('badge shrink-0 text-[11px]', pri?.cls)}>{pri?.label}</span>
                      <ArrowRight size={14} className="text-text-muted dark:text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-display font-semibold text-base text-text-primary dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-2.5">
            {[
              { to: '/todos?new=1', icon: Plus,      label: 'New Task',    sub: 'Add something to do',    color: 'text-accent-500',   bg: 'bg-accent-500/10'   },
              { to: '/analytics',   icon: BarChart3,  label: 'Analytics',   sub: 'View productivity data', color: 'text-violet-500',   bg: 'bg-violet-500/10'   },
              { to: '/calendar',    icon: Target,     label: 'Calendar',    sub: 'Schedule your week',     color: 'text-emerald-500',  bg: 'bg-emerald-500/10'  },
            ].map(({ to, icon: Icon, label, sub, color, bg }) => (
              <Link key={to} to={to}
                className="card flex items-center gap-3.5 px-4 py-3.5 hover:shadow-md dark:hover:shadow-dark-md hover:-translate-y-px transition-all duration-200 group">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary dark:text-white">{label}</p>
                  <p className="text-xs text-text-muted dark:text-ink-subtle">{sub}</p>
                </div>
                <ArrowRight size={14} className="text-text-muted dark:text-ink-subtle ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
