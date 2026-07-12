import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../services/authApi';
import { normalizeRole } from '../utils/permissions';
import type { AuthUser, WorkspaceSummary } from '../types/domain';
import { AuthContext } from './AuthContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hydrationRef = useRef<Promise<void> | null>(null);

  const fetchUser = useCallback(async () => {
    if (hydrationRef.current) return hydrationRef.current;
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setWorkspace(null);
      setRole(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    hydrationRef.current = (async () => {
      try {
        const data = await authApi.me();
        setUser(data.user);
        setWorkspace(data.workspace);
        const canonicalRole = normalizeRole(data.role);
        setRole(canonicalRole);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('workspace', JSON.stringify(data.workspace));
        if (canonicalRole) localStorage.setItem('role', canonicalRole);
        localStorage.removeItem('workspace_member_role');
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
        hydrationRef.current = null;
      }
    })();
    return hydrationRef.current;
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchUser);
    const expire = () => {
      setUser(null);
      setWorkspace(null);
      setRole(null);
      setIsLoading(false);
    };
    window.addEventListener('tavelya:auth-expired', expire);
    return () => window.removeEventListener('tavelya:auth-expired', expire);
  }, [fetchUser]);

  /**
   * Called by LoginPage after it has already fetched /auth/me.
   * Sets token + all auth state in one synchronous batch so that
   * ProtectedRoute sees isAuthenticated === true before navigate() fires.
   */
  const setAuth = (token: string, userData: AuthUser, workspaceData: WorkspaceSummary | null, roleData: string) => {
    const canonicalRole = normalizeRole(roleData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('workspace', JSON.stringify(workspaceData));
    if (canonicalRole) localStorage.setItem('role', canonicalRole);
    localStorage.removeItem('workspace_member_role');
    setUser(userData);
    setWorkspace(workspaceData);
    setRole(canonicalRole);
    setIsLoading(false);
  };

  const clearAuth = () => {
    // 1. Define all keys to clear
    const keysToRemove = [
      'token', 'access_token', 'user', 'workspace', 'role',
      'workspace_member_role',
      'operio_platform_manager_mode', 
      'operio_active_workspace_id',
      'operio_active_workspace_name', 
      'operio_active_workspace_slug',
      'active_workspace_id',
      'platform_manager_context',
      'platformWorkspaceContext',
      'enabledModules',
      'sidebarModules'
    ];
    
    // 2. Clear localStorage
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 3. Reset React State
    setUser(null);
    setWorkspace(null);
    setRole(null);
  };

  const logout = () => {
    clearAuth();
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
        clearAuth,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
