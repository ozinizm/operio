import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Briefcase, CheckSquare, 
  Settings, Activity, Truck, AlertCircle, DollarSign, 
  Folder, BarChart2, Package, Search, Menu, X, Bell,
  Box, FileSpreadsheet, Database, ShieldCheck, UserCheck, 
  Globe, Wrench, Car, Users2, PieChart, Settings2, MessageCircle,
  Plus, ChevronDown, LogOut, UserCircle, CreditCard,
  Layers, BarChart3
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useModules } from '../../context/ModuleContext';
import { NotificationDropdown } from '../collaboration/NotificationDropdown';
import { GlobalQuickCreateModal, type QuickCreateType } from '../shared/GlobalQuickCreateModal';

const iconMap: Record<string, any> = {
  LayoutDashboard, Users, FileText, Briefcase, CheckSquare, 
  Settings, Activity, Truck, AlertCircle, DollarSign, 
  Folder, BarChart2, Package, Search, Menu, X, Bell,
  Box, FileSpreadsheet, Database, ShieldCheck, UserCheck, 
  Globe, Tool: Wrench, Car, Users2, PieChart, Settings2, MessageCircle,
  Layers, BarChart3
};

const coreLabelMap: Record<string, string> = {
  'Dashboard': 'Panel',
  'Modules': 'Modül Mağazası',
  'Settings': 'Ayarlar',
  'Customers': 'Müşteriler',
  'Jobs': 'İş ve Siparişler',
  'Tasks': 'Görevler',
  'Offers': 'Teklifler',
  'Finance': 'Finans',
  'Operations': 'Operasyon',
  'Inventory': 'Stok Yönetimi',
  'Reports': 'Raporlar',
  'Files': 'Dosyalar',
  'Notifications': 'Bildirimler',
  'Data Import': 'Veri Aktarımı',
  'Delivery Service': 'Teslimat & Servis',
  'Complaints & Requests': 'Şikayet & Talep'
};

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<QuickCreateType>(null);
  const { showToast } = useToast();
  const { user, workspace, role, logout } = useAuth();
  const { sidebarModules, isModuleEnabled } = useModules();
  const navigate = useNavigate();
  
  const quickCreateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target as Node)) {
        setIsQuickCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickAction = (type: QuickCreateType) => {
    setQuickCreateType(type);
    setIsQuickCreateOpen(false);
  };

  const isPlatformManager = localStorage.getItem('operio_platform_manager_mode') === 'true';
  const activeWorkspaceName = localStorage.getItem('operio_active_workspace_name');

  const handleExitPlatformManager = () => {
    localStorage.removeItem('operio_platform_manager_mode');
    localStorage.removeItem('operio_active_workspace_id');
    localStorage.removeItem('operio_active_workspace_name');
    localStorage.removeItem('operio_active_workspace_slug');
    
    showToast('Platform yönetici modundan çıkıldı.', 'info');
    navigate('/platform/workspaces');
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('operio_platform_manager_mode');
    localStorage.removeItem('operio_active_workspace_id');
    localStorage.removeItem('operio_active_workspace_name');
    localStorage.removeItem('operio_active_workspace_slug');
    logout();
    navigate('/login');
    showToast('Başarıyla çıkış yapıldı.', 'success');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col">
      {/* Platform Manager Banner */}
      {isPlatformManager && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-center gap-4 shadow-lg z-50 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold tracking-tight">
              PLATFORM YÖNETİCİ MODU: <span className="opacity-75 font-medium ml-1">Şu anda {activeWorkspaceName} çalışma alanını yönetiyorsunuz.</span>
            </span>
          </div>
          <button 
            onClick={handleExitPlatformManager}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
          >
            Platform Paneline Dön
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-border shadow-xl z-30 transition-all duration-300">
        <div className="h-20 flex items-center px-8 border-b border-border">
          <Link to={user?.is_super_admin ? "/platform" : "/dashboard"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-jakarta font-bold text-text-high tracking-tight">OPERİO</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar">
          {(() => {
            const seenRoutes = new Set();
            return sidebarModules
              .filter(item => {
                if (!item || !item.route || !item.label) return false;
                if (seenRoutes.has(item.route)) return false;
                
                // Only show if module is enabled
                const coreKeys = ['dashboard', 'customers', 'jobs', 'settings'];
                if (item.key && !coreKeys.includes(item.key) && !isModuleEnabled(item.key)) {
                  return false;
                }

                // Hide modules page from customer panel
                if (item.key === 'modules') {
                  return false;
                }
                
                seenRoutes.add(item.route);
                return true;
              })
              .map((item) => {
                const Icon = iconMap[item.icon] || Package;
                const label = coreLabelMap[item.label] || item.label;
                return (
                  <NavLink
                    key={item.key || item.route}
                    to={item.route}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'text-text-body hover:bg-surface-dim hover:text-text-high'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="text-sm font-semibold">{label}</span>
                  </NavLink>
                );
              });
          })()}

        </nav>
        <div className="p-4 border-t border-border">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-xs text-text-body font-bold uppercase opacity-60 mb-2">Çalışma Alanı</p>
            <p className="text-sm font-jakarta font-bold text-text-high truncate">{isPlatformManager ? activeWorkspaceName : (workspace?.name || 'Operio Workspace')}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-border">
              <span className="text-2xl font-jakarta font-bold text-text-high tracking-tight">OPERİO</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-surface-dim rounded-xl transition-colors">
                <X className="w-6 h-6 text-text-body" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {(() => {
                const seenRoutes = new Set();
                return sidebarModules
                  .filter(item => {
                    if (!item || !item.route || !item.label) return false;
                    if (seenRoutes.has(item.route)) return false;
                    
                    // Only show if module is enabled
                    const coreKeys = ['dashboard', 'customers', 'jobs', 'settings'];
                    if (item.key && !coreKeys.includes(item.key) && !isModuleEnabled(item.key)) {
                      return false;
                    }
                    
                    seenRoutes.add(item.route);
                    return true;
                  })
                  .map((item) => {
                    const Icon = iconMap[item.icon] || Package;
                    const label = coreLabelMap[item.label] || item.label;
                    return (
                      <NavLink
                        key={item.key || item.route}
                        to={item.route}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive 
                              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                              : 'text-text-body hover:bg-surface-dim hover:text-text-high'
                          }`
                        }
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{label}</span>
                      </NavLink>
                    );
                  });
              })()}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-surface-dim rounded-xl transition-colors">
              <Menu className="w-6 h-6 text-text-body" />
            </button>
            <div className="hidden lg:flex items-center gap-3 text-text-body">
              <div className="p-2 bg-surface-dim rounded-xl">
                <Search className="w-5 h-5" />
              </div>
              <input type="text" placeholder="Operio'da ara..." className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-text-body/50" />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            {/* Quick Create */}
            <div className="relative" ref={quickCreateRef}>
              <button 
                onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                className="hidden sm:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-jakarta font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Yeni İşlem
              </button>
              <button 
                onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                className="sm:hidden p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              {isQuickCreateOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-border py-3 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 border-b border-border mb-2">
                    <p className="text-[10px] font-bold text-text-body uppercase tracking-wider">Hızlı İşlemler</p>
                  </div>
                  <button onClick={() => handleQuickAction('customer')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                    <Users className="w-4 h-4 text-blue-500" /> Yeni Müşteri
                  </button>
                  {isModuleEnabled('offers') && (
                    <button onClick={() => handleQuickAction('offer')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                      <FileText className="w-4 h-4 text-indigo-500" /> Yeni Teklif
                    </button>
                  )}
                  <button onClick={() => handleQuickAction('job')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                    <Briefcase className="w-4 h-4 text-amber-500" /> Yeni İş / Sipariş
                  </button>
                  <button onClick={() => handleQuickAction('task')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> Yeni Görev
                  </button>
                  {isModuleEnabled('inventory') && (
                    <button onClick={() => handleQuickAction('inventory_item')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                      <Package className="w-4 h-4 text-emerald-500" /> Yeni Stok Kalemi
                    </button>
                  )}
                  {isModuleEnabled('finance') && (
                    <button onClick={() => handleQuickAction('finance')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                      <DollarSign className="w-4 h-4 text-teal-500" /> Yeni Finans Kaydı
                    </button>
                  )}
                  {isModuleEnabled('delivery_service') && (
                    <button onClick={() => handleQuickAction('delivery_service' as any)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                      <Truck className="w-4 h-4 text-orange-500" /> Yeni Teslimat / Servis
                    </button>
                  )}
                  {isModuleEnabled('complaints_requests') && (
                    <button onClick={() => handleQuickAction('request_ticket' as any)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left">
                      <MessageCircle className="w-4 h-4 text-red-500" /> Yeni Şikayet / Talep
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-border hidden sm:block" />
            
            <NotificationDropdown />

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 p-1 hover:bg-surface-dim rounded-2xl transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-jakarta font-bold shadow-lg shadow-primary/20">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-text-high leading-none">{user?.full_name || 'Kullanıcı'}</p>
                  <p className="text-[10px] font-bold text-primary uppercase mt-1 tracking-wider opacity-70">
                    {role === 'owner' ? 'İşletme Sahibi' : role === 'manager' ? 'Yönetici' : 'Personel'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-text-body hidden lg:block group-hover:rotate-180 transition-transform duration-300" />
              </button>

              <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-border mb-2">
                  <p className="text-[10px] font-bold text-text-body uppercase opacity-50 tracking-widest mb-1">Hesabım</p>
                  <p className="text-xs font-bold text-text-high truncate">{user?.email}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                  <UserCircle className="w-4 h-4 text-text-body" /> Profil Bilgileri
                </button>
                {user?.is_super_admin ? (
                  <Link to="/platform/settings" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                    <Settings className="w-4 h-4 text-text-body" /> Sistem Ayarları
                  </Link>
                ) : (
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                    <CreditCard className="w-4 h-4 text-text-body" /> Abonelik ve Plan
                  </button>
                )}
                <div className="my-2 border-t border-border" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors font-bold">
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 bg-background/50 no-scrollbar relative flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          
          <footer className="mt-12 py-8 border-t border-border/50 text-center">
            <p className="text-xs text-text-body opacity-60">
              © 2026 Operio. <span className="font-bold">Fikir Creative</span> tarafından geliştirilmiştir. Tüm hakları saklıdır.
            </p>
          </footer>
        </main>
      </div>
    </div>

      <GlobalQuickCreateModal 
        type={quickCreateType} 
        onClose={() => setQuickCreateType(null)} 
      />
    </div>
  );
}
