
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { toast } from 'sonner';

const Admin = () => {
  const { user, isLoading } = useAuth();

  // Notify about real-time capability
  useEffect(() => {
    if (user) {
      toast.success("Real-time updates enabled!", {
        description: "You'll now see survey responses and traffic data as they happen."
      });
    }
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-toronto-gray p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-toronto-blue mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If logged in, show dashboard, otherwise show login page
  return user ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
