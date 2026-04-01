import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

// ─── Date helpers ─────────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d))    return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'MMM d, yyyy');
};

export const formatRelative = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isPast(d);
};

// ─── Priority config ──────────────────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20',    dot: 'bg-red-500',    border: 'border-red-200 dark:border-red-800' },
  high:   { label: 'High',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', dot: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
  low:    { label: 'Low',    color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',   dot: 'bg-green-500',  border: 'border-green-200 dark:border-green-800' },
};

// ─── Status config ────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-gray-600 dark:text-gray-400',   bg: 'bg-gray-100 dark:bg-gray-800' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  completed:   { label: 'Completed',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  cancelled:   { label: 'Cancelled',   color: 'text-gray-400 dark:text-gray-600',   bg: 'bg-gray-50 dark:bg-gray-900' },
};

// ─── Class name helper ────────────────────────────────────────────────────────
export const cn = (...classes) => classes.filter(Boolean).join(' ');

// ─── Truncate text ─────────────────────────────────────────────────────────────
export const truncate = (str, n = 80) =>
  str?.length > n ? `${str.slice(0, n)}…` : str;

// ─── Get initials ──────────────────────────────────────────────────────────────
export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Productivity color ───────────────────────────────────────────────────────
export const getProductivityColor = (score) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
};
