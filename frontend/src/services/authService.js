import api from './api';

export const authService = {
  signup:         (data)  => api.post('/auth/signup', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  getMe:          ()      => api.get('/auth/me'),
  updateProfile:  (data)  => api.patch('/auth/me', data),
  changePassword: (data)  => api.patch('/auth/change-password', data),
  refreshToken:   (token) => api.post('/auth/refresh', { refreshToken: token }),
};
