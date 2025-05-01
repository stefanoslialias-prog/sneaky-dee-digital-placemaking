
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthContextType, AuthUserType } from '@/types/auth';
import { handleUserSession, loginUser, logoutUser } from '@/utils/authHelpers';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AuthUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for session on initial load
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // First set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            if (event === 'SIGNED_IN' && session) {
              // Using setTimeout to prevent auth deadlock
              setTimeout(() => {
                handleSessionChange(session);
              }, 0);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
          }
        );
        
        // Then check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          await handleSessionChange(session);
        }
        
        setIsLoading(false);
        
        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error('Session check error:', err);
        setIsLoading(false);
      }
    };
    
    const cleanup = checkSession();
    return () => {
      cleanup.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);
  
  // Helper function to handle session change
  const handleSessionChange = async (session: Session) => {
    try {
      const userData = await handleUserSession(session);
      setUser(userData);
    } catch (err: any) {
      console.error('Session change error:', err);
      setError(err.message);
      await logout();
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await loginUser(email, password);
      // Authentication state will be updated through the auth state listener
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Logout failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook from this file for backward compatibility
export { useAuth } from '@/hooks/useAuth';
