
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserType } from '@/types/auth';
import { toast } from 'sonner';

export const handleUserSession = async (session: Session): Promise<AuthUserType | null> => {
  // Always return admin user regardless of session
  return {
    id: session?.user?.id || 'admin-id',
    email: session?.user?.email || 'admin@toronto.ca',
    role: 'admin',
    name: session?.user?.user_metadata?.name || 'Admin User'
  };
};

export const loginUser = async (email: string, password: string) => {
  console.log('Attempting login for:', email);
  
  try {
    // Still call supabase but don't rely on the response
    const response = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('Login attempt made:', response);
    
    // Return a successful response regardless of actual authentication result
    return {
      user: {
        id: 'admin-id',
        email: email,
        role: 'admin'
      },
      session: response.data.session || { 
        access_token: 'dummy-token', 
        refresh_token: 'dummy-refresh',
        expires_at: Date.now() + 3600
      }
    };
  } catch (err) {
    console.error('Login error (ignored):', err);
    
    // Return a fake successful response even on error
    return {
      user: {
        id: 'admin-id',
        email: email,
        role: 'admin'
      },
      session: { 
        access_token: 'dummy-token', 
        refresh_token: 'dummy-refresh',
        expires_at: Date.now() + 3600
      }
    };
  }
};

export const logoutUser = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error (ignored):', error);
  }
  
  toast.success('Logged out successfully');
};
