import api from './api';

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  signup:         (data)    => api.post('/auth/signup', data),
  login:          (data)    => api.post('/auth/login', data),
  logout:         ()        => api.post('/auth/logout'),
  getMe:          ()        => api.get('/auth/me'),
  updateProfile:  (data)    => api.patch('/auth/me', data),
  changePassword: (data)    => api.patch('/auth/change-password', data),
  refreshToken:   (token)   => api.post('/auth/refresh', { refreshToken: token }),
};

// ─── Todo Service ─────────────────────────────────────────────────────────────
export const todoService = {
  getAll:        (params)       => api.get('/todos', { params }),
  getOne:        (id)           => api.get(`/todos/${id}`),
  create:        (data)         => api.post('/todos', data),
  update:        (id, data)     => api.patch(`/todos/${id}`, data),
  delete:        (id)           => api.delete(`/todos/${id}`),
  bulkUpdate:    (ids, updates) => api.patch('/todos/bulk', { ids, updates }),
  bulkDelete:    (ids)          => api.delete('/todos/bulk', { data: { ids } }),
  reorder:       (orderedIds)   => api.patch('/todos/reorder', { orderedIds }),
  toggleSubtask: (todoId, subtaskId) =>
    api.patch(`/todos/${todoId}/subtasks/${subtaskId}/toggle`),
};

// ─── Analytics Service ────────────────────────────────────────────────────────
export const analyticsService = {
  getOverview:    ()          => api.get('/analytics/overview'),
  getTrend:       (days = 30) => api.get('/analytics/trend', { params: { days } }),
  getPriority:    ()          => api.get('/analytics/priority'),
  getCategory:    ()          => api.get('/analytics/category'),
  getProductivity: ()         => api.get('/analytics/productivity'),
};

// ─── AI Service ───────────────────────────────────────────────────────────────
export const aiService = {
  suggest:    ()      => api.get('/ai/suggest'),
  subtasks:   (data)  => api.post('/ai/subtasks', data),
  parse:      (input) => api.post('/ai/parse', { input }),
  coaching:   ()      => api.get('/ai/coaching'),
  prioritize: ()      => api.get('/ai/prioritize'),
};

// ─── User Service ─────────────────────────────────────────────────────────────
export const userService = {
  getDashboard: () => api.get('/users/dashboard'),
};
