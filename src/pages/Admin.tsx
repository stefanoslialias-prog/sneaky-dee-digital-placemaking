
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { user, isLoading, error, session } = useAuth();

  // Notify about real-time capability
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('User authenticated as admin:', user);
      toast.success("Real-time dashboard active!", {
        description: "You're now seeing live updates for survey responses and traffic data."
      });
    } else if (user && user.role !== 'admin') {
      toast.error("Access denied", {
        description: "Your account does not have admin privileges."
      });
    }
  }, [user]);

  // Debug auth status
  useEffect(() => {
    console.log('Admin page - Auth status:', { 
      isAuthenticated: !!user, 
      isAdmin: user?.role === 'admin', 
      isLoading, 
      hasSession: !!session 
    });
  }, [user, isLoading, session]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-toronto-gray p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-toronto-blue mx-auto mb-4"></div>
          <p>Authenticating, please wait...</p>
          <p className="text-sm text-gray-500 mt-2">Checking your session...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admin users with proper message
  if (user && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  console.log('Admin page rendering decision:', user ? 'Showing dashboard' : 'Showing login');

  // If logged in as admin, show dashboard, otherwise show login page
  return user ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
