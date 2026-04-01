/**
 * Axios API Instance
 * Handles auth headers, token refresh, and error normalization
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach token ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle token refresh ───────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data, // Return data directly
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        processQueue(error);
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

export default api;
