
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserType } from '@/types/auth';
import { toast } from 'sonner';

export const handleUserSession = async (session: Session): Promise<AuthUserType | null> => {
  if (!session.user) return null;
  
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
          
          // Return user with admin role after creating it
          return {
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User'
          };
        }
      } else {
        throw new Error('Not authorized to access admin area');
      }
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
  
  return data;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Logout error:', error);
    throw error;
  }
  
  toast.success('Logged out successfully');
};
