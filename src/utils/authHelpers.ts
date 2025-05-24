
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserType } from '@/types/auth';
import { toast } from 'sonner';

export const handleUserSession = async (session: Session): Promise<AuthUserType | null> => {
  try {
    if (!session?.user) {
      return null;
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    
    if (!userId || !userEmail) {
      console.error('Invalid session: missing user ID or email');
      return null;
    }

    console.log('Processing user session for user:', userId);
    
    // Special case for our default admin account with enhanced validation
    if (userEmail === 'admin@digitalplacemaking.ca') {
      // Verify this is actually the admin user by checking additional metadata
      if (session.user.app_metadata?.provider === 'email' || session.user.aud === 'authenticated') {
        console.log('Verified admin account detected');
        return {
          id: userId,
          email: userEmail,
          role: 'admin',
          name: 'Admin User'
        };
      } else {
        console.error('Admin account verification failed');
        return null;
      }
    }
    
    // Try to get user role from user_roles table with proper error handling
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.warn('Error fetching user role:', roleError);
    }
    
    const userRole = roleData?.role === 'admin' ? 'admin' : 'manager';
    
    return {
      id: userId,
      email: userEmail,
      role: userRole,
      name: session.user.user_metadata?.name || userEmail.split('@')[0] || 'User'
    };
  } catch (error) {
    console.error('Error handling user session:', error);
    return null;
  }
};

export const loginUser = async (email: string, password: string) => {
  // Input validation
  if (!email || !password) {
    return { error: { message: 'Email and password are required' } };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: { message: 'Invalid email format' } };
  }

  // Password length validation
  if (password.length < 6) {
    return { error: { message: 'Password must be at least 6 characters long' } };
  }

  console.log('Attempting login for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    
    if (error) {
      console.error('Login error:', error);
      
      // Don't expose internal error details
      const userFriendlyMessage = error.message.includes('Invalid login credentials') 
        ? 'Invalid email or password'
        : 'Login failed. Please try again.';
      
      return { error: { message: userFriendlyMessage } };
    }
    
    console.log('Login successful for user:', data.user?.id);
    
    return {
      user: data.user,
      session: data.session
    };
  } catch (err) {
    console.error('Unexpected login error:', err);
    return { error: { message: 'An unexpected error occurred. Please try again.' } };
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    } else {
      toast.success('Logged out successfully');
    }
  } catch (error) {
    console.error('Unexpected logout error:', error);
    toast.error('Failed to log out');
  }
};
