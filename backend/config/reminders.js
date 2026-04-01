/**
 * Email Reminder Scheduler
 * Runs every hour, checks for tasks due soon, sends emails.
 *
 * Schedule:
 *  - 24h reminder: tasks due between 23h and 25h from now
 *  - 1h reminder:  tasks due between 50min and 70min from now
 *  - Overdue:      runs at 9am daily for tasks overdue < 48h
 */

const cron    = require('node-cron');
const Todo    = require('../models/Todo');
const User    = require('../models/User');
const { sendReminderEmail } = require('../utils/emailService');
const logger  = require('../utils/logger');

// ─── Helper: get users with tasks in a time window ────────────────────────────
const getUsersWithTasksDue = async (fromMs, toMs) => {
  const from = new Date(Date.now() + fromMs);
  const to   = new Date(Date.now() + toMs);

  return Todo.aggregate([
    {
      $match: {
        status:      { $in: ['pending', 'in-progress'] },
        isArchived:  false,
        dueDate:     { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id:   '$userId',
        todos: { $push: '$$ROOT' },
        count: { $sum: 1 },
      },
    },
  ]);
};

// ─── Send reminders to all affected users ─────────────────────────────────────
const dispatchReminders = async (type, fromMs, toMs) => {
  try {
    const groups = await getUsersWithTasksDue(fromMs, toMs);
    if (!groups.length) return;

    logger.info(`[Reminders] ${type} — found ${groups.length} user(s) with tasks due`);

    for (const group of groups) {
      const user = await User.findById(group._id).select('name email').lean();
      if (!user) continue;
      await sendReminderEmail(user, group.todos, type);
      // Small delay between emails to respect rate limits
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (err) {
    logger.error(`[Reminders] Error dispatching ${type} reminders:`, { error: err.message });
  }
};

// ─── Overdue reminder (daily at 9 AM) ────────────────────────────────────────
const dispatchOverdueReminders = async () => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // Only past 48h

    const groups = await Todo.aggregate([
      {
        $match: {
          status:     { $in: ['pending', 'in-progress'] },
          isArchived: false,
          dueDate:    { $gte: cutoff, $lt: new Date() },
        },
      },
      { $group: { _id: '$userId', todos: { $push: '$$ROOT' }, count: { $sum: 1 } } },
    ]);

    if (!groups.length) return;
    logger.info(`[Reminders] overdue — found ${groups.length} user(s)`);

    for (const group of groups) {
      const user = await User.findById(group._id).select('name email').lean();
      if (user) await sendReminderEmail(user, group.todos, 'overdue');
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (err) {
    logger.error('[Reminders] Overdue dispatch error:', { error: err.message });
  }
};

// ─── Init all cron jobs ───────────────────────────────────────────────────────
const initReminders = () => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('[Reminders] RESEND_API_KEY not set — email reminders disabled.');
    logger.warn('[Reminders] Get a free key at https://resend.com and add it to backend/.env');
    return;
  }

  logger.info('[Reminders] Email reminder scheduler started ✅');

  // ── Every hour: check for tasks due in ~24 hours ──────────────────────────
  cron.schedule('0 * * * *', () => {
    logger.info('[Reminders] Running 24h check…');
    dispatchReminders('24h',
      23 * 60 * 60 * 1000,  // 23 hours from now
      25 * 60 * 60 * 1000   // 25 hours from now
    );
  });

  // ── Every hour at :30: check for tasks due in ~1 hour ─────────────────────
  cron.schedule('30 * * * *', () => {
    logger.info('[Reminders] Running 1h check…');
    dispatchReminders('1h',
      50 * 60 * 1000,   // 50 min from now
      70 * 60 * 1000    // 70 min from now
    );
  });

  // ── Daily at 9 AM: overdue tasks ──────────────────────────────────────────
  cron.schedule('0 9 * * *', () => {
    logger.info('[Reminders] Running daily overdue check…');
    dispatchOverdueReminders();
  });
};

module.exports = { initReminders };
