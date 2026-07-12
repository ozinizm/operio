import React, { useEffect, useState, useCallback } from 'react';
import { modulesApi } from '../services/modulesApi';
import type { SidebarModule } from '../services/modulesApi';
import { useAuth } from './AuthContextValue';
import { ModuleContext } from './ModuleContextValue';

const unwrapItems = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'items' in value) {
    const items = (value as { items?: unknown }).items;
    return Array.isArray(items) ? items as T[] : [];
  }
  return [];
};

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [sidebarModules, setSidebarModules] = useState<SidebarModule[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshModules = useCallback(async () => {
    // Guard: If no user or if Super Admin is in platform area without a workspace
    if (!user) return;
    
    const isPlatformManager = localStorage.getItem('operio_platform_manager_mode') === 'true';
    const activeWorkspaceId = localStorage.getItem('operio_active_workspace_id');
    const isPlatformArea = window.location.pathname.startsWith('/platform');
    
    // Skip if Super Admin is in platform area AND not in manager mode
    if (user.is_super_admin && isPlatformArea && !isPlatformManager) {
      setLoading(false);
      return;
    }

    // Skip if Super Admin is in platform manager mode but no workspace ID is present yet
    if (user.is_super_admin && isPlatformManager && !activeWorkspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [enabledData, sidebarData] = await Promise.all([
        modulesApi.getEnabled(),
        modulesApi.getSidebar()
      ]);
      
      // Aggressive normalization
      const normalizedEnabled = unwrapItems<string>(enabledData);
      const normalizedSidebar = unwrapItems<SidebarModule>(sidebarData);

      setEnabledModules(normalizedEnabled);
      setSidebarModules(normalizedSidebar);
    } catch (err) {
      console.error('Failed to load modules:', err);
      // For Super Admin or in case of error, set empty to avoid persistent loading state
      setEnabledModules([]);
      setSidebarModules([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void Promise.resolve().then(refreshModules);
    } else {
      void Promise.resolve().then(() => {
        setEnabledModules([]);
        setSidebarModules([]);
        setLoading(false);
      });
    }
  }, [user, refreshModules]);

  const isModuleEnabled = (key: string) => {
    // Core modules are always enabled in frontend logic for safety
    const coreModules = ['dashboard', 'customers', 'jobs', 'settings'];
    if (coreModules.includes(key)) return true;
    return enabledModules.includes(key);
  };

  return (
    <ModuleContext.Provider value={{ enabledModules, sidebarModules, isModuleEnabled, refreshModules, loading }}>
      {children}
    </ModuleContext.Provider>
  );
};
