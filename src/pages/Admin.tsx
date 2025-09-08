
import React, { useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we're at /admin and the user is an admin, redirect to dashboard
    if (isAdmin && location.pathname === '/admin') {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, location.pathname, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-toronto-gray">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent border-solid rounded-full mx-auto animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If we're already at /admin/dashboard and the user is an admin, show the dashboard
  if (location.pathname === '/admin/dashboard') {
    // Ensure the user is an admin to access the dashboard
    if (!isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <AdminDashboard />;
  }
  
  // If user is authenticated but not admin, show unauthorized message
  if (user && !isAdmin && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-toronto-gray">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }
  
  // Otherwise show the login screen
  return <AdminLogin />;
};

export default Admin;
