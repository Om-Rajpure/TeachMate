import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { authService } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // Simulate checking local storage for a dummy session
      const storedUser = localStorage.getItem('teachmate_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, _password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create dummy user
    const dummyUser: User = {
      id: 1,
      username: username.split('@')[0] || 'teacher',
      email: username.includes('@') ? username : `${username}@teachmate.ai`,
      first_name: 'Smart',
      last_name: 'Teacher',
    };

    localStorage.setItem('teachmate_user', JSON.stringify(dummyUser));
    setUser(dummyUser);
  };

  const logout = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('teachmate_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
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
