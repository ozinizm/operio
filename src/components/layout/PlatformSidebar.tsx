import { Link, NavLink } from 'react-router-dom';
import { 
  Globe, Activity, Settings, Plus, LayoutDashboard,
  Database
} from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';

export default function PlatformSidebar() {

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-indigo-950 text-indigo-100 border-r border-indigo-900 shadow-2xl z-30 transition-all duration-300">
      <div className="h-20 flex items-center px-8 border-b border-indigo-900/50">
        <Link to="/platform" className="flex items-center group">
          <BrandLogo variant="white" size="md" isPlatform={true} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 no-scrollbar">
        <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4 opacity-70">Ana Yönetim</p>
        
        <NavLink
          to="/platform"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-bold">Platform Paneli</span>
        </NavLink>

        <NavLink
          to="/platform/workspaces"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`
          }
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm font-bold">İşletmeler</span>
        </NavLink>

        <NavLink
          to="/platform/workspaces/new"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`
          }
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-bold">Yeni İşletme Kur</span>
        </NavLink>

        <div className="pt-6 pb-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4 opacity-70">Sistem & Güvenlik</p>
        </div>

        <NavLink
          to="/platform/audit-logs"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`
          }
        >
          <Activity className="w-5 h-5" />
          <span className="text-sm font-bold">Aktivite Kayıtları</span>
        </NavLink>

        <NavLink
          to="/platform/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-bold">Sistem Ayarları</span>
        </NavLink>
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-indigo-900/40 rounded-2xl p-4 border border-indigo-800/50">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 opacity-70">Operio Cloud</p>
          <div className="flex items-center gap-2 text-white">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold">v1.2.0-Production</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
