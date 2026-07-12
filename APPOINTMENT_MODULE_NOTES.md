# Randevu Modülü - İlk Uygulama

Bu paket randevu modülünü Operio CRM içine ilk çalışan mimari olarak ekler. Süper admin mevcut Modüller sistemi üzerinden işletmeye `appointments` modülünü açıp kapatabilir. İşletme panelinde `/appointments` ekranı görünür.

## Hazır
- İşletme randevu ayarları
- Public slug
- Hizmet ekleme
- Personel ekleme
- Randevu listesi ve durum değiştirme
- Public randevu formu `/book/:slug`
- Temel çakışma kontrolü
- Workspace izolasyonunun temel sorguları

## Antigravity'ye bırakılan kritik işler
- Alembic migration
- Çalışma saatleri ve gerçek slot motoru
- Personel bazlı müsaitlik
- Tatil/izin/ara yönetimi
- CRM müşteri eşleştirme
- Bildirimler
- Rate limit / CAPTCHA
- E2E test
