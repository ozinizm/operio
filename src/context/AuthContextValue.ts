import { createContext, useContext } from 'react';
import type { AuthUser, WorkspaceSummary } from '../types/domain';

export interface AuthContextType {
  user: AuthUser | null;
  workspace: WorkspaceSummary | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser, workspace: WorkspaceSummary | null, role: string) => void;
  logout: () => void;
  clearAuth: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
