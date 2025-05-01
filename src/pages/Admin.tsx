import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { Navigate, useLocation } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuth();
  const location = useLocation();

  // If we're already at /admin/dashboard, show the dashboard
  if (location.pathname === '/admin/dashboard') {
    return <AdminDashboard />;
  }
  
  // Otherwise show the login screen
  return <AdminLogin />;
};

export default Admin;
