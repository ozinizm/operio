import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { modulesApi } from '../services/modulesApi';
import type { SidebarModule } from '../services/modulesApi';
import { useAuth } from './AuthContext';

interface ModuleContextType {
  enabledModules: string[];
  sidebarModules: SidebarModule[];
  isModuleEnabled: (key: string) => boolean;
  refreshModules: () => Promise<void>;
  loading: boolean;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [sidebarModules, setSidebarModules] = useState<SidebarModule[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshModules = useCallback(async () => {
    // Guard: If no user or if Super Admin is in platform area without a workspace
    if (!user) return;
    
    const isPlatformManager = localStorage.getItem('operio_platform_manager_mode') === 'true';
    const isPlatformArea = window.location.pathname.startsWith('/platform');
    
    // Skip if Super Admin is in platform area AND not in manager mode
    if (user.is_super_admin && isPlatformArea && !isPlatformManager) {
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
      const normalizedEnabled = Array.isArray(enabledData) 
        ? enabledData 
        : (enabledData as any)?.items || [];
        
      const normalizedSidebar = Array.isArray(sidebarData)
        ? sidebarData
        : (sidebarData as any)?.items || [];

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
      refreshModules();
    } else {
      setEnabledModules([]);
      setSidebarModules([]);
      setLoading(false);
    }
  }, [user, refreshModules]);

  const isModuleEnabled = (key: string) => {
    // Core modules are always enabled in frontend logic for safety
    const coreModules = ['dashboard', 'customers', 'jobs', 'tasks', 'settings', 'modules'];
    if (coreModules.includes(key)) return true;
    return enabledModules.includes(key);
  };

  return (
    <ModuleContext.Provider value={{ enabledModules, sidebarModules, isModuleEnabled, refreshModules, loading }}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
