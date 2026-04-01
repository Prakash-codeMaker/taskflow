import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLoader from './PageLoader';

const ProtectedRoute = () => {
  const { user, loading, initialized } = useAuth();
  if (!initialized || loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};
export default ProtectedRoute;
