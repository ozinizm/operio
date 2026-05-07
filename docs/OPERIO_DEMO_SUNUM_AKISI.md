# Operio Demo Sunum Akışı

Bu doküman, potansiyel müşterilere yapılacak sunumlarda izlenecek stratejik akışı ve dikkat edilmesi gereken noktaları içermektedir.

## Saha 1: Hazırlık ve Isınma
- **Canlı Erişim:** [https://operio.fikircreative.com](https://operio.fikircreative.com) adresinden admin girişi yapıldığından emin olun.
- **Yedek Sunucu:** [https://operio-pnfd.onrender.com](https://operio-pnfd.onrender.com) (Render Fallback) hazır bulundurun.
- **Demo Hesap:** `admin@operio.dev` / `Operio123!`
- **Hız Notu:** Demo sunucusunun (Render Free) uyku modundan çıkması için sunumdan 5 dakika önce bir kez sayfayı yenileyin.
- **Teknik Not:** Canlı demo için manuel deploy modeli kullanılmaktadır; QA aşamasından geçmemiş kontrolsüz değişiklikler sunuma yansımaz.
- **Problem Tespiti:** Sunuma başlamadan önce müşterinin en çok hangi alanda (örn: unutulan ödemeler, dağınık görevler, müşteri şikayetleri) sorun yaşadığını kısa bir soruyla belirleyin.

## Saha 2: Panel (Dashboard) ve Büyük Resim
- **Giriş:** "İşletmenizin kontrol kulesine hoş geldiniz. Burada şu an kaç işinizin açık olduğunu, bugünkü acil görevlerinizi ve bekleyen tahsilatlarınızı tek bakışta görüyorsunuz."
- **Vurgu:** "Operio ile amacımız, işletme sahibinin her an genel tabloya hakim olmasını sağlamaktır."

## Saha 3: Müşteri Hafızası
- **Anlatım:** "Sistemdeki müşteriler sadece bir isim listesi değildir. Bir müşteriye tıkladığınızda, o müşteriye ait tüm geçmiş teklifler, tamamlanan işler ve hatta varsa şikayetler kronolojik olarak önünüze gelir."
- **Aksiyon:** Örnek bir müşteri detayı açarak ilişkili kayıtları gösterin.

## Saha 4: Altın Akış (Tekliften İşe Dönüşüm)
*Sunumun en can alıcı bölümüdür.*
- **Aksiyon:** Mevcut bir teklifi onaylayın ve "İşe Dönüştür" butonunu kullanarak anında bir İş/Sipariş kaydı oluşturun.
- **Vurgu:** "Onaylanan bir satışın operasyona dönüşmesi saniyeler sürer. Veriyi tekrar girmenize gerek kalmaz, hata payı ortadan kalkar."

## Saha 5: Operasyonel Takip ve Görevler
- **Anlatım:** "İş başladığı an ekibinize görevler atayabilir, işin hangi aşamada (üretim, montaj, kontrol vb.) olduğunu görsel olarak izleyebilirsiniz."
- **Aksiyon:** Görevler sayfasında durum değişikliği (Yapılacak -> Tamamlandı) yapın.

## Saha 6: Saha ve Müşteri Memnuniyeti (Teslimat & Şikayet)
- **Anlatım:** "İş bittiğinde teslimatı planlayabilir, müşteriden gelen bir geri bildirim olursa bunu Şikayet/Talep modülünde çözüm notlarıyla saklayabilirsiniz."

## Saha 7: Finansal Görünürlük
- **Anlatım:** "Burası bir ön muhasebe değil, yöneticinin operasyonel nakit akışını görmesini sağlayan bir paneldir. Hangi işten ne kadar alacağınız var, o an görebilirsiniz."

## Saha 8: Modüler Esneklik
- **Aksiyon:** Modül Mağazası'nı gösterin.
- **Anlatım:** "Operio işletmenizle birlikte büyür. İhtiyacınız olmayan alanları kapatarak sistemi sadeleştirebiliriz. Önemli olan her özelliği aynı anda kullanmak değil, işletmenizin en çok dağılan süreçlerini önce sisteme almaktır."

## Saha 9: Kapanış ve İhtiyaç Analizi
- **Kapanış:** "Operio, işletmenizi kişilerin hafızasından kurtarıp kurumsal bir yapıya taşır. Şimdi sizin süreçlerinize en uygun modülleri beraber netleştirelim."

## Müşteriden Alınacak Kritik Sorular
- Kaç kullanıcı aktif olarak sistemi kullanacak?
- Kullanıcıların yetki sınırları (kim neyi görmeli) nasıl olmalı?
- Şu an en çok hangi süreçte (teklif, teslimat, stok vb.) işler unutuluyor?
- Mevcut Excel veya kağıt tabanlı verileriniz ne kadar yoğun?
- Finansal özetlerin kimlere açık olması gerekiyor?
- Saha ekibi veya teslimat operasyonunuz var mı?

## Sunum Sırasında Dikkat Edilmesi Gerekenler
- **Sadelik:** Teknik dilden (veritabanı, kod yapısı vb.) uzak durun; fayda odaklı (hız, kontrol, veri güvenliği) konuşun.
- **Demo Gerçekliği:** Demo verilerinin örnek olduğunu, canlı kurulumun işletmeye özel şablonlarla yapılacağını belirtin.
- **Etkileşim:** Müşterinin her 'evet' dediği sorun noktasına Operio'nun çözümünü (modülünü) göstererek cevap verin.
- **Risk Yönetimi:** Dosya yükleme gibi picker açan alanlarda sunumun akışını bozmamak için sadece ekranın ne işe yaradığını anlatıp geçin.

---
**Fikir Creative Sunum Notları**
