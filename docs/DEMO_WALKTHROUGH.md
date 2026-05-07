# Operio Demo Walkthrough (Senaryo Akışı)

Bu doküman, Operio Modular Operations Suite MVP'sinin potansiyel müşterilere nasıl sunulacağını adım adım açıklar.

## 1. Hazırlık
- Backend'i başlatın: `uvicorn app.main:app --reload`
- Frontend'i başlatın: `npm run dev`
- Verileri sıfırlayın (gerekirse): `python -m app.seed.seed_demo`
- Giriş yapın: `admin@operio.dev` / `Operio123!`

## 2. Giriş: Dashboard (Genel Bakış)
- **Hikaye:** "Operio'ya hoş geldiniz. Burası işletmenizin komuta merkezidir."
- **Göster:** KPI kartları (Aktif Müşteri, Açık İşler, Bekleyen Teslimatlar).
- **Vurgu:** "Tüm operasyonel birimlerinizden (Finans, Sevkiyat, Teknik Servis) gelen veriler burada anlık olarak birleşir."

## 3. Müşteri Yönetimi: Bora Mobilya
- **Adım:** Müşteriler listesinden **Bora Mobilya**'yı açın.
- **Göster:** İletişim bilgileri, aktif işler ve geçmiş veriler.
- **Vurgu:** "Müşteri kartı sadece bir rehber değildir; o müşteriye ait tüm teklifler, iş akışları ve şikayetlerin toplandığı bir hafızadır."

## 4. Satış ve Operasyon Geçişi
- **Adım:** **Teklifler** sekmesine gidin.
- **Göster:** Onaylanmış teklifi gösterin ve bağlı olan **İş (Job)** kaydına tıklayın.
- **Vurgu:** "Onaylanan bir teklif tek tıkla üretim/hizmet sürecine (İş) dönüşür. Veri kaybı olmaz."

## 5. Süreç Takibi ve İş Akışı
- **Adım:** İş detayında **Operasyon Süreci**'ni gösterin.
- **Göster:** Tamamlanan aşamaları (Ölçü Alındı, Tasarım Onayı vb.) ve ilerleme barını (%65).
- **Vurgu:** "Her iş türü için (Mobilya, Yazılım, Teknik Servis) farklı şablonlar kullanabilirsiniz."

## 6. Lojistik ve Satış Sonrası (Sprint 6 Yeniliği)
- **Adım:** Aynı işin altındaki **Lojistik & Teslimat** bölümünü gösterin.
- **Göster:** Planlanmış sevkiyatı ve saha ekibine (field user) atanmış olduğunu gösterin.
- **Adım:** **Şikayet & Revizyonlar** bölümünü gösterin.
- **Göster:** "Kapak Rengi Ton Farkı" şikayetini açın.
- **Vurgu:** "Satış bittiğinde süreç bitmez. Sevkiyat ve müşteri memnuniyeti/şikayet süreçleri de aynı panelden yönetilir."

## 7. Dosyalar ve İş Birliği
- **Adım:** **Dosyalar** sekmesini gösterin (PDF tasarımı).
- **Adım:** **Yorumlar** panelini gösterin.
- **Vurgu:** "Ekibiniz dosyalar üzerinde tartışabilir, birbirini mention (@) ile uyarabilir."

## 8. Finans ve Raporlama
- **Adım:** **Finans** sayfasına gidin.
- **Göster:** Gelir/Gider dengesini ve gecikmiş faturaları.
- **Adım:** **Raporlar** sayfasına gidin.
- **Vurgu:** "Kim ne kadar iş yaptı, ne kadar kar ettik? Hepsi tek bir CSV özetinde veya grafiklerde."

## 9. Kapanış: Modülerlik
- **Adım:** **Modüller** sayfasını gösterin.
- **Vurgu:** "İşletmenizin ihtiyacı olmayan özellikleri kapatabilir, büyüdükçe yeni modüller ekleyebilirsiniz. Operio sizinle birlikte büyür."

---
**Giriş Bilgileri (Demo Kullanıcıları):**
- **Admin:** `admin@operio.dev` (Tam Yetki)
- **Yönetici:** `manager@operio.dev` (Operasyonel Yetki)
- **Finans:** `finance@operio.dev` (Finansal Yetki)
- **Saha Ekibi:** `field@operio.dev` (Sadece Görev/Sevkiyat)
