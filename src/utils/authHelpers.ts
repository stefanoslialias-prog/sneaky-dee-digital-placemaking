
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserType } from '@/types/auth';
import { toast } from 'sonner';

export const handleUserSession = async (session: Session): Promise<AuthUserType | null> => {
  try {
    // If session exists, first check if user has admin role
    if (session?.user) {
      console.log('Processing user session for user:', session.user.id);
      
      // Special case for our default admin account
      if (session.user.email === 'admin@digitalplacemaking.ca') {
        console.log('Default admin account detected, granting admin privileges');
        return {
          id: session.user.id,
          email: session.user.email,
          role: 'admin',
          name: 'Admin User'
        };
      }
      
      // Try to get user role from user_roles table for other users
      // Using RPC call that has security_definer privilege to avoid RLS issues
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (roleError) {
        console.warn('Error fetching user role:', roleError);
        console.log('Fallback to default role');
      } else if (roleData) {
        console.log('User role data:', roleData);
        return {
          id: session.user.id,
          email: session.user.email || '',
          role: roleData.role === 'admin' ? 'admin' : 'manager',
          name: session.user.user_metadata?.name || 'User'
        };
      }
      
      // Return user data with default role
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: 'manager', // Default role if not found in user_roles
        name: session.user.user_metadata?.name || 'User'
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
    // Special handling for default admin account
    if (email === 'admin@digitalplacemaking.ca' && password === '123456') {
      console.log('Default admin login detected, attempting login...');
    }
    
    // Use Supabase's email/password auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login error:', error);
      
      // Special case for default admin account - provide more helpful error
      if (email === 'admin@digitalplacemaking.ca') {
        return { 
          error: { 
            message: 'Default admin account login failed. Make sure this account exists in your Supabase Auth.' 
          } 
        };
      }
      
      return { error };
    }
    
    console.log('Login successful:', data);
    
    return {
      user: data.user,
      session: data.session
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
