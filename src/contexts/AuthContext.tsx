
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

// Mock user data (replace with real authentication later)
const mockUsers = [
  {
    id: '1',
    email: 'admin@toronto.ca',
    password: 'toronto2025',
    role: 'admin' as const,
    name: 'Admin User'
  },
  {
    id: '2',
    email: 'manager@toronto.ca',
    password: 'manager2025',
    role: 'manager' as const,
    name: 'Community Manager'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('communityPulseUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('communityPulseUser');
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API request delay
    setTimeout(() => {
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        // Create a sanitized user object (remove password)
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('communityPulseUser', JSON.stringify(userWithoutPassword));
      } else {
        setError('Invalid login credentials');
      }
      
      setIsLoading(false);
    }, 800);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('communityPulseUser');
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
