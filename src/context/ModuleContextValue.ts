import { createContext, useContext } from 'react';
import type { SidebarModule } from '../services/modulesApi';

export interface ModuleContextType {
  enabledModules: string[];
  sidebarModules: SidebarModule[];
  isModuleEnabled: (key: string) => boolean;
  refreshModules: () => Promise<void>;
  loading: boolean;
}

export const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (!context) throw new Error('useModules must be used within a ModuleProvider');
  return context;
};
