
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
  const [session, setSession] = useState<Session | null>(null);

  // Check for session on initial load
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // First set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event, newSession?.user?.id);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (newSession) {
                setSession(newSession);
                
                // Use setTimeout to prevent auth deadlock
                setTimeout(async () => {
                  try {
                    const userData = await handleUserSession(newSession);
                    console.log('User data from session:', userData);
                    setUser(userData);
                    setError(null);
                  } catch (err: any) {
                    console.error('Session handling error:', err.message);
                    setError(err.message);
                  }
                }, 0);
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
            }
          }
        );
        
        // Then check for existing session
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (existingSession) {
          console.log('Found existing session for user:', existingSession.user.id);
          setSession(existingSession);
          
          // Use setTimeout to prevent auth deadlock
          setTimeout(async () => {
            try {
              const userData = await handleUserSession(existingSession);
              console.log('User data from existing session:', userData);
              setUser(userData);
            } catch (err: any) {
              console.error('Error handling existing session:', err.message);
              setError(err.message);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setIsLoading(false);
        }
        
        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error('Session check error:', err);
        setIsLoading(false);
        setError(err.message);
      }
    };
    
    const cleanup = checkSession();
    return () => {
      cleanup.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loginUser(email, password);
      
      // If using default admin and login failed, provide more helpful error
      if (result?.error && email === 'admin@digitalplacemaking.ca') {
        console.warn('Default admin login failed. This account must exist in Supabase Auth.');
      }
      
      // Authentication state will be updated through the auth state listener
      console.log('Login attempt completed, result:', result);
      return result;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setSession(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Logout failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
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

export { useAuth } from '@/hooks/useAuth';
