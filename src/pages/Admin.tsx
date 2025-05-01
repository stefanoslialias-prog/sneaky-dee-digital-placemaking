
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const Admin = () => {
  const { user } = useAuth();

  // If logged in, show dashboard, otherwise show login page
  return user ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
