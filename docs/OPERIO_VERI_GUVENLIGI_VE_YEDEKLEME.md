# Operio Veri Güvenliği ve İş Sürekliliği Dokümanı

Bu doküman, Operio platformunun ticari kullanımda veri güvenliği, bütünlüğü ve sürekliliğini nasıl sağladığını teknik ve operasyonel açıdan detaylandırmaktadır.

## 1. Veri İzolasyonu ve Mimari Güvenlik

Operio, çok kiracılı (multi-tenant) bir yapıda tasarlanmıştır. Her işletmenin (workspace) verisi mantıksal düzeyde tam izolasyona sahiptir.

- **Workspace İzolasyonu**: Tüm veritabanı tablolarında `workspace_id` alanı zorunludur. API katmanında her istekte bu ID doğrulanır ve kullanıcının sadece kendi işletmesine ait verileri görmesi garanti altına alınır.
- **Role-Based Access Control (RBAC)**: Platform içinde Owner, Admin, Manager, Staff ve Finance gibi roller tanımlıdır. Kullanıcılar sadece yetkili oldukları modüllere ve işlemlere erişebilirler.
- **Şifreleme**: Kullanıcı şifreleri veritabanında asla düz metin olarak tutulmaz. `bcrypt` algoritması kullanılarak güçlü bir şekilde özetlenir (hashlenir).

## 2. Veri Kaybını Önleme: Soft-Delete Stratejisi

Operio'da kritik veriler (Müşteriler, İşler, Teklifler, Finansal Kayıtlar vb.) doğrudan silinmez; **Soft-Delete** (Mantıksal Silme) mekanizması ile korunur.

- **Archival Approach**: Bir kayıt silindiğinde fiziksel olarak silinmez, `is_deleted` bayrağı aktif edilir.
- **Metadata**: Silme işlemini kimin, ne zaman yaptığı sistem tarafından kayıt altına alınır (`deleted_at`, `deleted_by_user_id`).
- **Veri Geri Getirme**: Hatalı silme durumlarında veriler Platform Admin paneli üzerinden veya teknik müdahale ile kurtarılabilir.

## 3. Gelişmiş Denetim Günlüğü (Audit Logging)

Sistemdeki tüm kritik işlemler "Audit Log" mekanizması ile izlenmektedir. Bu, ticari güvenlik ve geriye dönük inceleme (forensics) için hayati önem taşır.

- **İzlenen İşlemler**: Kayıt oluşturma, güncelleme, durum değişikliği, modül aktivasyonu ve silme işlemleri.
- **Kapsam**: İşlemi yapan kullanıcının e-postası, IP adresi, işlem zamanı ve işlemin detayları (metadata) JSON formatında saklanır.
- **Değiştirilemezlik**: Audit log kayıtları kullanıcılar tarafından değiştirilemez veya silinemez.

## 4. Yedekleme ve Kurtarma (Backup Strategy)

Prodüksiyon ortamında (Render / PostgreSQL) veriler aşağıdaki strateji ile korunmaktadır:

- **Günlük Otomatik Yedekleme**: Her gece veritabanının tam yedeği alınır ve güvenli bir depolama alanında saklanır.
- **Noktasal Geri Dönüş (PITR)**: Veritabanı arızası durumunda sistem, hata oluşmadan hemen önceki bir ana geri döndürülebilir.
- **Dosya Yedekleme**: Yüklenen dökümanlar ve dosyalar (S3 veya benzeri nesne depolama servislerinde) versiyonlu ve yedekli olarak tutulur.

## 5. İletişim Güvenliği

- **SSL/TLS Şifreleme**: Operio ile kullanıcı arasındaki tüm trafik 256-bit SSL sertifikası ile şifrelenir.
- **Secure Sessions**: Kimlik doğrulama için JWT (JSON Web Token) kullanılır ve bu tokenlar güvenli header'lar üzerinden iletilir.

---
**Fikir Creative / Fikir Software** tarafından Operio altyapısı için standartlaştırılmıştır.
Son Güncelleme: Mayıs 2026
