
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserType } from '@/types/auth';
import { toast } from 'sonner';

export const handleUserSession = async (session: Session): Promise<AuthUserType | null> => {
  if (!session.user) return null;
  
  try {
    console.log('Processing user session for:', session.user.id);
    
    // First try using the has_role function which avoids RLS recursion
    const { data: roleData, error: roleError } = await supabase.rpc('has_role', { 
      user_id: session.user.id, 
      required_role: 'admin' 
    });
      
    console.log('Role check result:', { roleData, roleError });
    
    if (roleError) {
      console.error('Role check error:', roleError);
      
      // Fall back to direct query as a last resort
      const { data: directRoleData, error: directRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      console.log('Direct role check:', { directRoleData, directRoleError });
      
      if (directRoleError) {
        console.error('Direct role check error:', directRoleError);
        
        // If this is development, try to create an admin role
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
            
            // Return user with admin role after creating it
            return {
              id: session.user.id,
              email: session.user.email || '',
              role: 'admin',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User'
            };
          }
        } else {
          throw new Error('Unable to verify admin permissions');
        }
      }
      
      // If direct query found no admin role
      if (!directRoleData || directRoleData.role !== 'admin') {
        throw new Error('You do not have permission to access this area');
      }
      
      // Direct query found admin role
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: 'admin',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User'
      };
    }
    
    // If the role check returned false (not admin)
    if (roleData === false) {
      throw new Error('You do not have permission to access this area');
    }
    
    // Return user details
    return {
      id: session.user.id,
      email: session.user.email || '',
      role: 'admin',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User'
    };
    
  } catch (err: any) {
    console.error('User data error:', err);
    throw err;
  }
};

export const loginUser = async (email: string, password: string) => {
  console.log('Attempting login for:', email);
  
  const response = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (response.error) {
    console.error('Login error details:', response.error);
    
    // Check for specific errors to provide better guidance
    if (response.error.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email before logging in');
    } else if (response.error.message.includes('Invalid login')) {
      throw new Error('Invalid email or password. Please try again');
    } else {
      throw response.error;
    }
  }
  
  console.log('Login successful, user:', response.data?.user?.id);
  toast.success('Login successful');
  
  return response.data;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Logout error:', error);
    throw error;
  }
  
  toast.success('Logged out successfully');
};
