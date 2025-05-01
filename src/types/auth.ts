
import { Session } from '@supabase/supabase-js';

export interface AuthUserType {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  name: string;
}

export interface AuthContextType {
  user: AuthUserType | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>; // Changed from Promise<void> to Promise<any>
  logout: () => Promise<void>;
}
