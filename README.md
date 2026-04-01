# ⚡ TaskFlow — Production-Grade MERN Todo App

A full-stack, production-ready task management application built with MongoDB, Express.js, React, and Node.js. Designed to the standard of a real startup product.

![TaskFlow](https://img.shields.io/badge/Stack-MERN-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Node](https://img.shields.io/badge/Node-18+-brightgreen)

---

## 🏗️ Architecture Overview

```
taskflow/
├── backend/                   # Node.js + Express API
│   ├── config/                # DB + Socket.io setup
│   ├── controllers/           # Request handlers (MVC)
│   ├── middleware/            # Auth, validation, rate limiting, errors
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── utils/                 # Logger, error helpers, sanitizer
│   ├── validators/            # Joi schemas
│   ├── app.js                 # Express app factory
│   └── server.js              # HTTP + Socket.io entry point
│
└── frontend/                  # React + Vite + Tailwind
    └── src/
        ├── components/
        │   ├── common/        # PageLoader, EmptyState, ProtectedRoute
        │   ├── layout/        # AppLayout (sidebar + nav)
        │   └── todo/          # TodoItem, TodoForm, TodoFilters, TodoBoardView
        ├── context/           # AuthContext, ThemeContext
        ├── hooks/             # useTodos (Zustand), useAnalytics, useSocket, useDebounce
        ├── pages/             # Dashboard, TodosPage, AnalyticsPage, Settings, Auth
        ├── services/          # Axios API instance + service modules
        └── utils/             # Helpers, constants, cn()
```

---

## ✨ Features

### Authentication
- JWT access + refresh token rotation
- bcrypt password hashing (cost factor 12)
- Secure token storage with automatic refresh
- Password strength validation

### Task Management
- Create, edit, delete tasks with full metadata
- Priority levels: Low / Medium / High / Urgent
- Status tracking: Pending → In Progress → Completed / Cancelled
- Due dates with overdue detection
- Tags and categories
- Subtasks with progress tracking
- **Drag & drop reordering** (dnd-kit)
- **Bulk select** → complete or delete multiple tasks
- **Full-text search** (debounced, MongoDB text index)
- Filter by status, priority, sort by any field
- **List view** and **Board view** (Kanban-style)

### Analytics Dashboard
- Completion rate and productivity score
- 30-day activity trend chart (area chart)
- Priority distribution with completion rates
- Category breakdown (horizontal bar chart)
- Week-over-week productivity comparison

### Real-time
- Socket.io integration — tasks sync instantly across browser tabs
- Optimistic UI updates with rollback on error

### UI/UX
- Dark / Light mode (system preference + manual toggle)
- Fully responsive (mobile-first)
- Smooth animations (Framer Motion)
- Skeleton loading states
- Toast notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- npm or yarn

### 1. Clone & install

```bash
git clone https://github.com/yourname/taskflow.git
cd taskflow

# Install root dev tools
npm install

# Install all dependencies
npm run install:all
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
JWT_SECRET=change_this_to_a_random_32+_char_string
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another_random_32+_char_string
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Configure frontend

```bash
cd frontend
cp .env.example .env
# Leave VITE_API_URL empty — Vite proxy handles it in dev
```

### 4. Run development servers

```bash
# From root — runs both servers concurrently
npm run dev

# Or separately:
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:3000
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api/v1`

All protected routes require: `Authorization: Bearer <accessToken>`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Login, returns tokens |
| POST | `/auth/refresh` | No | Rotate access token |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| GET | `/auth/me` | Yes | Get current user |
| PATCH | `/auth/me` | Yes | Update profile |
| PATCH | `/auth/change-password` | Yes | Change password |

**Signup body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Jane", "email": "jane@example.com" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/todos` | List todos (filterable, paginated) |
| POST | `/todos` | Create todo |
| GET | `/todos/:id` | Get single todo |
| PATCH | `/todos/:id` | Update todo |
| DELETE | `/todos/:id` | Delete todo |
| PATCH | `/todos/bulk` | Bulk update |
| DELETE | `/todos/bulk` | Bulk delete |
| PATCH | `/todos/reorder` | Update drag-drop order |
| PATCH | `/todos/:id/subtasks/:subtaskId/toggle` | Toggle subtask |

**GET /todos query parameters:**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `status` | string | `pending` | Filter by status |
| `priority` | string | `high` | Filter by priority |
| `search` | string | `meeting` | Full-text search |
| `sortBy` | string | `dueDate` | Sort field |
| `sortOrder` | string | `asc` | `asc` or `desc` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `overdue` | boolean | `true` | Show only overdue |

**Create todo body:**
```json
{
  "title": "Finish API docs",
  "description": "Write comprehensive Postman collection",
  "status": "pending",
  "priority": "high",
  "dueDate": "2025-02-01",
  "category": "Work",
  "tags": ["docs", "api"],
  "subtasks": [
    { "title": "Draft endpoints" },
    { "title": "Add examples" }
  ]
}
```

---

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/overview` | Summary stats |
| GET | `/analytics/trend?days=30` | Daily completion data |
| GET | `/analytics/priority` | Priority distribution |
| GET | `/analytics/category` | Category breakdown |
| GET | `/analytics/productivity` | Score + week comparison |

---

## 🔐 Security

| Layer | Implementation |
|-------|----------------|
| Passwords | bcrypt with cost factor 12 |
| Authentication | JWT access (7d) + refresh (30d) tokens |
| Token rotation | New refresh token on every refresh |
| Input validation | Joi schemas on every route |
| XSS prevention | `xss` library on user content |
| Rate limiting | 100 req/15min general, 10 req/15min auth |
| Headers | Helmet.js (CSP, HSTS, etc.) |
| CORS | Allowlist-based origin validation |
| Body size | 10kb limit to prevent payload attacks |
| MongoDB injection | Mongoose strict schema + Joi validation |

---

## 🌍 Deployment

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect your repo, set **Root Directory** to `backend`
4. Set environment variables (see `.env.example`)
5. Build command: `npm install`
6. Start command: `npm start`

Or use the included `render.yaml` for instant deploy.

### Frontend → Vercel

```bash
cd frontend
npm run build           # Verify build succeeds locally

# Deploy with Vercel CLI
npx vercel --prod
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL = https://your-backend.onrender.com/api/v1
```

### Database → MongoDB Atlas

1. Create free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database user with password
3. Whitelist IP `0.0.0.0/0` (or Render's static IP)
4. Copy connection string into `MONGODB_URI`

---

## 🧪 Testing

### API Testing (Postman)

Import the Postman collection:

```bash
# Health check
GET http://localhost:5000/health

# 1. Sign up
POST http://localhost:5000/api/v1/auth/signup
Content-Type: application/json
{ "name": "Test User", "email": "test@test.com", "password": "TestPass1" }

# 2. Login & save token
POST http://localhost:5000/api/v1/auth/login

# 3. Create a todo (set Authorization header)
POST http://localhost:5000/api/v1/todos
Authorization: Bearer <token>
{ "title": "My first task", "priority": "high" }

# 4. Get todos
GET http://localhost:5000/api/v1/todos?status=pending&sortBy=priority&sortOrder=desc
```

### Error Response Format

All errors follow this shape:
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

---

## 🔌 Socket.io Events

Connect with: `io(SERVER_URL, { auth: { token: accessToken } })`

| Event | Direction | Payload |
|-------|-----------|---------|
| `todo:created` | Server → Client | `{ todo }` |
| `todo:updated` | Server → Client | `{ todo }` |
| `todo:deleted` | Server → Client | `{ todoId }` |
| `todo:reordered` | Server → Client | `{ orderedIds }` |
| `todo:bulkUpdated` | Server → Client | `{ ids, updates }` |
| `todo:bulkDeleted` | Server → Client | `{ ids }` |

---

## 📦 Tech Stack

### Backend
| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth |
| joi | Input validation |
| helmet | Security headers |
| cors | Cross-origin policy |
| express-rate-limit | Rate limiting |
| socket.io | Real-time events |
| winston | Structured logging |
| xss | XSS sanitization |
| morgan | HTTP request logging |

### Frontend
| Package | Purpose |
|---------|---------|
| react + react-dom | UI framework |
| react-router-dom | Client routing |
| zustand | State management |
| axios | HTTP client |
| socket.io-client | Real-time |
| framer-motion | Animations |
| @dnd-kit | Drag & drop |
| recharts | Charts |
| react-hot-toast | Notifications |
| date-fns | Date formatting |
| tailwindcss | Utility CSS |
| lucide-react | Icons |
| vite | Build tool |

---

## 🗂️ Database Schema

### User
```
_id, name, email, password (hashed), avatar,
preferences { theme, defaultView }, lastActive,
isActive, refreshToken, createdAt, updatedAt
```

### Todo
```
_id, title, description, status, priority,
dueDate, completedAt, tags[], category, order,
subtasks[{ title, completed, completedAt }],
isArchived, userId (ref), createdAt, updatedAt
```

**Indexes:**
- `{ userId, createdAt }` — list queries
- `{ userId, status }` — filter by status
- `{ userId, priority }` — filter by priority
- `{ userId, dueDate }` — date queries + overdue
- `{ title, description, tags }` — full-text search

---

## 🛣️ Roadmap / Bonus Features

- [ ] AI task suggestions (OpenAI API)
- [ ] Email reminders (SendGrid/Resend)
- [ ] PWA + offline support (Workbox)
- [ ] Google OAuth login
- [ ] Recurring tasks
- [ ] Team workspaces
- [ ] Mobile app (React Native)

---

## 📄 License

MIT — use freely for personal and commercial projects.
