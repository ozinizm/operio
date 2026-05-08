# AUTH STATE SYNC, TOAST DEDUPE & INLINE LOGO HOTFIX REPORT

## 1. Toast Spam & Password Changed Fix
Şifre değişimi sonrası login ekranında oluşan toast mesajı yığılması ve döngüsü çözüldü:
- **Toast Deduplication:** `ToastProvider` içine dedupe mekanizması eklendi. Aynı mesaj 2 saniye içinde birden fazla kez gösterilmeye çalışılırsa engelleniyor.
- **LoginPage Effect:** `passwordChanged=1` parametresini dinleyen `useEffect` sadece mount anında (1 kez) çalışacak şekilde optimize edildi.
- **URL Cleanup:** `navigate` yerine `window.history.replaceState` kullanılarak URL'deki parametre sessizce (re-render tetiklemeden) temizlendi.

## 2. Login Redirection & State Sync Fix
Giriş başarılı olduğu halde dashboard'un açılmaması ve refresh gerekmesi sorunu giderildi:
- **Immediate Sync:** `handleLogin` fonksiyonunda `setAuth` (token + user + workspace) çağrısı sonrası state'in ProtectedRoute tarafından anında yakalanması sağlandı.
- **Selective Clearing:** Login submit anında sadece mevcut auth token/user temizleniyor; sistem tercihleri veya login response sonrası yeni veriler asla silinmiyor.
- **MustChangePassword Guard:** Login sonrası kullanıcının şifre değiştirme zorunluluğu (`must_change_password`) kontrol edilerek doğru yönlendirme (`/change-password`) eklendi.

## 3. Inline SVG Logo (Permanent Asset Fix)
Production ortamındaki asset path sorunlarından kaynaklanan kırık logo ("Operio Logo" alt text) görünümü kalıcı olarak çözüldü:
- **BrandLogo:** Artık dış dosya (`img src`) yerine **Inline SVG** render ediyor.
- **Variant Desteği:** `default`, `white`, `mark`, `platform` gibi tüm varyantlar SVG renk ve görünürlük mantığıyla kodlandı.
- **Asset Reliability:** Logo artık network isteğine veya dosya yoluna bağımlı değil; doğrudan React bileşeni içinde gömülü.

## 4. ApiClient 401 Refinement
- Kullanıcı zaten `/login` sayfasındayken oluşan 401 hatalarında (hatalı şifre vb.) global "Oturum süreniz doldu" mesajı ve redirect döngüsü engellendi.
- Sadece oturum açıkken başka bir sayfada 401 alınırsa temizlik ve yönlendirme yapılıyor.

## 5. Test Sonuçları
- **Backend Import:** `Backend import OK` (Başarılı)
- **Frontend Build:** `npm run build` (Başarılı)
- **TypeScript:** Tüm unused import ve variable hataları temizlendi.

---
**Tarih:** 09.05.2026
**Not:** Render deployment yapılmamıştır. Canlı veritabanı veya migration gerektiren bir işlem uygulanmamıştır.
