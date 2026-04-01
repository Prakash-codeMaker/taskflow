import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, CheckCircle2, Timer,
  AlertOctagon, Activity, Gauge, Layers,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/utils';
import { format, parseISO } from 'date-fns';

const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2.5 shadow-xl dark:shadow-dark-lg text-xs min-w-[120px]">
      <p className="font-semibold text-text-primary dark:text-white mb-1.5 font-mono">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-text-muted dark:text-ink-subtle capitalize">{p.name}</span>
          <span className="font-bold text-text-primary dark:text-white ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent, trend, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className="card p-5 relative overflow-hidden group hover:shadow-md dark:hover:shadow-dark-md transition-all duration-200">
    {accent && <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent pointer-events-none" />}
    <div className="flex items-start justify-between mb-4">
      <div className={cn('p-2.5 rounded-xl',
        accent ? 'bg-accent-500/12 text-accent-500' : 'bg-surface-secondary dark:bg-ink-tertiary text-text-muted dark:text-gray-400')}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-semibold',
          trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="font-display font-bold text-3xl text-text-primary dark:text-white leading-none mb-1.5">{value}</p>
    <p className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide">{label}</p>
    {sub && <p className="text-[11px] text-text-muted dark:text-ink-subtle mt-1 font-mono">{sub}</p>}
  </motion.div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, children, delay = 0, className = '' }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className={cn('card p-6', className)}>
    <h2 className="font-display font-bold text-base text-text-primary dark:text-white mb-5">{title}</h2>
    {children}
  </motion.div>
);

const Skeleton = ({ className }) => <div className={cn('skeleton rounded-xl', className)} />;

export default function AnalyticsPage() {
  const { overview, trend, priority, category, productivity, loading } = useAnalytics();

  const trendData = trend.map(d => ({
    ...d,
    date: (() => { try { return format(parseISO(d.date), 'MMM d'); } catch { return d.date; } })(),
  }));

  const rate = overview?.completionRate?.toFixed(1) ?? '0';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-2xl text-text-primary dark:text-white">Analytics</h1>
        <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
          Track your productivity and task completion patterns.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)
        ) : (
          <>
            <StatCard icon={CheckCircle2}   label="Completion Rate"     value={`${rate}%`}
              sub={`${overview?.completed ?? 0} of ${overview?.total ?? 0} tasks`}
              accent delay={0} />
            <StatCard icon={Gauge}         label="Productivity Score"  value={`${productivity?.score ?? 0}`}
              sub={`${productivity?.thisWeek ?? 0} done this week`}
              trend={productivity?.trend} delay={0.07} />
            <StatCard icon={AlertOctagon}  label="Overdue"             value={overview?.overdue ?? 0}
              sub="Need attention now" delay={0.14} />
            <StatCard icon={Timer}         label="In Progress"         value={overview?.inProgress ?? 0}
              sub={`${overview?.pending ?? 0} pending`} delay={0.21} />
          </>
        )}
      </div>

      {/* Activity trend chart */}
      <Section title={<span className="flex items-center gap-2"><Activity size={16} className="text-accent-500" /> Task Activity — Last 30 Days</span>} delay={0.1}>
        {loading ? <Skeleton className="h-56" /> : trendData.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-text-muted dark:text-ink-subtle text-sm">
            No data yet. Start creating tasks to see your activity.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8891a8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8891a8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, color: '#8891a8' }} />
              <Area type="monotone" dataKey="created"   name="Created"   stroke="#6366f1" strokeWidth={2} fill="url(#gCreated)"   dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} fill="url(#gCompleted)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Priority + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority distribution */}
        <Section title={<span className="flex items-center gap-2"><Layers size={16} className="text-accent-500" /> Priority Distribution</span>} delay={0.15}>
          {loading ? <Skeleton className="h-52" /> : priority.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-text-muted dark:text-ink-subtle text-sm">No data yet</div>
          ) : (
            <div className="space-y-4">
              {['urgent','high','medium','low'].map(p => {
                const item = priority.find(d => d._id === p);
                if (!item) return null;
                const pct = Math.round(item.completionRate ?? 0);
                const color = PRIORITY_COLORS[p];
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="font-semibold text-text-primary dark:text-white capitalize">{p}</span>
                      </div>
                      <span className="text-text-muted dark:text-ink-subtle font-mono">{item.completed}/{item.total} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-border dark:bg-ink-border rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
                        className="h-full rounded-full" style={{ background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Category overview */}
        <Section title={<span className="flex items-center gap-2"><Layers size={16} className="text-violet-500" /> Category Overview</span>} delay={0.2}>
          {loading ? <Skeleton className="h-52" /> : category.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-text-muted dark:text-ink-subtle text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={category} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8891a8' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: '#8891a8' }} tickLine={false} axisLine={false} width={70} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="total"     name="Total"     fill="#6366f1" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Productivity panel */}
      {productivity && (
        <Section title={<span className="flex items-center gap-2"><Gauge size={16} className="text-emerald-500" /> Productivity Insights</span>} delay={0.25}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { value: productivity.score,    label: 'Score',      sub: 'out of 100',         color: 'text-accent-500'   },
              { value: productivity.thisWeek, label: 'This Week',  sub: 'tasks completed',    color: 'text-emerald-500'  },
              {
                value: `${productivity.trend >= 0 ? '+' : ''}${productivity.trend}%`,
                label: 'vs Last Week',
                sub:   `${productivity.lastWeek} last week`,
                color: productivity.trend >= 0 ? 'text-emerald-500' : 'text-red-500',
              },
            ].map(({ value, label, sub, color }) => (
              <div key={label} className="text-center">
                <div className={cn('font-display font-bold text-4xl mb-1.5', color)}>{value}</div>
                <div className="text-sm font-semibold text-text-primary dark:text-white">{label}</div>
                <div className="text-xs text-text-muted dark:text-ink-subtle mt-0.5 font-mono">{sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-text-muted dark:text-ink-subtle mb-2 font-mono">
              <span>0 — Needs work</span>
              <span>100 — Outstanding</span>
            </div>
            <div className="h-2 bg-surface-border dark:bg-ink-border rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${productivity.score}%` }}
                transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.4 }}
                className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400" />
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
