/**
 * AI Controller — Groq (Llama3) powered
 * Robust JSON parsing with multiple fallback strategies
 */

const Groq = require('groq-sdk');
const Todo = require('../models/Todo');
const { asyncHandler, AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

let groq;
const getClient = () => {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new AppError('AI features require GROQ_API_KEY in backend/.env — get a free key at https://console.groq.com', 503);
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

// ─── Core LLM call ────────────────────────────────────────────────────────────
const ask = async (system, user, maxTokens = 1024) => {
  const response = await getClient().chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    max_tokens:  maxTokens,
    temperature: 0.4,   // Lower = more reliable JSON
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
  });
  return response.choices[0].message.content;
};

// ─── Robust JSON extractor ─────────────────────────────────────────────────────
// Handles: markdown fences, extra prose before/after, trailing commas, etc.
const extractJSON = (text, expectArray = false) => {
  // 1. Strip markdown code fences
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 2. Try direct parse first
  try { return JSON.parse(clean); } catch {}

  // 3. Extract the outermost [ ] or { }
  const opener = expectArray ? '[' : '{';
  const closer = expectArray ? ']' : '}';
  const start = clean.indexOf(opener);
  const end   = clean.lastIndexOf(closer);
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(clean.slice(start, end + 1)); } catch {}
  }

  // 4. Try both bracket types
  for (const [o, c] of [['[', ']'], ['{', '}']]) {
    const s = clean.indexOf(o), e = clean.lastIndexOf(c);
    if (s !== -1 && e !== -1 && e > s) {
      try { return JSON.parse(clean.slice(s, e + 1)); } catch {}
    }
  }

  // 5. Fix common issues: trailing commas before } or ]
  const fixed = clean
    .replace(/,\s*([}\]])/g, '$1')          // trailing commas
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // unquoted keys
    .trim();
  try { return JSON.parse(fixed); } catch {}

  logger.error('JSON extraction failed', { text: text.slice(0, 500) });
  throw new Error('Failed to parse AI response as JSON');
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUGGEST TASKS
// ─────────────────────────────────────────────────────────────────────────────
const suggestTasks = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ userId: req.user._id, isArchived: false })
    .sort({ createdAt: -1 }).limit(20)
    .select('title category priority status').lean();

  const todoSummary = todos.length
    ? todos.map(t => `- [${t.status}] ${t.title} (${t.priority})`).join('\n')
    : 'No tasks yet — user is just getting started.';

  const raw = await ask(
    'You are a productivity coach. Return ONLY a JSON array. No text before or after.',
    `User's tasks:\n${todoSummary}\n\nReturn a JSON array of exactly 5 suggested tasks:\n[{"title":"string","description":"string","priority":"low|medium|high|urgent","category":"string","tags":["string"],"reasoning":"string"}]`,
    900
  );

  const suggestions = extractJSON(raw, true);
  const list = Array.isArray(suggestions) ? suggestions : suggestions.suggestions || [];
  res.status(200).json({ success: true, data: { suggestions: list.slice(0, 5) } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GENERATE SUBTASKS  ← This is the one that was broken
// ─────────────────────────────────────────────────────────────────────────────
const generateSubtasks = asyncHandler(async (req, res) => {
  const { title, description = '', count = 5 } = req.body;
  if (!title?.trim()) throw new AppError('Task title is required', 400);

  const n = Math.min(Number(count) || 5, 8);

  // Very explicit prompt to force clean JSON array output
  const raw = await ask(
    'You are a task breakdown assistant. You MUST return ONLY a JSON array. Absolutely no other text.',
    `Task: "${title}"
${description ? `Details: "${description}"` : ''}

Create ${n} clear, actionable subtasks for this task.

Return ONLY this JSON (no explanation, no markdown):
[
  {"title": "First subtask action", "order": 1},
  {"title": "Second subtask action", "order": 2}
]`,
    600
  );

  const parsed = extractJSON(raw, true);
  const subtasks = Array.isArray(parsed)
    ? parsed.map((s, i) => ({ title: s.title || s.name || String(s), order: s.order || i + 1 }))
    : [];

  if (!subtasks.length) {
    // Fallback: generate generic subtasks if parsing fails
    const generic = [
      { title: `Research and gather requirements for ${title}`, order: 1 },
      { title: `Create initial plan and outline`, order: 2 },
      { title: `Execute the main work`, order: 3 },
      { title: `Review and refine`, order: 4 },
      { title: `Finalize and deliver`, order: 5 },
    ].slice(0, n);
    return res.status(200).json({ success: true, data: { subtasks: generic } });
  }

  res.status(200).json({ success: true, data: { subtasks } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. NATURAL LANGUAGE → STRUCTURED TASK
// ─────────────────────────────────────────────────────────────────────────────
const parseNaturalLanguage = asyncHandler(async (req, res) => {
  const { input } = req.body;
  if (!input?.trim()) throw new AppError('Input text is required', 400);

  const today = new Date().toISOString().split('T')[0];

  const raw = await ask(
    `You are a task parser. Return ONLY a JSON object. Today is ${today}. Do not include any dates from before today.`,
    `Parse this into a task: "${input}"

Return ONLY this JSON:
{"title":"string","description":"","priority":"low|medium|high|urgent","category":"Work|Personal|Health|Learning|Finance|General","dueDate":"YYYY-MM-DD or null","tags":[],"confidence":0.9}`,
    300
  );

  const task = extractJSON(raw, false);

  // Validate dueDate — reject any date in the far past (before 2020)
  if (task.dueDate) {
    const parsed = new Date(task.dueDate);
    if (isNaN(parsed.getTime()) || parsed.getFullYear() < 2020) {
      task.dueDate = null;
    }
  }

  res.status(200).json({ success: true, data: { task } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRODUCTIVITY COACHING
// ─────────────────────────────────────────────────────────────────────────────
const getCoaching = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [allTodos, recentDone, overdue] = await Promise.all([
    Todo.find({ userId, isArchived: false }).select('title priority status').lean(),
    Todo.find({ userId, status: 'completed', completedAt: { $gte: new Date(Date.now() - 7 * 86400000) } }).lean(),
    Todo.find({ userId, status: { $ne: 'completed' }, dueDate: { $lt: new Date() } }).lean(),
  ]);

  const stats = {
    total:             allTodos.length,
    completed:         allTodos.filter(t => t.status === 'completed').length,
    overdue:           overdue.length,
    completedThisWeek: recentDone.length,
  };

  const raw = await ask(
    'You are a productivity coach. Return ONLY a JSON object.',
    `Stats: total=${stats.total}, completed=${stats.completed}, overdue=${stats.overdue}, thisWeek=${stats.completedThisWeek}

Return ONLY this JSON:
{"headline":"string","score":75,"insights":[{"type":"positive","text":"string"},{"type":"tip","text":"string"},{"type":"warning","text":"string"}],"focusSuggestion":"string","weeklyGoal":"string"}`,
    600
  );

  const coaching = extractJSON(raw, false);
  res.status(200).json({ success: true, data: { coaching, stats } });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SMART PRIORITIZATION
// ─────────────────────────────────────────────────────────────────────────────
const prioritizeTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const pending = await Todo.find({
    userId, isArchived: false, status: { $in: ['pending', 'in-progress'] },
  }).select('_id title priority dueDate').lean();

  if (!pending.length) return res.status(200).json({ success: true, data: { prioritized: [] } });

  const today    = new Date().toISOString().split('T')[0];
  const taskList = pending.slice(0, 15).map((t, i) =>
    `${i + 1}. ID:${t._id} "${t.title}" priority:${t.priority} due:${t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'none'}`
  ).join('\n');

  const raw = await ask(
    `You are a productivity expert. Today is ${today}. Return ONLY a JSON array.`,
    `Rank these tasks by urgency+importance:\n${taskList}\n\nReturn ONLY:\n[{"id":"exact_id_string","rank":1,"reason":"short reason"}]`,
    800
  );

  const prioritized = extractJSON(raw, true);
  const list = Array.isArray(prioritized) ? prioritized : [];
  res.status(200).json({ success: true, data: { prioritized: list } });
});

module.exports = { suggestTasks, generateSubtasks, parseNaturalLanguage, getCoaching, prioritizeTasks };
