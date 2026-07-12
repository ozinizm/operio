import { Link, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Briefcase, CheckSquare, 
  Settings, Activity, Truck, AlertCircle, DollarSign, 
  Folder, BarChart2, Package, Search, Menu, X, Bell,
  Box, FileSpreadsheet, Database, ShieldCheck, UserCheck, 
  Globe, Wrench, Car, Users2, PieChart, Settings2, MessageCircle,
  Plus, ChevronDown, LogOut, Home, MoreHorizontal, UserCircle,
  Layers, BarChart3
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '../ui/ToastContext';
import { useAuth } from '../../context/AuthContextValue';
import { BrandLogo } from '../brand/BrandLogo';
import { useModules } from '../../context/ModuleContextValue';
import { can } from '../../utils/permissions';
import { searchApi, type GlobalSearchResponse } from '../../services/searchApi';
import { NotificationDropdown } from '../collaboration/NotificationDropdown';
import { GlobalQuickCreateModal, type QuickCreateType } from '../shared/GlobalQuickCreateModal';

const iconMap: Record<string, LucideIcon> = {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const { showToast } = useToast();
  const { user, workspace, role, logout } = useAuth();
  const { sidebarModules, isModuleEnabled } = useModules();
  const navigate = useNavigate();
  const location = useLocation();

  const mobilePageTitle = (() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Panel';
    if (path.startsWith('/customers/')) return 'Müşteri Detayı';
    if (path.startsWith('/customers')) return 'Müşteriler';
    if (path.startsWith('/jobs/')) return 'İş Detayı';
    if (path.startsWith('/jobs')) return 'İşler';
    if (path.startsWith('/team')) return 'Ekip Yönetimi';
    if (path.startsWith('/modules')) return 'Modüller';
    if (path.startsWith('/settings')) return 'Ayarlar';
    return 'Tavelya';
  })();
  
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

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setSearchResults(await searchApi.search(query));
      } catch {
        setSearchResults(null);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const selectSearchResult = (path: string) => {
    setSearchQuery('');
    setSearchResults(null);
    setIsMobileSearchOpen(false);
    navigate(path);
  };

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
    <div className="flex h-[100dvh] min-h-0 bg-background overflow-hidden flex-col">
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-border shadow-xl z-30 transition-all duration-300">
        <div className="h-20 flex items-center px-8 border-b border-border">
          <Link to={user?.is_super_admin ? "/platform" : "/dashboard"} className="flex items-center group">
            <BrandLogo size="md" />
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

                // RBAC Filtering
                const roleRestrictions: Record<string, string[]> = {
                  'finance': ['owner', 'admin', 'finance'],
                  'reports': ['owner', 'admin', 'manager'],
                  'data_import': ['owner', 'admin'],
                  'modules': ['owner', 'admin'],
                  'settings': ['owner', 'admin'],
                  'customers': ['owner', 'admin', 'manager', 'finance', 'staff'],
                  'complaints': ['owner', 'admin', 'manager', 'staff'],
                  'offers': ['owner', 'admin', 'manager', 'finance']
                };

                if (item.key && roleRestrictions[item.key] && !roleRestrictions[item.key].includes(role || '')) {
                  return false;
                }

                if ((item.key === 'settings' || item.key === 'modules')
                  && !can(role, 'workspace:manage', !!user?.is_super_admin)) {
                  return false;
                }

                // Hide certain items from staff that aren't modules but routes
                if (role === 'staff' && (item.route === '/settings' || item.route === '/modules')) {
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
          
          {can(role, 'team:manage', !!user?.is_super_admin) && (
            <NavLink
              to="/team"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-text-body hover:bg-surface-dim hover:text-text-high'
                }`
              }
            >
              <Users2 className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-semibold">Ekip Yönetimi</span>
            </NavLink>
          )}

        </nav>
        <div className="p-4 border-t border-border">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-xs text-text-body font-bold uppercase opacity-60 mb-2">Çalışma Alanı</p>
            <p className="text-sm font-jakarta font-bold text-text-high truncate">{isPlatformManager ? activeWorkspaceName : (workspace?.name || 'Tavelya Workspace')}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-[min(20rem,calc(100vw-2rem))] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-border">
              <BrandLogo size="md" />
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

                    // RBAC Filtering
                    const roleRestrictions: Record<string, string[]> = {
                      'finance': ['owner', 'admin', 'finance'],
                      'reports': ['owner', 'admin', 'manager'],
                      'data_import': ['owner', 'admin'],
                      'modules': ['owner', 'admin'],
                      'settings': ['owner', 'admin'],
                      'customers': ['owner', 'admin', 'manager', 'finance', 'staff'],
                      'complaints': ['owner', 'admin', 'manager', 'staff'],
                      'offers': ['owner', 'admin', 'manager', 'finance']
                    };

                    if (item.key && roleRestrictions[item.key] && !roleRestrictions[item.key].includes(role || '')) {
                      return false;
                    }

                    if ((item.key === 'settings' || item.key === 'modules')
                      && !can(role, 'workspace:manage', !!user?.is_super_admin)) {
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
              
              {can(role, 'team:manage', !!user?.is_super_admin) && (
                <NavLink
                  to="/team"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-text-body hover:bg-surface-dim hover:text-text-high'
                    }`
                  }
                >
                  <Users2 className="w-5 h-5" />
                  <span className="font-semibold">Ekip Yönetimi</span>
                </NavLink>
              )}
            </nav>
            <div className="p-4 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" /> Çıkış Yap
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile App Bar */}
        <header className="md:hidden h-16 pt-[env(safe-area-inset-top)] bg-white/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sticky top-0 z-40 flex-shrink-0">
          <Link to="/dashboard" aria-label="Panel" className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/5">
            <BrandLogo size="sm" />
          </Link>
          <h1 className="min-w-0 flex-1 px-3 text-center text-base font-jakarta font-bold text-text-high leading-tight line-clamp-2">{mobilePageTitle}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMobileSearchOpen(true)} aria-label="Ara" title="Ara" className="w-9 h-9 flex items-center justify-center rounded-xl text-text-body hover:bg-surface-dim">
              <Search className="w-5 h-5" />
            </button>
            <NotificationDropdown />
            <button onClick={() => setIsMobileProfileOpen(true)} aria-label="Profil" title="Profil" className="w-9 h-9 rounded-xl bg-primary text-white font-bold text-sm">
              {user?.full_name?.charAt(0) || 'K'}
            </button>
          </div>
        </header>

        {/* Desktop / Tablet Header */}
        <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-md border-b border-border items-center justify-between px-4 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-surface-dim rounded-xl transition-colors">
              <Menu className="w-6 h-6 text-text-body" />
            </button>
            <div className="hidden lg:flex items-center gap-3 text-text-body relative">
              <div className="p-2 bg-surface-dim rounded-xl">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tavelya'da ara..."
                className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-text-body/50"
              />
              {searchQuery.trim().length >= 2 && searchResults && (
                <div className="absolute left-0 top-12 w-96 max-h-96 overflow-y-auto bg-white border border-border rounded-2xl shadow-2xl z-50 p-2">
                  {([
                    ['Müşteriler', searchResults.customers],
                    ['İşler', searchResults.jobs],
                    ['Kişiler', searchResults.people],
                  ] as const).map(([title, results]) => results.length > 0 && (
                    <div key={title} className="py-1">
                      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-body/60">{title}</p>
                      {results.map((result) => (
                        <button
                          key={`${title}-${result.id}`}
                          onClick={() => selectSearchResult(result.path)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-dim transition-colors"
                        >
                          <span className="block text-sm font-semibold text-text-high">{result.label}</span>
                          {result.subtitle && <span className="block text-xs text-text-body">{result.subtitle}</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                  {[...searchResults.customers, ...searchResults.jobs, ...searchResults.people].length === 0 && (
                    <p className="px-3 py-6 text-sm text-center text-text-body">Sonuç bulunamadı.</p>
                  )}
                </div>
              )}
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
                  {isModuleEnabled('customers') && can(role, 'customer:create', !!user?.is_super_admin) && (
                    <button onClick={() => handleQuickAction('customer')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <Users className="w-4 h-4 text-blue-500" /> Yeni Müşteri
                    </button>
                  )}
                  {isModuleEnabled('offers') && (
                    <button onClick={() => handleQuickAction('offer')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <FileText className="w-4 h-4 text-indigo-500" /> Yeni Teklif
                    </button>
                  )}
                  {isModuleEnabled('jobs') && can(role, 'job:create', !!user?.is_super_admin) && (
                    <button onClick={() => handleQuickAction('job')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <Briefcase className="w-4 h-4 text-amber-500" /> Yeni İş / Sipariş
                    </button>
                  )}
                  {isModuleEnabled('tasks') && (
                    <button onClick={() => handleQuickAction('task')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <CheckSquare className="w-4 h-4 text-emerald-500" /> Yeni Görev
                    </button>
                  )}
                  {isModuleEnabled('inventory') && (
                    <button onClick={() => handleQuickAction('inventory_item')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <Package className="w-4 h-4 text-emerald-600" /> Yeni Stok Kalemi
                    </button>
                  )}
                  {isModuleEnabled('finance') && (role === 'owner' || role === 'admin' || role === 'finance') && (
                    <button onClick={() => handleQuickAction('finance')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <DollarSign className="w-4 h-4 text-teal-500" /> Yeni Finans Kaydı
                    </button>
                  )}
                  {isModuleEnabled('delivery_service') && (
                    <button onClick={() => handleQuickAction('delivery_service')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                      <Truck className="w-4 h-4 text-orange-500" /> Yeni Teslimat / Servis
                    </button>
                  )}
                  {isModuleEnabled('complaints') && (
                    <button onClick={() => handleQuickAction('request_ticket')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
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
                    {role === 'owner' ? 'İşletme Sahibi' : role === 'manager' ? 'Yönetici' : role === 'admin' ? 'Yönetici' : 'Personel'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-text-body hidden lg:block group-hover:rotate-180 transition-transform duration-300" />
              </button>

              <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-border mb-2">
                  <p className="text-[10px] font-bold text-text-body uppercase opacity-50 tracking-widest mb-1">Hesabım</p>
                  <p className="text-xs font-bold text-text-high truncate">{user?.email}</p>
                </div>
                <Link to="/change-password" title="Şifre Değiştir" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Şifre Değiştir
                </Link>
                {user?.is_super_admin ? (
                  <Link to="/platform/settings" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                    <Settings className="w-4 h-4 text-text-body" /> Sistem Ayarları
                  </Link>
                ) : (role === 'owner' || role === 'admin') ? (
                  <Link to="/settings" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-high hover:bg-surface-dim text-left transition-colors">
                    <Settings2 className="w-4 h-4 text-text-body" /> İşletme Ayarları
                  </Link>
                ) : null}
                <div className="my-2 border-t border-border" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors font-bold">
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 md:pb-8 lg:p-10 lg:pb-10 bg-background/50 no-scrollbar relative flex flex-col scroll-smooth">
          <div className="flex-1">
            <Outlet />
          </div>
          
          <footer className="hidden md:block mt-12 py-8 border-t border-border/50 text-center">
            <p className="text-xs text-text-body opacity-60">
              © 2026 Tavelya. <span className="font-bold">Fikir Creative</span> tarafından geliştirilmiştir. Tüm hakları saklıdır.
            </p>
          </footer>
        </main>

        <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-xl border-t border-border grid grid-cols-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          {[
            { to: '/dashboard', label: 'Panel', icon: Home },
            { to: '/customers', label: 'Müşteriler', icon: Users },
            { to: '/jobs', label: 'İşler', icon: Briefcase },
          ].map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}/`));
            return <Link key={item.to} to={item.to} className={`min-w-0 flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? 'text-primary' : 'text-text-body/70'}`}>
              <Icon className="w-5 h-5" /><span className="truncate max-w-full px-1">{item.label}</span>
            </Link>;
          })}
          <button onClick={() => setIsMobileMenuOpen(true)} className="min-w-0 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-text-body/70" aria-label="Daha Fazla">
            <MoreHorizontal className="w-5 h-5" /><span>Daha Fazla</span>
          </button>
        </nav>

        {(can(role, 'customer:create', !!user?.is_super_admin) || can(role, 'job:create', !!user?.is_super_admin)) && (
          <button onClick={() => setIsQuickCreateOpen(true)} aria-label="Yeni İşlem" title="Yeni İşlem" className="md:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 w-12 h-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </button>
        )}

        {isMobileSearchOpen && (
          <div className="md:hidden fixed inset-0 z-[70] bg-white flex flex-col pt-[env(safe-area-inset-top)]" role="dialog" aria-modal="true" aria-label="Global arama">
            <div className="h-16 px-4 border-b border-border flex items-center gap-3 flex-shrink-0">
              <Search className="w-5 h-5 text-text-body flex-shrink-0" />
              <input autoFocus type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Müşteri, iş veya kişi ara..." className="min-w-0 flex-1 h-11 bg-surface-dim rounded-xl px-4 text-base outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={() => setIsMobileSearchOpen(false)} aria-label="Aramayı kapat" title="Kapat" className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-dim"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
              {searchQuery.trim().length < 2 ? (
                <p className="py-12 text-center text-sm text-text-body">Aramak için en az iki karakter girin.</p>
              ) : searchResults ? (
                <div className="space-y-5">
                  {([['Müşteriler', searchResults.customers], ['İşler', searchResults.jobs], ['Kişiler', searchResults.people]] as const).map(([title, results]) => results.length > 0 && (
                    <section key={title}>
                      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-body/60">{title}</h2>
                      <div className="space-y-2">
                        {results.map(result => <button key={`${title}-${result.id}`} onClick={() => selectSearchResult(result.path)} className="w-full min-w-0 text-left p-4 rounded-2xl border border-border bg-white shadow-soft">
                          <span className="block font-bold text-text-high break-words">{result.label}</span>
                          {result.subtitle && <span className="block mt-1 text-sm text-text-body break-words">{result.subtitle}</span>}
                        </button>)}
                      </div>
                    </section>
                  ))}
                  {[...searchResults.customers, ...searchResults.jobs, ...searchResults.people].length === 0 && <p className="py-12 text-center text-sm text-text-body">Sonuç bulunamadı.</p>}
                </div>
              ) : <p className="py-12 text-center text-sm text-text-body">Sonuçlar aranıyor...</p>}
            </div>
          </div>
        )}

        {isQuickCreateOpen && (
          <div className="md:hidden fixed inset-0 z-[70] flex items-end" role="dialog" aria-modal="true" aria-label="Yeni işlem">
            <button className="absolute inset-0 bg-text-high/40 backdrop-blur-sm" onClick={() => setIsQuickCreateOpen(false)} aria-label="Yeni işlem menüsünü kapat" />
            <div className="relative w-full max-h-[80dvh] overflow-y-auto bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-modal">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-jakarta font-bold text-text-high">Yeni İşlem</h2><button onClick={() => setIsQuickCreateOpen(false)} aria-label="Kapat" className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-dim"><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-1 gap-2">
                {isModuleEnabled('customers') && can(role, 'customer:create', !!user?.is_super_admin) && <button onClick={() => handleQuickAction('customer')} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl bg-surface-dim text-left font-semibold"><Users className="w-5 h-5 text-blue-500" /> Yeni Müşteri</button>}
                {isModuleEnabled('jobs') && can(role, 'job:create', !!user?.is_super_admin) && <button onClick={() => handleQuickAction('job')} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl bg-surface-dim text-left font-semibold"><Briefcase className="w-5 h-5 text-amber-500" /> Yeni İş / Sipariş</button>}
                {isModuleEnabled('offers') && <button onClick={() => handleQuickAction('offer')} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl bg-surface-dim text-left font-semibold"><FileText className="w-5 h-5 text-indigo-500" /> Yeni Teklif</button>}
                {isModuleEnabled('tasks') && <button onClick={() => handleQuickAction('task')} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl bg-surface-dim text-left font-semibold"><CheckSquare className="w-5 h-5 text-emerald-500" /> Yeni Görev</button>}
              </div>
            </div>
          </div>
        )}

        {isMobileProfileOpen && (
          <div className="md:hidden fixed inset-0 z-[70] flex items-end" role="dialog" aria-modal="true" aria-label="Profil">
            <button className="absolute inset-0 bg-text-high/40 backdrop-blur-sm" onClick={() => setIsMobileProfileOpen(false)} aria-label="Profil menüsünü kapat" />
            <div className="relative w-full bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-modal">
              <div className="flex items-center gap-3 pb-4 mb-3 border-b border-border"><UserCircle className="w-10 h-10 text-primary" /><div className="min-w-0"><p className="font-bold text-text-high truncate">{user?.full_name || 'Kullanıcı'}</p><p className="text-sm text-text-body truncate">{user?.email}</p></div><button onClick={() => setIsMobileProfileOpen(false)} aria-label="Kapat" className="ml-auto w-10 h-10 rounded-xl flex items-center justify-center bg-surface-dim"><X className="w-5 h-5" /></button></div>
              <Link to="/change-password" onClick={() => setIsMobileProfileOpen(false)} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl hover:bg-surface-dim"><ShieldCheck className="w-5 h-5 text-primary" /> Şifre Değiştir</Link>
              {user?.is_super_admin ? <Link to="/platform/settings" onClick={() => setIsMobileProfileOpen(false)} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl hover:bg-surface-dim"><Settings className="w-5 h-5" /> Sistem Ayarları</Link> : can(role, 'workspace:manage', false) ? <Link to="/settings" onClick={() => setIsMobileProfileOpen(false)} className="min-h-12 flex items-center gap-3 px-4 rounded-2xl hover:bg-surface-dim"><Settings2 className="w-5 h-5" /> İşletme Ayarları</Link> : null}
              <button onClick={handleLogout} className="w-full min-h-12 flex items-center gap-3 px-4 rounded-2xl text-red-600 font-bold hover:bg-red-50"><LogOut className="w-5 h-5" /> Çıkış Yap</button>
            </div>
          </div>
        )}
      </div>
    </div>

      <GlobalQuickCreateModal 
        type={quickCreateType} 
        onClose={() => setQuickCreateType(null)} 
      />
    </div>
  );
}
