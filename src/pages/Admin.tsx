
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we're at /admin and the user is authenticated, redirect to dashboard
    if (user && location.pathname === '/admin') {
      navigate('/admin/dashboard');
    }
  }, [user, location.pathname, navigate]);

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
  
  // If we're already at /admin/dashboard and the user is authenticated, show the dashboard
  if (location.pathname === '/admin/dashboard') {
    // Ensure the user is authenticated to access the dashboard
    if (!user) {
      return <Navigate to="/admin" replace />;
    }
    return <AdminDashboard />;
  }
  
  // Otherwise show the login screen
  return <AdminLogin />;
};

export default Admin;
