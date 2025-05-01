
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthUserType {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  name: string;
}

interface AuthContextType {
  user: AuthUserType | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
                handleUserSession(session);
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
          await handleUserSession(session);
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
  
  // Helper function to handle user session
  const handleUserSession = async (session: Session) => {
    if (!session.user) return;
    
    try {
      console.log('Processing user session for:', session.user.id);
      
      // Use the has_role function to check for admin role
      // This avoids the RLS recursion issue
      const { data: roleData, error: roleError } = await supabase.rpc('has_role', { 
        user_id: session.user.id, 
        required_role: 'admin' 
      });
        
      console.log('Role check result:', { roleData, roleError });
      
      if (roleError) {
        console.error('Role check error:', roleError);
        
        // If this is development, try to create an admin role
        // This is useful for initial setup and testing
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          console.log('Development environment detected - attempting to create admin role');
          
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: session.user.id,
              role: 'admin'
            });
            
          if (insertError) {
            console.error('Error creating role:', insertError);
            throw new Error('Could not create user role');
          } else {
            console.log('Created admin role for user in development mode');
            
            // Set user with admin role after creating it
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'admin',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User'
            });
            
            return;
          }
        } else {
          throw new Error('Not authorized to access admin area');
        }
      }
      
      // If the role check returned false (not admin)
      if (roleData === false) {
        throw new Error('You do not have permission to access this area');
      }
      
      // Get user details
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: 'admin',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User'
      });
      
      console.log('User session processed successfully');
    } catch (err: any) {
      console.error('User data error:', err);
      await logout();
      setError(err.message);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error details:', error);
        throw error;
      }
      
      console.log('Login successful, user:', data?.user?.id);
      toast.success('Login successful');
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      toast.success('Logged out successfully');
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
