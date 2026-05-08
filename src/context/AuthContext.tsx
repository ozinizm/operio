import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: any | null;
  workspace: any | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: any, workspace: any, role: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [workspace, setWorkspace] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data.user);
      setWorkspace(data.workspace);
      setRole(data.role);
      
      // Sync to localStorage for interceptors
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('workspace', JSON.stringify(data.workspace));
      if (data.role) localStorage.setItem('role', data.role);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't remove token here immediately on random error, 
      // let response interceptor handle 401 specifically
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  /**
   * Called by LoginPage after it has already fetched /auth/me.
   * Sets token + all auth state in one synchronous batch so that
   * ProtectedRoute sees isAuthenticated === true before navigate() fires.
   */
  const setAuth = (token: string, userData: any, workspaceData: any, roleData: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('workspace', JSON.stringify(workspaceData));
    localStorage.setItem('role', roleData);
    setUser(userData);
    setWorkspace(workspaceData);
    setRole(roleData);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    localStorage.removeItem('role');
    localStorage.removeItem('operio_platform_manager_mode');
    localStorage.removeItem('operio_active_workspace_id');
    localStorage.removeItem('operio_active_workspace_name');
    localStorage.removeItem('operio_active_workspace_slug');
    setUser(null);
    setWorkspace(null);
    setRole(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        role,
        isAuthenticated: !!user,
        isLoading,
        setAuth,
        logout,
        refreshUser: fetchUser,
      }}
    >
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
