
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserInfo {
  email?: string;
  name?: string;
  provider?: string;
}

export function useAuthState() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Set user info directly from session data since we don't have a profiles table
      setUserInfo({
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      });
    }
  };

  return { userInfo, setUserInfo };
}
