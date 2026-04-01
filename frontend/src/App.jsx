import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/common/PageLoader';

const LoginPage    = lazy(() => import('@/pages/LoginPage'));
const SignupPage   = lazy(() => import('@/pages/SignupPage'));
const Dashboard    = lazy(() => import('@/pages/Dashboard'));
const TodosPage    = lazy(() => import('@/pages/TodosPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const AnalyticsPage= lazy(() => import('@/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login"  element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/"          element={<Dashboard />} />
                  <Route path="/todos"     element={<TodosPage />} />
                  <Route path="/calendar"  element={<CalendarPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings"  element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px', fontWeight: '500' } }} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
