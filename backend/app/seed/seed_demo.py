from sqlalchemy.orm import Session
from ..core.database import SessionLocal, engine, Base
from ..core.security import get_password_hash
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..models.customer import Customer
from ..models.job import Job
from ..models.task import Task
from ..models.activity import Activity
from ..models.offer import Offer
from ..models.job_stage import JobStage
from ..models.finance import FinanceEntry
from ..models.file_asset import FileAsset
from ..models.comment import Comment
from ..models.notification import Notification
from ..models.watcher import EntityWatcher
from ..models.delivery_service import DeliveryService
from ..models.request_ticket import RequestTicket
from ..models.inventory import InventoryItem
from datetime import datetime, timedelta
import random

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Create Workspace
        workspace = Workspace(
            name="Operio Demo Şirketi",
            sector="Modular Operations",
            plan="enterprise"
        )
        db.add(workspace)
        db.flush()
        
        # 2. Create Users with clear roles
        users_config = [
            {"email": "admin@operio.dev", "full_name": "Operio Admin", "role": "owner"},
            {"email": "manager@operio.dev", "full_name": "Selin Yönetici", "role": "manager"},
            {"email": "staff@operio.dev", "full_name": "Caner Çalışan", "role": "staff"},
            {"email": "finance@operio.dev", "full_name": "Figen Finans", "role": "finance"},
            {"email": "field@operio.dev", "full_name": "Saha Ekipleri", "role": "field"},
            {"email": "superadmin@operio.dev", "full_name": "Fikir Super Admin", "role": "admin", "is_super_admin": True},
        ]
        
        db_users = {}
        for config in users_config:
            user = User(
                email=config["email"],
                full_name=config["full_name"],
                password_hash=get_password_hash("Operio123!"),
                is_super_admin=config.get("is_super_admin", False)
            )
            db.add(user)
            db.flush()
            member = WorkspaceMember(
                workspace_id=workspace.id,
                user_id=user.id,
                role=config["role"]
            )
            db.add(member)
            db_users[config["role"]] = user
        
        db.flush()
        
        # 3. Create Customers (The 7 Core Businesses)
        customers_data = [
            {"name": "Bora Mobilya", "sector": "Üretim / Mobilya", "contact_person": "Ahmet Yılmaz", "status": "active", "email": "ahmet@boramobilya.com", "phone": "0224 123 45 67", "address": "İnegöl Mobilya Sanayi, 4. Sokak No:12, Bursa"},
            {"name": "Yıldız Teknik Servis", "sector": "Teknik Hizmet", "contact_person": "Mehmet Yıldız", "status": "active", "email": "info@yildizteknik.com", "phone": "0212 555 44 33", "address": "İkitelli OSB, Mutfakçılar Sanayi Sitesi, İstanbul"},
            {"name": "Aura Studio", "sector": "Tasarım / Reklam", "contact_person": "Elif Aksoy", "status": "active", "email": "elif@aurastudio.com", "phone": "0216 333 22 11", "address": "Kadıköy Moda, Ressam Şeref Sk. No:5, İstanbul"},
            {"name": "MusicaDent", "sector": "Sağlık / Diş", "contact_person": "Dr. Caner Demir", "status": "active", "email": "caner@musicadent.com", "phone": "0312 444 00 11", "address": "Çankaya, Tunalı Hilmi Cd. No:45, Ankara"},
            {"name": "Nova İnşaat", "sector": "İnşaat / Mimarlık", "contact_person": "Mustafa Kaya", "status": "prospect", "email": "mustafa@novainsaat.com", "phone": "0232 222 11 00", "address": "Bayraklı, Nova Tower Kat:15, İzmir"},
            {"name": "Vizyon Eğitim", "sector": "Eğitim / Akademi", "contact_person": "Sibel Aras", "status": "active", "email": "sibel@vizyonegitim.com", "phone": "0212 111 22 33", "address": "Beşiktaş, Barbaros Blv. No:88, İstanbul"},
            {"name": "Çankaya Nakliyat", "sector": "Lojistik / Taşıma", "contact_person": "Hüseyin Çelik", "status": "active", "email": "huseyin@cankayanakliyat.com", "phone": "0312 999 88 77", "address": "Yenimahalle, Nakliyeciler Sitesi No:10, Ankara"},
        ]
        
        db_customers = {}
        for c in customers_data:
            customer = Customer(
                **c,
                workspace_id=workspace.id,
                responsible_user_id=db_users["manager"].id
            )
            db.add(customer)
            db.flush()
            db_customers[c["name"]] = customer
        
        # 4. Scenario: Bora Mobilya (Full Production Flow)
        # Offer
        bora_offer = Offer(
            workspace_id=workspace.id,
            customer_id=db_customers["Bora Mobilya"].id,
            title="Luxury Mutfak Yenileme Projesi",
            amount=145000.0,
            status="approved",
            offer_no="OFF-2024-BORA-001",
            responsible_user_id=db_users["owner"].id,
            valid_until=datetime.now() + timedelta(days=30),
            description="Komple mutfak dolabı ve tezgah değişimi dahil."
        )
        db.add(bora_offer)
        db.flush()
        
        # Job
        bora_job = Job(
            workspace_id=workspace.id,
            customer_id=db_customers["Bora Mobilya"].id,
            title="Mutfak Dolabı Üretim ve Montaj",
            status="in_progress",
            priority="high",
            progress=65.0,
            responsible_user_id=db_users["owner"].id,
            due_date=datetime.now() + timedelta(days=10)
        )
        db.add(bora_job)
        db.flush()
        bora_offer.converted_job_id = bora_job.id
        
        # Stages
        stages = ["Ölçü Alımı", "Tasarım Onayı", "Malzeme Tedariği", "Üretim", "Kalite Kontrol", "Montaj"]
        for idx, s in enumerate(stages):
            stage = JobStage(
                workspace_id=workspace.id,
                job_id=bora_job.id,
                title=s,
                order_index=idx,
                status="completed" if idx < 3 else ("in_progress" if idx == 3 else "pending")
            )
            db.add(stage)
        
        # Tasks
        db.add(Task(workspace_id=workspace.id, customer_id=db_customers["Bora Mobilya"].id, job_id=bora_job.id, title="Menteşe ve Kulp Siparişi", status="completed", priority="normal", assignee_user_id=db_users["staff"].id, due_date=datetime.now() - timedelta(days=2)))
        db.add(Task(workspace_id=workspace.id, customer_id=db_customers["Bora Mobilya"].id, job_id=bora_job.id, title="Kapak Boyama İşlemi", status="in_progress", priority="high", assignee_user_id=db_users["staff"].id, due_date=datetime.now() + timedelta(days=1)))
        
        # Delivery
        db.add(DeliveryService(
            workspace_id=workspace.id, customer_id=db_customers["Bora Mobilya"].id, job_id=bora_job.id,
            title="Mutfak Parçaları Sevkiyatı", type="delivery", status="planned",
            scheduled_at=datetime.now() + timedelta(days=5), address=db_customers["Bora Mobilya"].address,
            contact_person="Ahmet Yılmaz", assigned_user_id=db_users["field"].id
        ))
        
        # Request (Complaint)
        db.add(RequestTicket(
            workspace_id=workspace.id, customer_id=db_customers["Bora Mobilya"].id, job_id=bora_job.id,
            title="Kapak Rengi Ton Farkı", type="complaint", priority="high", status="reviewing",
            source="whatsapp", description="Sağ üst kapak diğerlerine göre bir ton daha açık duruyor.",
            assigned_user_id=db_users["manager"].id
        ))
        
        # Finance
        db.add(FinanceEntry(workspace_id=workspace.id, customer_id=db_customers["Bora Mobilya"].id, job_id=bora_job.id, title="Bora Mobilya Peşinat", amount=60000.0, type="income", status="paid", due_date=datetime.now() - timedelta(days=20)))
        db.add(FinanceEntry(workspace_id=workspace.id, customer_id=db_customers["Bora Mobilya"].id, job_id=bora_job.id, title="Bora Mobilya 2. Taksit", amount=40000.0, type="income", status="pending", due_date=datetime.now() + timedelta(days=5)))
        
        # 5. Scenario: Yıldız Teknik Servis (Field Service Flow)
        yildiz_job = Job(
            workspace_id=workspace.id, customer_id=db_customers["Yıldız Teknik Servis"].id,
            title="Klima Santrali Periyodik Bakım", status="planned", priority="normal", progress=0.0,
            responsible_user_id=db_users["manager"].id, due_date=datetime.now() + timedelta(days=3)
        )
        db.add(yildiz_job)
        db.flush()
        
        # Stages
        y_stages = ["Servis Ön Hazırlık", "Yedek Parça Kontrol", "Saha Ziyareti", "Bakım Uygulama", "Raporlama"]
        for idx, s in enumerate(y_stages):
            db.add(JobStage(workspace_id=workspace.id, job_id=yildiz_job.id, title=s, order_index=idx, status="pending"))
            
        # Delivery/Service
        db.add(DeliveryService(
            workspace_id=workspace.id, customer_id=db_customers["Yıldız Teknik Servis"].id, job_id=yildiz_job.id,
            title="Yıldız Teknik Bakım Randevusu", type="service", status="planned",
            scheduled_at=datetime.now() + timedelta(days=3), address=db_customers["Yıldız Teknik Servis"].address,
            contact_person="Mehmet Yıldız", assigned_user_id=db_users["field"].id
        ))
        
        # 6. Scenario: Aura Studio (Agency Project Flow)
        aura_job = Job(
            workspace_id=workspace.id, customer_id=db_customers["Aura Studio"].id,
            title="Yeni Marka Lansman Kampanyası", status="in_progress", priority="normal", progress=40.0,
            responsible_user_id=db_users["manager"].id, due_date=datetime.now() + timedelta(days=25)
        )
        db.add(aura_job)
        db.flush()
        
        # Request (Revision)
        db.add(RequestTicket(
            workspace_id=workspace.id, customer_id=db_customers["Aura Studio"].id, job_id=aura_job.id,
            title="Logo Tasarım Revizyonu", type="request", priority="normal", status="in_progress",
            source="email", description="Logonun fontu biraz daha kalın olabilir mi?",
            assigned_user_id=db_users["staff"].id
        ))
        
        # 7. Other Generic Records for Volume
        # Finance - General Expenses
        db.add(FinanceEntry(workspace_id=workspace.id, title="Ofis Kira Ödemesi", amount=25000.0, type="expense", status="paid", category="Kira", due_date=datetime.now() - timedelta(days=5)))
        db.add(FinanceEntry(workspace_id=workspace.id, title="Elektrik Faturası", amount=4200.0, type="expense", status="overdue", category="Fatura", due_date=datetime.now() - timedelta(days=2)))
        db.add(FinanceEntry(workspace_id=workspace.id, title="Hammadde Alımı (Sunta)", amount=85000.0, type="expense", status="pending", category="Malzeme", due_date=datetime.now() + timedelta(days=10)))
        
        # Activities
        db.add(Activity(workspace_id=workspace.id, actor_user_id=db_users["owner"].id, entity_type="job", entity_id=bora_job.id, action="create", description="Bora Mobilya için üretim süreci başlatıldı."))
        db.add(Activity(workspace_id=workspace.id, actor_user_id=db_users["manager"].id, entity_type="offer", entity_id=bora_offer.id, action="approve", description="Teklif müşteri tarafından onaylandı."))
        db.add(Activity(workspace_id=workspace.id, actor_user_id=db_users["staff"].id, entity_type="task", entity_id=1, action="complete", description="Malzeme siparişi tamamlandı."))
        
        # Comments
        db.add(Comment(workspace_id=workspace.id, author_user_id=db_users["manager"].id, entity_type="job", entity_id=bora_job.id, body="Ölçüler İnegöl ekibi tarafından tekrar kontrol edilmeli."))
        db.add(Comment(workspace_id=workspace.id, author_user_id=db_users["owner"].id, entity_type="job", entity_id=bora_job.id, body="Tamamdır, yarın sabah ekipler orada olacak."))
        
        # Notifications
        db.add(Notification(workspace_id=workspace.id, user_id=db_users["owner"].id, title="Yeni Şikayet", message="Bora Mobilya için yeni bir şikayet kaydı açıldı.", type="comment_added"))
        db.add(Notification(workspace_id=workspace.id, user_id=db_users["field"].id, title="Yeni Görev", message="Yıldız Teknik servis randevusu size atandı.", type="task_assigned"))
        
        # Files (Sample records)
        db.add(FileAsset(workspace_id=workspace.id, uploaded_by_user_id=db_users["manager"].id, job_id=aura_job.id, original_filename="Lansman_Plan.xlsx", stored_filename="seed_lansman.xlsx", file_path="storage/seed/lansman.xlsx", file_size=1024*500, mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category="contract"))
        
        # 8. Inventory Items
        inventory_data = [
            {"sku": "MDF-18-BEY", "name": "18mm MDF Levha (Beyaz)", "category": "Hammadde", "unit": "Adet", "quantity": 45, "min_quantity": 10, "purchase_price": 850.0, "sale_price": 1200.0, "supplier": "ABC Orman Ürünleri", "warehouse_location": "A-1 Rafı"},
            {"sku": "MDF-18-CEV", "name": "18mm MDF Levha (Ceviz)", "category": "Hammadde", "unit": "Adet", "quantity": 12, "min_quantity": 5, "purchase_price": 950.0, "sale_price": 1400.0, "supplier": "ABC Orman Ürünleri", "warehouse_location": "A-2 Rafı"},
            {"sku": "MNT-GR-110", "name": "Menteşe (Gri 110 Derece)", "category": "Aksesuar", "unit": "Adet", "quantity": 250, "min_quantity": 50, "purchase_price": 12.5, "sale_price": 25.0, "supplier": "Donanım Market", "warehouse_location": "B-4 Kutusu"},
            {"sku": "KLP-MOD-BLK", "name": "Modern Siyah Kulp", "category": "Aksesuar", "unit": "Adet", "quantity": 8, "min_quantity": 20, "purchase_price": 45.0, "sale_price": 85.0, "supplier": "Tasarım Aksesuar", "warehouse_location": "B-12 Kutusu"},
            {"sku": "KLM-GAZ-410", "name": "R410A Klima Gazı", "category": "Sarf Malzeme", "unit": "KG", "quantity": 2.5, "min_quantity": 5, "purchase_price": 450.0, "sale_price": 850.0, "supplier": "Soğutma Dünyası", "warehouse_location": "Depo-Saha"},
            {"sku": "TBL-VID-35", "name": "3.5x18 Sunta Vidası", "category": "Sarf Malzeme", "unit": "Kutu", "quantity": 0, "min_quantity": 5, "purchase_price": 120.0, "sale_price": 180.0, "supplier": "Donanım Market", "warehouse_location": "B-1 Rafı"},
        ]
        
        for inv in inventory_data:
            item = InventoryItem(**inv, workspace_id=workspace.id)
            item.update_status()
            db.add(item)

        db.commit()
        print("\n" + "="*50)
        print("DEMO VERİLERİ BAŞARIYLA OLUŞTURULDU (SPRINT 7)")
        print("="*50)
        print("Kullanıcılar:")
        for u in users_config:
            print(f"- {u['role'].ljust(10)} : {u['email']} / Operio123!")
        print("="*50 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
