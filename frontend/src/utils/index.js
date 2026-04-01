import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO, isValid } from 'date-fns';

// ─── Safe date parser ─────────────────────────────────────────────────────────
const safeDate = (date) => {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  // Reject clearly wrong dates (before 2000 or after 2100)
  if (!isValid(d) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return null;
  return d;
};

export const formatDate = (date) => {
  const d = safeDate(date);
  if (!d) return null;
  if (isToday(d))    return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'MMM d, yyyy');
};

export const formatRelative = (date) => {
  const d = safeDate(date);
  if (!d) return null;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  const d = safeDate(dueDate);
  return d ? isPast(d) : false;
};

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', dot: 'bg-red-500',     cls: 'priority-urgent', color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  high:   { label: 'High',   dot: 'bg-orange-500',  cls: 'priority-high',   color: 'text-orange-500',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  medium: { label: 'Medium', dot: 'bg-amber-500',   cls: 'priority-medium', color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  low:    { label: 'Low',    dot: 'bg-emerald-500', cls: 'priority-low',    color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

export const STATUS_CONFIG = {
  pending:       { label: 'Pending',     cls: 'status-pending',      dot: 'bg-gray-400'    },
  'in-progress': { label: 'In Progress', cls: 'status-in-progress',  dot: 'bg-blue-500'    },
  completed:     { label: 'Completed',   cls: 'status-completed',    dot: 'bg-emerald-500' },
  cancelled:     { label: 'Cancelled',   cls: 'status-cancelled',    dot: 'bg-red-400'     },
};

export const truncate = (str, n = 80) => str?.length > n ? `${str.slice(0, n)}…` : str;
export const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
export const cn = (...classes) => classes.filter(Boolean).join(' ');
export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
