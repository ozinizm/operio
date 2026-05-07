import { 
  Settings, Shield, CreditCard, 
  Activity, Database, Zap, Lock, 
  Info, ChevronRight 
} from 'lucide-react';

export default function PlatformSettings() {
  const settingsCards = [
    {
      title: 'Genel Platform Bilgileri',
      description: 'Operio platform adı, versiyonu ve global tanımlamalar.',
      icon: Settings,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      title: 'Güvenlik Ayarları',
      description: 'Global 2FA politikaları, şifre karmaşıklığı ve IP kısıtlamaları.',
      icon: Shield,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Lisans / Plan Yönetimi',
      description: 'SaaS plan tanımları, modül fiyatlandırmaları ve limitler.',
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Sistem Durumu',
      description: 'Sunucu sağlığı, veritabanı yükü ve servis çalışma süreleri.',
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      title: 'Yedekleme Politikası',
      description: 'Otomatik yedekleme sıklığı ve veri saklama süreleri.',
      icon: Database,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4" /> Global Configuration
        </div>
        <h1 className="text-4xl font-jakarta font-extrabold text-slate-800 tracking-tight">Sistem Ayarları</h1>
        <p className="text-slate-500 font-medium">Operio platformuna ait genel yapılandırma, güvenlik, lisans ve sistem ayarları bu alanda yönetilecektir.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {settingsCards.map((card, index) => (
          <div key={index} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 hover:shadow-indigo-100 transition-all group flex flex-col justify-between">
            <div>
              <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-6 shadow-sm`}>
                <card.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-jakarta font-bold text-slate-800 mb-3">{card.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {card.description}
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                Düzenleme Pasif
              </span>
              <button 
                disabled 
                className="flex items-center gap-2 text-slate-300 font-bold text-sm cursor-not-allowed group-hover:text-slate-400 transition-colors"
              >
                Yakında <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <div className="bg-indigo-900 p-8 rounded-[32px] shadow-2xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800/30 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 space-y-4">
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
                <Lock className="w-8 h-8 text-indigo-200" />
             </div>
             <h3 className="text-xl font-jakarta font-bold text-white">Gelişmiş Yapılandırma</h3>
             <p className="text-xs text-indigo-300 font-medium leading-relaxed">
               Sistem mimarisi ve altyapı ayarları için lütfen Teknik Operasyon ekibiyle iletişime geçin.
             </p>
             <div className="flex items-center justify-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-tighter pt-4">
                <Info className="w-3.5 h-3.5" />
                <span>Erişim Kısıtlı</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
