import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';
import { socketService } from '@/services/socketService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [initialized, setInit]  = useState(false);

  // ─── Bootstrap: verify stored token ──────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); setInit(true); return; }

      try {
        const { data } = await authService.getMe();
        setUser(data.user);
        socketService.connect(token);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
        setInit(true);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    socketService.connect(data.accessToken);
    return data;
  }, []);

  const signup = useCallback(async (userData) => {
    const { data } = await authService.signup(userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    socketService.connect(data.accessToken);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* best effort */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    socketService.disconnect();
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
