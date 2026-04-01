/**
 * Email Reminder Service
 * Sends deadline reminders via Resend (free 3000 emails/month)
 * Get your free API key at: https://resend.com
 */

const { Resend } = require('resend');
const logger = require('../utils/logger');

let resend;
const getResend = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) return null;
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// ─── Build premium HTML email ─────────────────────────────────────────────────
const buildReminderEmail = (user, todos, reminderType) => {
  const typeConfig = {
    '24h': { label: 'due in 24 hours', color: '#f59e0b', emoji: '⏰', urgency: 'Due Today' },
    '1h':  { label: 'due in 1 hour',   color: '#ef4444', emoji: '🔴', urgency: 'Due Very Soon' },
    'overdue': { label: 'overdue',      color: '#dc2626', emoji: '⚠️',  urgency: 'Overdue' },
  };
  const cfg = typeConfig[reminderType] || typeConfig['24h'];

  const priorityColors = {
    urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
  };

  const taskRows = todos.map(t => {
    const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : 'No due date';
    const priColor = priorityColors[t.priority] || '#f59e0b';

    return `
      <div style="background:#1e2535;border:1px solid #2a3347;border-radius:12px;padding:16px 20px;margin-bottom:10px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="width:3px;border-radius:99px;background:${priColor};align-self:stretch;flex-shrink:0;min-height:40px;"></div>
          <div style="flex:1;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#f1f5f9;">${t.title}</p>
            ${t.description ? `<p style="margin:0 0 8px;font-size:13px;color:#8891a8;line-height:1.5;">${t.description.slice(0, 120)}${t.description.length > 120 ? '…' : ''}</p>` : ''}
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:12px;color:${cfg.color};font-weight:600;">${cfg.emoji} ${dueDate}</span>
              <span style="font-size:11px;background:${priColor}22;color:${priColor};padding:2px 8px;border-radius:99px;border:1px solid ${priColor}44;font-weight:600;text-transform:capitalize;">${t.priority}</span>
              ${t.category ? `<span style="font-size:11px;color:#8891a8;">${t.category}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">

    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:36px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5L6 11.5L13 4.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">TaskFlow</span>
    </div>

    <!-- Hero card -->
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#1e2535 100%);border:1px solid #312e81;border-radius:20px;padding:32px;margin-bottom:24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">${cfg.emoji}</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
        You have ${todos.length} task${todos.length > 1 ? 's' : ''} ${cfg.label}
      </h1>
      <p style="margin:0;font-size:15px;color:#a5b4fc;">
        Hey ${user.name.split(' ')[0]}, don't let these slip through the cracks.
      </p>
    </div>

    <!-- Task list -->
    <div style="margin-bottom:28px;">
      <p style="margin:0 0 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4a5270;">
        ${cfg.urgency} — Action Required
      </p>
      ${taskRows}
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/todos"
        style="display:inline-block;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.01em;">
        Open TaskFlow →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1e2535;padding-top:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#4a5270;">
        You're receiving this because you have tasks due soon in TaskFlow.
      </p>
      <p style="margin:0;font-size:12px;color:#4a5270;">
        Manage your notification preferences in
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/settings" style="color:#6366f1;text-decoration:none;">Settings</a>
      </p>
    </div>
  </div>
</body>
</html>`;
};

// ─── Send reminder email ───────────────────────────────────────────────────────
const sendReminderEmail = async (user, todos, reminderType) => {
  const client = getResend();
  if (!client) {
    logger.warn('Email reminders skipped — RESEND_API_KEY not set');
    return false;
  }

  const typeLabels = { '24h': '24-hour', '1h': '1-hour', 'overdue': 'overdue' };
  const subject    = {
    '24h':    `⏰ ${todos.length} task${todos.length > 1 ? 's' : ''} due in 24 hours — TaskFlow`,
    '1h':     `🔴 Urgent: ${todos.length} task${todos.length > 1 ? 's' : ''} due in 1 hour — TaskFlow`,
    'overdue':`⚠️ You have ${todos.length} overdue task${todos.length > 1 ? 's' : ''} — TaskFlow`,
  };

  try {
    const { data, error } = await client.emails.send({
      from:    process.env.FROM_EMAIL || 'TaskFlow <onboarding@resend.dev>',
      to:      [user.email],
      subject: subject[reminderType] || subject['24h'],
      html:    buildReminderEmail(user, todos, reminderType),
    });

    if (error) {
      logger.error('Resend email error:', { error, userId: user._id });
      return false;
    }

    logger.info(`Reminder email sent [${typeLabels[reminderType]}] → ${user.email} (${todos.length} tasks)`);
    return true;
  } catch (err) {
    logger.error('Failed to send reminder email:', { error: err.message });
    return false;
  }
};

module.exports = { sendReminderEmail };
