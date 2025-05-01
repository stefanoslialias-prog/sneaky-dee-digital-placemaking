
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
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              await handleUserSession(session);
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
      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (roleError) {
        console.error('Role check error:', roleError);
        throw new Error('Not authorized to access admin area');
      }
      
      if (!roleData || !['admin', 'manager'].includes(roleData.role)) {
        throw new Error('You do not have permission to access this area');
      }
      
      // Get user details from admin_users or fallback to auth user
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('email')
        .eq('id', session.user.id)
        .maybeSingle();
      
      setUser({
        id: session.user.id,
        email: adminData?.email || session.user.email || '',
        role: roleData.role as 'admin' | 'manager',
        name: session.user.user_metadata?.name || adminData?.email?.split('@')[0] || 'Admin User'
      });
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Login successful');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      toast.error('Login failed: ' + err.message);
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
