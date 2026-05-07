import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Menu, X, Bell, ChevronDown, LogOut, 
  UserCircle, ShieldCheck, Globe, Activity, Plus, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import PlatformSidebar from './PlatformSidebar';

export default function PlatformLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast('Başarıyla çıkış yapıldı.', 'success');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-jakarta">
      {/* Desktop Sidebar */}
      <PlatformSidebar />

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-80 bg-indigo-950 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 text-white">
            <div className="h-20 flex items-center justify-between px-6 border-b border-indigo-900/50">
              <span className="text-xl font-extrabold tracking-tighter">OPERIO PLATFORM</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-indigo-900 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
              <Link to="/platform" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-900 transition-all font-bold">
                <Globe className="w-5 h-5" /> Platform Paneli
              </Link>
              <Link to="/platform/workspaces" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-900 transition-all font-bold">
                <Globe className="w-5 h-5" /> İşletmeler
              </Link>
              <Link to="/platform/workspaces/new" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-900 transition-all font-bold">
                <Plus className="w-5 h-5" /> Yeni İşletme Kur
              </Link>
              <Link to="/platform/audit-logs" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-900 transition-all font-bold">
                <Activity className="w-5 h-5" /> Aktivite Kayıtları
              </Link>
              <Link to="/platform/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-900 transition-all font-bold">
                <Settings className="w-5 h-5" /> Sistem Ayarları
              </Link>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Platform Yönetim Modu</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded-2xl transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                  {user?.full_name?.charAt(0) || 'S'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-slate-800 leading-none">{user?.full_name || 'Super Admin'}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1 tracking-wider">
                    PLATFORM YÖNETİCİSİ
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block group-hover:rotate-180 transition-transform duration-300" />
              </button>

              <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-slate-100 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase opacity-50 tracking-widest mb-1">Hesabım</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                </div>
                <Link 
                  to="/platform/settings" 
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-slate-400" /> Sistem Ayarları
                </Link>
                <div className="my-2 border-t border-slate-100" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors font-bold">
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 no-scrollbar relative flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          
          <footer className="mt-12 py-8 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-medium">
              OPERIO PLATFORM ADMIN &copy; 2026. <span className="font-bold text-indigo-600/60">Fikir Software Operations Group</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
