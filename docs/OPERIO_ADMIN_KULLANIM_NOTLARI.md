# Operio Admin Kullanım Notları

Bu doküman, Fikir Creative / Fikir Software ekipleri için Operio platformunun yönetimi, müşteri kurulum süreçleri ve teknik bakım operasyonları için hazırlanmış dahili rehberdir.

## 1. Demo Ortamı Yönetimi
- **Demo Adresi:** [https://operio.fikircreative.com](https://operio.fikircreative.com)
- **Yedek Sunucu:** [https://operio-pnfd.onrender.com](https://operio-pnfd.onrender.com)
- **Erişim Bilgileri:** `admin@operio.dev` / `Operio123!`
- **Performans Notu:** Sistem Render Free planı üzerindedir. 15 dakikalık inaktiflik sonrası sistem "uyku" moduna geçer. Sunum öncesi sayfanın bir kez yenilenmesi uyanma sürecini başlatır.
- **Veri Kalıcılığı:** Demo ortamında SQLite kullanılmaktadır. Sistemin yeniden başlatılması veya yeni deploy çıkılması durumunda demo verileri ve yüklenen dosyalar sıfırlanabilir.

## 2. Müşteri Kurulumu ve Yapılandırma
Yeni bir müşteri için canlı sisteme geçiş adımları:

### Ön Hazırlık Checklist'i
- [ ] **Kurumsal Kimlik:** İşletme resmi adı, logosu ve kurumsal renk paleti.
- [ ] **Kullanıcı Tanımları:** Kullanıcı listesi, e-postalar ve yetki rolleri (Owner, Manager, Staff, Finance).
- [ ] **Modül Seçimi:** İşletmenin sektörüne uygun modül setinin belirlenmesi ve gereksiz modüllerin kapatılması.
- [ ] **Süreç Tanımları:** İş/Sipariş aşamalarının (örn: Tasarım, İmalat, Sevkiyat) işletmeye göre isimlendirilmesi.
- [ ] **Veri Aktarımı:** Mevcut müşteri, stok ve cari listelerinin Operio Excel şablonlarına aktarılması.
- [ ] **Erişim Ayarları:** Müşteriye özel subdomain veya domain yönlendirmesi (örn: operasyon.firmaadi.com).

### Yetkilendirme Politikası
- **Owner:** Tam yetki (Sistem ayarları ve tüm finans dahil).
- **Manager:** Operasyonel tam yetki, sınırlı finansal özet erişimi.
- **Staff:** Sadece atanan iş/görevler ve ilgili müşteri bilgileri.
- **Finance:** Sadece finans modülü, tahsilat raporları ve gelir-gider yönetimi.

## 3. Canlıya Geçiş (Production) Stratejisi
- **Hosting:** Müşteri verisinin kalıcılığı ve performansı için canlı kurulumlarda mutlaka PostgreSQL veritabanı ve kalıcı depolama (S3 veya Managed Volume) kullanılmalıdır.
- **Sunucu:** Ölçeğe göre DigitalOcean, AWS veya benzeri VPS/Managed hosting çözümleri tercih edilmelidir.
- **Güvenlik:** SSL sertifikası ve düzenli veritabanı yedekleme rutinleri kurulum aşamasında aktif edilmelidir.

## 4. Bakım ve Geliştirme Protokolü
Platformun sürdürülebilirliği için şu kurallara uyulmalıdır:
- **Stabilite Önceliği:** Yeni bir modül veya büyük özellik eklenmeden önce mevcut çekirdek sistemin (core) stabilitesi korunmalıdır.
- **Hata Yönetimi:** Demo veya canlı ortamlardan gelen geri bildirimler; tıklanabilirlik, mobil uyum, metin hataları ve etkileşim (interaction) sorunları öncelikli olacak şekilde çözülmelidir.
- **Dokümantasyon:** Yapılan her geliştirme ve yeni eklenen modül "Kullanım Kılavuzu"na işlenmelidir.
- **Geri Bildirimler:** Demo sunumlarında müşteriden gelen özellik talepleri doğrudan kodlanmamalı, önce "İş Etkisi" analizine göre dokümante edilip önceliklendirilmelidir.

## 5. Bilinen Sınırlandırmalar
- **Roadmap:** "Premium" veya "Yakında" etiketli modüller satış vaadi olarak değil, vizyon olarak sunulmalıdır.
- **Dosya Saklama:** Demo ortamındaki dosyalar geçicidir; bu durum sunumlarda belirtilmelidir.
- **Raporlar:** Mevcut raporlar standart özetler sunar; sektörel bazda özel rapor talepleri ayrıca değerlendirilmelidir.

## 6. Destek ve İletişim
Teknik sorunlar veya operasyonel destek talepleri için:
**Fikir Software Geliştirme Ekibi**  
[info@fikircreative.com](mailto:info@fikircreative.com)

## 7. Manuel Deploy Politikası
Operio platformunun demo ve üretim ortamlarının güvenliğini sağlamak amacıyla şu deploy politikası uygulanmaktadır:
- **Otomatik Deploy:** Render üzerindeki otomatik deploy özelliği (Auto-Deploy) bilinçli olarak kapalı tutulmaktadır.
- **Yöntem:** Canlı demo ortamına yapılacak her türlü güncelleme manuel olarak tetiklenmelidir.
- **QA Kontrolü:** Sadece tarayıcı QA testlerinden geçmiş ve stabil olduğu doğrulanmış sürümler manuel olarak canlıya alınmalıdır.
- **Yapılandırma:** Render platformu üzerindeki environment ve service ayarları, geliştirme ekibinin bilgisi dışında kontrolsüz olarak değiştirilmemelidir.

---
**Fikir Software Dahili Kullanım Notları**
