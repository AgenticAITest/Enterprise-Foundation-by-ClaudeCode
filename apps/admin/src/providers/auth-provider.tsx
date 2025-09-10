import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SuperAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin';
  permissions: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: SuperAdmin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SuperAdmin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('admin_token');
      
      if (savedToken) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Check if user is super_admin
            if (data.data.user.role === 'super_admin') {
              setUser(data.data.user);
              setToken(savedToken);
            } else {
              // Not a super admin, clear token
              localStorage.removeItem('admin_token');
              setToken(null);
            }
          } else {
            localStorage.removeItem('admin_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const { user, token } = data.data;
        
        // Only allow super_admin role
        if (user.role !== 'super_admin') {
          throw new Error('Access denied. Super admin role required.');
        }
        
        setUser(user);
        setToken(token);
        localStorage.setItem('admin_token', token);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const value = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    loading
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