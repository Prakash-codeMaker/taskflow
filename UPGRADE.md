# ⚡ TaskFlow v2 — Upgrade Guide

This update adds three major features to your existing TaskFlow app:

## ✨ What's New
| Feature | Description |
|---------|-------------|
| 🤖 **AI Assistant** | Task suggestions, productivity coaching, smart prioritization — powered by Claude AI |
| ⌘K **Command Palette** | Press `Ctrl+K` to search tasks, navigate pages, run any action |
| 📅 **Calendar View** | Monthly & weekly task calendar, click-to-create, unscheduled task strip |

---

## 🚀 Setup Steps

### 1. Install new backend dependency

```bash
cd backend
npm install @anthropic-ai/sdk
```

### 2. Add your Anthropic API key

Open `backend/.env` and add:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get your key at: https://console.anthropic.com/

> **Note:** AI features will gracefully fail with a "Check API key" message if the key is missing — the rest of the app works fine without it.

### 3. Copy the new/updated files

Replace or add these files from the ZIP into your project:

#### New backend files:
```
backend/controllers/aiController.js     ← NEW
backend/routes/aiRoutes.js              ← NEW
```

#### Updated backend files:
```
backend/app.js                          ← adds /api/v1/ai route
backend/middleware/rateLimiter.js       ← exports createLimiter
backend/services/index.js              ← adds aiService
```

#### New frontend files:
```
frontend/src/components/ai/AIAssistant.jsx        ← NEW
frontend/src/components/common/CommandPalette.jsx ← NEW
frontend/src/pages/CalendarPage.jsx               ← NEW
```

#### Updated frontend files:
```
frontend/src/App.jsx                              ← adds /calendar route
frontend/src/components/layout/AppLayout.jsx      ← adds ⌘K, AI button, Calendar nav
frontend/src/components/todo/TodoForm.jsx         ← adds AI subtasks + NLP bar
frontend/src/hooks/index.js                       ← adds useKeyboard hook
frontend/src/services/index.js                    ← adds aiService
```

### 4. Restart both servers

```bash
# From the taskflow root:
npm run dev
```

---

## 🎮 How to Use

### ⌘K Command Palette
- Press **Ctrl+K** (Windows/Linux) or **⌘K** (Mac) anywhere in the app
- Type to search your tasks, navigate pages, or trigger actions
- Arrow keys to navigate, Enter to select, Esc to close

### 🤖 AI Assistant
- Click **"AI Assistant"** in the sidebar (violet dashed button)
- **Suggest tab**: AI analyzes your todos and recommends what to add next — click `+` to add any suggestion instantly
- **Coaching tab**: Get a personalized productivity score, insights, and your weekly focus goal
- **Prioritize tab**: AI re-ranks all your pending tasks using Eisenhower Matrix principles

### 🤖 AI in TodoForm
- When creating a task, type naturally in the **Smart Input** bar at the top:
  `"Call John tomorrow at 3pm high priority"`
  → AI auto-fills title, due date, priority, category
- In the Subtasks section, click **"AI Generate"** to auto-break down your task into steps

### 📅 Calendar
- Click **Calendar** in the sidebar
- Switch between **Month** and **Week** view
- Click any day to create a task with that due date pre-filled
- Click any task pill to edit it
- Unscheduled tasks shown in the bottom strip — click to assign a date

---

## 🔑 API Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/suggest` | AI task suggestions based on history |
| POST | `/api/v1/ai/subtasks` | Generate subtasks for a task |
| POST | `/api/v1/ai/parse` | Parse natural language → structured task |
| GET | `/api/v1/ai/coaching` | Productivity coaching + score |
| GET | `/api/v1/ai/prioritize` | AI-ranked task priority list |

All AI routes are rate-limited to **20 requests/hour** per user.
