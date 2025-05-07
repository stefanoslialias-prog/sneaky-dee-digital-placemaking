import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserType } from '@/types/auth';
import { toast } from 'sonner';

export const handleUserSession = async (session: Session): Promise<AuthUserType | null> => {
  try {
    // If session exists, first check if user has admin role
    if (session?.user) {
      // Try to get user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (roleError) {
        console.warn('Error fetching user role:', roleError);
      }
      
      // Return user data with role
      return {
        id: session.user.id,
        email: session.user.email || 'admin@digitalplacemaking.ca',
        role: roleData?.role === 'admin' ? 'admin' : 'manager',
        name: session.user.user_metadata?.name || 'Admin User'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error handling user session:', error);
    return null;
  }
};

export const loginUser = async (email: string, password: string) => {
  console.log('Attempting login for:', email);
  
  try {
    // Use Supabase's email/password auth
    const response = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (response.error) {
      console.error('Login error:', response.error);
      return { error: response.error };
    }
    
    console.log('Login successful:', response);
    
    return {
      user: response.data.user,
      session: response.data.session
    };
  } catch (err) {
    console.error('Login error:', err);
    return { error: { message: 'An unexpected error occurred' } };
  }
};

export const logoutUser = async () => {
  try {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    toast.error('Failed to log out');
  }
};
