from typing import List, Optional, Dict, Any

class ModuleDefinition:
    def __init__(
        self,
        key: str,
        name: str,
        description: str,
        category: str,
        route: str,
        sidebar_label: str,
        sidebar_order: int,
        icon: str,
        is_core: bool = False,
        can_disable: bool = True,
        is_available: bool = True,
        is_premium: bool = False,
        status: str = "active", # active, passive, coming_soon, premium
        plan_tier: str = "core", # core, professional, premium, enterprise
        sector_tags: List[str] = None,
        dependencies: List[str] = None,
        related_quick_create_types: List[str] = None,
        related_dashboard_widgets: List[str] = None,
        recommended_for: List[str] = None
    ):
        self.key = key
        self.name = name
        self.description = description
        self.category = category
        self.route = route
        self.sidebar_label = sidebar_label
        self.sidebar_order = sidebar_order
        self.icon = icon
        self.is_core = is_core
        self.can_disable = can_disable
        self.is_available = is_available
        self.is_premium = is_premium
        self.status = status
        self.plan_tier = plan_tier
        self.sector_tags = sector_tags or []
        self.dependencies = dependencies or []
        self.related_quick_create_types = related_quick_create_types or []
        self.related_dashboard_widgets = related_dashboard_widgets or []
        self.recommended_for = recommended_for or []

    def to_dict(self):
        return self.__dict__

MODULE_REGISTRY: Dict[str, ModuleDefinition] = {
    # CORE (Zorunlu / Mandatory)
    "dashboard": ModuleDefinition(
        key="dashboard",
        name="Panel",
        description="İşletmenizin genel durumunu, yaklaşan görevleri ve operasyonel verimliliği tek ekrandan takip edin.",
        category="core",
        route="/dashboard",
        sidebar_label="Panel",
        sidebar_order=10,
        icon="LayoutDashboard",
        is_core=True,
        can_disable=False
    ),
    "customers": ModuleDefinition(
        key="customers",
        name="Müşteriler",
        description="Müşteri rehberinizi yönetin; iletişim bilgilerine ve geçmiş işlem kayıtlarına anında ulaşın.",
        category="core",
        route="/customers",
        sidebar_label="Müşteriler",
        sidebar_order=20,
        icon="Users",
        is_core=True,
        can_disable=False,
        related_quick_create_types=["customer"]
    ),
    "jobs": ModuleDefinition(
        key="jobs",
        name="İşler / Siparişler",
        description="Tekliften işe, işten teslimata kadar tüm süreci takip edin; gecikmeleri önceden görün.",
        category="core",
        route="/jobs",
        sidebar_label="İşler",
        sidebar_order=30,
        icon="Briefcase",
        is_core=True,
        can_disable=False,
        related_quick_create_types=["job"]
    ),
    "tasks": ModuleDefinition(
        key="tasks",
        name="Görevler",
        description="Ekip içi iş bölümü yapın; sorumluları belirleyin ve işlerin zamanında bitmesini sağlayın.",
        category="core",
        route="/tasks",
        sidebar_label="Görevler",
        sidebar_order=40,
        icon="CheckSquare",
        is_core=False,
        can_disable=True,
        related_quick_create_types=["task"]
    ),
    "settings": ModuleDefinition(
        key="settings",
        name="Ayarlar",
        description="Şirket bilgileri, kullanıcı rolleri ve sistem tercihlerini yapılandırın.",
        category="core",
        route="/settings",
        sidebar_label="Ayarlar",
        sidebar_order=1000,
        icon="Settings",
        is_core=True,
        can_disable=False
    ),
    "modules": ModuleDefinition(
        key="modules",
        name="Modüller",
        description="İşletmenize uygun yeni özellikleri aktif edin veya pasife alarak menüyü sadeleştirin.",
        category="core",
        route="/modules",
        sidebar_label="Modüller",
        sidebar_order=1010,
        icon="Layers",
        is_core=True,
        can_disable=False
    ),

    # ACTIVE BUSINESS MODULES (Aktif / İş Modülleri)
    "offers": ModuleDefinition(
        key="offers",
        name="Teklifler",
        description="Müşterilere verilen teklifleri hazırlayın; onaylanan teklifleri tek tıkla işe dönüştürün.",
        category="sales",
        route="/offers",
        sidebar_label="Teklifler",
        sidebar_order=50,
        icon="FileText",
        status="passive",
        related_quick_create_types=["offer"]
    ),
    "operations": ModuleDefinition(
        key="operations",
        name="Operasyon",
        description="İş süreçlerinizi aşamalara bölün; her adımın durumunu ve sorumlu ekibi izleyin.",
        category="operations",
        route="/operations",
        sidebar_label="Operasyon",
        sidebar_order=60,
        icon="Settings2",
        status="active"
    ),
    "delivery_service": ModuleDefinition(
        key="delivery_service",
        name="Teslimat / Servis",
        description="Randevu, saha ekibi, teslimat ve servis işlemlerini profesyonelce planlayın.",
        category="operations",
        route="/delivery-service",
        sidebar_label="Teslimat / Servis",
        sidebar_order=70,
        icon="Truck",
        status="active",
        related_quick_create_types=["delivery_service"]
    ),
    "complaints": ModuleDefinition(
        key="complaints",
        name="Şikayet & Talep",
        description="Müşteri şikayetlerini, talepleri ve çözüm notlarını tek ekranda takip edin.",
        category="customer_service",
        route="/complaints",
        sidebar_label="Şikayet & Talep",
        sidebar_order=80,
        icon="MessageCircle",
        status="active",
        related_quick_create_types=["request_ticket"]
    ),
    "finance": ModuleDefinition(
        key="finance",
        name="Finans",
        description="Gelir, gider, tahsilat ve nakit akışını sade bir yönetici panelinde izleyin.",
        category="finance",
        route="/finance",
        sidebar_label="Finans",
        sidebar_order=100,
        icon="DollarSign",
        status="active",
        related_quick_create_types=["finance_entry"]
    ),
    "files": ModuleDefinition(
        key="files",
        name="Dosyalar",
        description="Teklif, sözleşme ve görselleri merkezi olarak saklayın; belgelere her yerden erişin.",
        category="files_reports",
        route="/files",
        sidebar_label="Dosyalar",
        sidebar_order=90,
        icon="Folder",
        status="active"
    ),
    "reports": ModuleDefinition(
        key="reports",
        name="Raporlar",
        description="İşletmenin müşteri, finans, stok ve operasyon durumunu yönetici özetiyle görün.",
        category="files_reports",
        route="/reports",
        sidebar_label="Raporlar",
        sidebar_order=110,
        icon="BarChart3",
        status="active"
    ),
    "notifications": ModuleDefinition(
        key="notifications",
        name="Bildirimler",
        description="Önemli güncellemelerden anında haberdar olun; hiçbir işi gözden kaçırmayın.",
        category="core",
        route="/notifications",
        sidebar_label="Bildirimler",
        sidebar_order=120,
        icon="Bell",
        status="active",
        is_core=False
    ),
    "inventory": ModuleDefinition(
        key="inventory",
        name="Stok Yönetimi",
        description="Ürün, malzeme ve sarf stoklarını yönetin; kritik stok seviyelerini anında görün.",
        category="inventory_assets",
        route="/inventory",
        sidebar_label="Stok Yönetimi",
        sidebar_order=130,
        icon="Box",
        status="active",
        is_available=True,
        related_quick_create_types=["inventory_item"]
    ),
    "data_import": ModuleDefinition(
        key="data_import",
        name="Veri Aktarımı",
        description="Excel dosyalarınızı kontrollü şekilde içe aktarın; hatalı satırları işlem öncesi görün.",
        category="inventory_assets",
        route="/data-import",
        sidebar_label="Veri Aktarımı",
        sidebar_order=140,
        icon="FileSpreadsheet",
        status="active",
        is_available=True
    ),

    # ROADMAP / PREMIUM (Yakında)
    "warranty": ModuleDefinition(
        key="warranty",
        name="Garanti Takibi",
        description="Satış sonrası garanti ve servis süreçlerini dijital olarak kayıt altına alın.",
        category="customer_service",
        route="/warranty",
        sidebar_label="Garanti",
        sidebar_order=160,
        icon="ShieldCheck",
        status="coming_soon",
        is_available=False
    ),
    "approvals": ModuleDefinition(
        key="approvals",
        name="Onay Süreçleri",
        description="Harcama ve operasyon adımlarını yönetici onay mekanizmasına bağlayın.",
        category="team",
        route="/approvals",
        sidebar_label="Onaylar",
        sidebar_order=170,
        icon="UserCheck",
        status="coming_soon",
        is_available=False
    ),
    "customer_portal": ModuleDefinition(
        key="customer_portal",
        name="Müşteri Portalı",
        description="Müşterilerinizin kendi iş ve taleplerini takip edebileceği özel alan.",
        category="customer_service",
        route="/customer-portal",
        sidebar_label="Müşteri Portalı",
        sidebar_order=180,
        icon="Globe",
        status="premium",
        is_premium=True,
        is_available=False
    ),
    "equipment_assets": ModuleDefinition(
        key="equipment_assets",
        name="Ekipman / Demirbaş",
        description="Şirket demirbaşlarını, zimmetleri ve bakım durumlarını merkezi yönetin.",
        category="inventory_assets",
        route="/equipment",
        sidebar_label="Ekipman",
        sidebar_order=190,
        icon="Tool",
        status="coming_soon",
        is_available=False
    ),
    "vehicle_fleet": ModuleDefinition(
        key="vehicle_fleet",
        name="Araç / Filo Yönetimi",
        description="Araç ve saha ekiplerinin rota ve taşıma süreçlerini optimize edin.",
        category="operations",
        route="/fleet",
        sidebar_label="Filo",
        sidebar_order=200,
        icon="Car",
        status="coming_soon",
        is_available=False
    ),
    "staff_management": ModuleDefinition(
        key="staff_management",
        name="Personel Yönetimi",
        description="Ekip performansı, vardiya ve personel yetkinlik takibi.",
        category="team",
        route="/staff",
        sidebar_label="Personel",
        sidebar_order=210,
        icon="Users2",
        status="coming_soon",
        is_available=False
    ),
}

SECTOR_PACKS = {
    "small_business_op_pack": {
        "name": "Küçük İşletme Operasyon Paketi",
        "description": "Excel, WhatsApp ve dağınık takip yerine müşteri, iş, stok, finans ve talepleri tek panelden yönetin.",
        "recommended": ["complaints", "delivery_service", "finance", "files", "inventory", "data_import", "reports", "notifications", "operations"],
        "features": [
            "Excel’den stok aktarımı",
            "Şikayet ve talep takibi",
            "İş, görev ve teslimat yönetimi",
            "Gelir-gider ve tahsilat özeti",
            "Yönetici raporları"
        ]
    },
    "furniture_production": {
        "name": "Mobilya / Üretim Paketi",
        "recommended": ["operations", "delivery_service", "complaints", "files", "finance", "reports", "inventory", "data_import"],
        "future": ["quality_control"]
    },
    "technical_service": {
        "name": "Teknik Servis Paketi",
        "recommended": ["delivery_service", "complaints", "files", "finance", "reports", "inventory"],
        "future": ["warranty", "equipment_assets", "vehicle_fleet"]
    },
    "agency_office": {
        "name": "Ajans / Ofis Paketi",
        "recommended": ["operations", "files", "finance", "reports", "notifications", "data_import"],
        "future": ["approvals", "customer_portal"]
    }
}
