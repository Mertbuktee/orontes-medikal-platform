# Admin Panel

## Account Security

- `/admin/account/security` her admin kullanıcısının kendi güvenlik merkezidir.
- Kullanıcı kendi şifresini değiştirebilir; mevcut şifre doğrulanır, yeni şifre Argon2id ile hashlenir ve diğer oturumlar iptal edilir.
- Aktif oturumlar yalnızca kendi kullanıcı hesabı kapsamında listelenir; token veya token hash UI'ye gösterilmez.
- Remember Me login kontrolü standart oturumdan daha uzun ama sonlu bir oturum oluşturur; süreyi client değil server politikası belirler.
- `/admin/forgot-password` ve `/admin/reset-password` generic mesajlar ve tek kullanımlık hashlenmiş reset tokenları kullanır.
- MFA ekranı bu milestone'da foundation durumundadır: veritabanı, encryption ve recovery-code temel tasarımı hazırdır; TOTP enforcement ayrı production hardening adımıdır.

## Amaç

Admin panel, Orontes Teknoloji web sitesindeki tüm içeriklerin, servis taleplerinin ve sistem ayarlarının kod yazmadan yönetilebilmesini sağlar.

---

# Dashboard

Yönetici giriş yaptıktan sonra göreceği ilk ekran.

Gösterilecek bilgiler:

- Bugünkü servis talepleri
- Bekleyen servis talepleri
- Onarımda olan cihazlar
- Tamamlanan işlemler
- Son eklenen blog yazıları
- Son yüklenen dosyalar
- Hızlı istatistik kartları

---

# Servis Talepleri

Özellikler

- Listeleme
- Arama
- Filtreleme
- Tarihe göre sıralama
- Durum güncelleme
- Not ekleme
- Dosya görüntüleme
- Dosya indirme
- Servis personeli atama
- Arşivleme
- Silme

Durumlar

- Yeni
- İnceleniyor
- Müşteriden Bilgi Bekleniyor
- Onarımda
- Tamamlandı
- İptal Edildi
- Arşivlendi

---

# Cihaz Grupları

Yönetilebilecek Alanlar

- Başlık
- Açıklama
- İkon
- Etiketler
- Sıralama
- Aktif / Pasif

İşlemler

- Yeni ekle
- Düzenle
- Sil
- Sırala

---

# Hizmetler

Yönetilebilecek Alanlar

- Başlık
- Açıklama
- İkon
- Sıralama
- Aktif / Pasif

---

# Blog

Özellikler

- Yazı oluştur
- Taslak kaydet
- Yayınla
- Yayından kaldır
- Kategori seç
- Kapak görseli
- SEO Başlığı
- Meta Açıklaması
- Slug
- İçerik editörü
- Yayın tarihi

---

# Medya Kütüphanesi

- Görsel yükle
- Dosya yükle
- Önizleme
- Silme
- Alt metin
- Boyut bilgisi
- MIME tipi
- Kullanıldığı sayfalar

---

# Ana Sayfa Yönetimi

Yönetilebilir Alanlar

- Hero
- Hizmetler
- Cihaz Grupları
- Elektronik Kart Tamiri
- Neden Orontes
- Servis Süreci
- Blog
- İletişim
- CTA

---

## Hero Slider Yönetimi

Yönetilebilir alanlar:

- Görsel
- Başlık
- Açıklama
- Badge
- Alt metin
- Bağlantı
- Sıralama
- Aktif / Pasif
- Autoplay dahil et
- Önizleme

İşlemler:

- Yeni slayt ekleme
- Düzenleme
- Silme
- Sıralama
- Aktif/pasif yapma
- Autoplay'e dahil etme veya çıkarma

---

# Site Ayarları

- Firma Adı
- Telefon
- E-posta
- WhatsApp
- Adres
- Google Maps
- Çalışma Saatleri
- Logo
- Favicon
- Footer
- Sosyal Medya
- Google Analytics
- Google Search Console

---

# SEO

- Meta Title
- Meta Description
- Canonical URL
- Robots
- OpenGraph
- Twitter Card
- JSON-LD
- Sitemap

---

# Kullanıcı Yönetimi

Roller

- Super Admin
- Admin
- Editör
- Servis Personeli
- Görüntüleyici

---

# Güvenlik

- Giriş Logları
- Audit Log
- Rate Limit
- Oturum Yönetimi
- Şifre Değiştirme
- İki Aşamalı Doğrulama (gelecek)

---

# Gelecek Özellikler

- Mail Bildirimleri
- SMS Bildirimleri
- Servis Takip Sistemi
- Müşteri Paneli
- QR Servis Takibi
- Raporlama

---

# Public Sayfa Yönetimi

Yeni public bilgi mimarisi admin panelde modüler içerik yönetimine hazır olacak şekilde planlanır.

Yönetilebilir sayfalar:

- Ana Sayfa
- Hizmetler
- Cihazlar
- Elektronik Kart Tamiri
- Hakkımızda
- Servis Süreci
- Blog
- İletişim
- Servis Talebi

Her sayfa için yönetilebilir alanlar:

- Sayfa başlığı
- Meta title
- Meta description
- Öne çıkan açıklama
- İçerik blokları
- CTA metinleri
- Görsel / medya ilişkileri
- Sıralama
- Aktif / pasif durumu

Anasayfa, detay sayfalarına yönlendiren özet bloklar olarak tutulur. Detay içerik ve SEO odaklı uzun metinler ilgili sayfalarda yönetilir.

## Cihaz ve Hizmet İçerik Sözleşmesi

Admin panelde cihaz ve hizmet içerikleri doğrudan section kodu içinde değil, veritabanı destekli içerik modelleri üzerinden yönetilecektir.

Cihaz grubu alanları:

- id
- title
- slug
- shortDescription
- fullDescription
- iconKey
- capabilities
- isFeatured
- order
- isActive
- seoTitle
- seoDescription

Hizmet alanları:

- id
- title
- slug
- shortDescription
- fullDescription
- iconKey
- isFeatured
- order
- isActive
- seoTitle
- seoDescription

---

## Admin Foundation Milestone

Bu aşamada admin panelin üretim mimarisine uygun temeli kurulmuştur. Gerçek kimlik doğrulama, Prisma/PostgreSQL CRUD ve dosya yönetimi henüz uygulanmamıştır.

### Route Yapısı

- `/admin`: geçici olarak `/admin/dashboard` adresine yönlenir.
- `/admin/login`: herkese açık admin giriş UI ekranıdır.
- `/admin/dashboard`: protected admin shell içinde dashboard iskeletidir.
- `/admin/*`: gelecekteki modüller için protected placeholder sayfasına düşer.

Public site route group altında tutulur:

- `src/app/(public)/layout.tsx`: Navbar, Footer, cookie consent ve public JSON-LD.
- `src/app/admin/layout.tsx`: admin root metadata, public UI içermez.
- `src/app/admin/(protected)/layout.tsx`: oturum boundary ve admin shell.

### Admin Layout Bileşenleri

- `AdminShell`
- `AdminSidebar`
- `AdminTopbar`
- `AdminMobileNav`
- `AdminBreadcrumbs`
- `AdminPageHeader`
- `AdminLoginForm`

Navigation içeriği `src/components/admin/admin-navigation.ts` içinde typed config olarak tutulur. Sidebar render mantığı ile modül sözleşmesi birbirinden ayrıdır.

### RBAC Rolleri

- `SUPER_ADMIN`
- `ADMIN`
- `EDITOR`
- `SERVICE_STAFF`
- `VIEWER`

İzinler `src/lib/rbac/permissions.ts` altında tutulur. Bu helper'lar UI ve gelecek server-side kontroller için sözleşmedir; tek başına nihai güvenlik sınırı değildir.

### Geliştirme Bypass Politikası

`ADMIN_DEV_BYPASS` normal admin gelistirme akisi icin kullanilmaz. Varsayilan kapali kalir ve production deployment sinyali (`APP_ENV=production` veya `VERCEL_ENV=production`) varken gecersizdir.

### Sonraki Uygulama Sırası

1. Gerçek server-side session altyapısı.
2. Prisma/PostgreSQL şemaları.
3. Servis talepleri listeleme ve durum yönetimi.
4. Medya kütüphanesi ve güvenli admin upload.
5. Cihaz, hizmet, blog ve homepage CRUD.
6. SEO ve site ayarları yönetimi.
7. Audit log persistence ve raporlama.

## Secure Admin Authentication Milestone

Admin login artik gercek veritabani kaydina baglidir.

- `/admin/login`: e-posta/parola ile giris yapar, basarili giriste `/admin/dashboard` adresine yonlendirir.
- `/api/admin/auth/login`: login POST endpoint'i. Parola veya kullanici varligi hakkinda ayirt edici hata dondurmez.
- `/admin/auth/logout`: POST logout endpoint'i. Session cookie `Path=/admin` oldugu icin logout route'u da admin path altindadir.
- `orontes_admin_session`: HttpOnly, SameSite=Lax, production'da Secure, raw opaque token tasiyan admin session cookie'sidir.

Session token davranisi:

- Raw token yalniz cookie icinde bulunur.
- PostgreSQL'de yalniz SHA-256 token hash'i saklanir.
- Expired, revoked veya inactive user session'lari authenticate etmez.
- Logout mevcut session'i revoke eder ve cookie'yi temizler.

`ADMIN_DEV_BYPASS` artik normal admin gelistirme akisi icin gerekli degildir. Helper yalnizca test sozlesmesi olarak izole edilir ve production deployment sinyali varken gecersizdir.

Ilk admin kullanicisi seed ile uretilmez. Bootstrap komutu bilerek ve gecici env degerleriyle calistirilir.

PowerShell:

```powershell
$env:ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
$env:ADMIN_BOOTSTRAP_NAME="Admin"
$env:ADMIN_BOOTSTRAP_PASSWORD="strong-password"
npm run admin:bootstrap
Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD
```

Bootstrap parolasi kaynak koda veya production config dosyasina yazilmaz; islemden sonra ortam degiskenleri temizlenmelidir. Visual QA test kullanicisi bootstrap kontrolunu kilitlemez.

Operasyon komutlari:

- `npm run admin:list-users`: admin kullanicilarini password hash veya session bilgisi gostermeden listeler.
- `npm run admin:rotate-password`: mevcut adminin parolasini explicit confirmation ile degistirir ve aktif oturumlarini revoke eder.

PowerShell parola rotate:

```powershell
$env:ADMIN_ROTATE_EMAIL="admin@example.com"
$env:ADMIN_ROTATE_PASSWORD="new-strong-password"
$env:ADMIN_ROTATE_CONFIRM="ROTATE_ADMIN_PASSWORD"
npm run admin:rotate-password
Remove-Item Env:ADMIN_ROTATE_PASSWORD
```

## Service Requests Admin Module

Ilk gercek admin modulu servis talepleridir.

- Public `/api/service-requests` endpoint'i artik `PrismaServiceRequestRepository` ile PostgreSQL'e yazar.
- `/technical/service-requests`: aktif servis taleplerini listeler, durum ve arama filtresi sunar. `/admin/service-requests` bu operasyon ekranina yonlenir.
- `/technical/service-requests/[id]`: talep detayi, musteri bilgileri, cihaz bilgileri, attachment metadata, internal notlar ve durum gecmisini gosterir. `/admin/service-requests/[id]` bu detay ekranina yonlenir.
- Durum guncelleme ve internal not ekleme server action olarak calisir.
- Her mutation kendi icinde `serviceRequests.update` permission kontrolu yapar.
- Durum degisiklikleri `ServiceRequestStatusHistory` ve `AuditLog` kaydi olusturur.
- Internal not ekleme audit metadata'sinda not icerigini saklamaz.

Private dosya storage key veya filesystem path client response'a donulmez.

### Service Request Hardening

- `VIEWER`: servis taleplerini listeleyebilir ve detay okuyabilir; mutation yapamaz.
- `SERVICE_STAFF`: liste/detay, durum güncelleme, internal not ekleme ve yetkili attachment indirme yapabilir.
- `ADMIN`: servis taleplerini atayabilir, arşivleyebilir ve normal operasyonları yönetebilir.
- `SUPER_ADMIN`: tüm servis talebi izinlerine sahiptir.
- `EDITOR`: servis talebi modülünü yönetmez.

Durum geçişleri `src/components/admin/service-request-status.ts` içinde typed policy olarak tutulur ve server action içinde tekrar doğrulanır. UI seçenekleri güvenlik sınırı değildir.

Private attachment erişimi `/technical/service-requests/[id]/attachments/[attachmentId]` route handler'ı ile yapılır. Endpoint geçerli admin session, `serviceRequests.attachments.view` izni ve attachment-request ownership kontrolü olmadan dosya döndürmez. Response `nosniff` ve `private, no-store` header'ları ile gelir; raw filesystem path veya storage root sızdırılmaz.

Eski local JSON servis talepleri için `npm run service-requests:import` komutu dry-run modunda rapor üretir. Gerçek import için `npm run service-requests:import -- --apply` açıkça kullanılmalıdır.

### Service Request Final Hardening

- Durum güncelleme ve arşivleme formları isteğe bağlı internal gerekçe alır; gerekçe yalnız audit metadata içinde saklanır.
- `audit.view` izni olan adminler servis talebi detayında kompakt audit özetini görebilir.
- Notification altyapısı için `ServiceRequestEventPublisher` sözleşmesi eklendi; mevcut implementasyon bilinçli olarak no-op'tur ve e-posta/SMS gönderimi yapmaz.
- Visual QA artık servis talebi liste ve detay ekranlarını synthetic veriyle desktop/mobile olarak yakalar.

## Media Library Module

Medya kütüphanesi `/admin/media` ve `/admin/media/[id]` route'larıyla başlatıldı.

- `media.view`: medya liste ve detay okuma.
- `media.upload`: güvenli admin upload.
- `media.update`: metadata update, archive ve restore.
- `media.delete`: yalnız kullanılmayan medyayı hard delete.

Desteklenen ilk formatlar JPEG, PNG ve WebP'tir. SVG, HTML, JavaScript, arşiv ve bilinmeyen formatlar kabul edilmez. Upload edilen görseller `sharp` ile decode/re-encode edilir, metadata strip edilir ve `ORIGINAL`, `THUMBNAIL`, `MEDIUM`, `LARGE` varyantları üretilir.

Servis talebi attachment dosyaları medya kütüphanesine dahil edilmez; iki domain ayrı storage dizinleri ve ayrı erişim politikaları kullanır.
## Hero Slider Management

Hero Slider module is managed under `/admin/hero-slides`.

- `heroSlides.view`: list, detail and preview.
- `heroSlides.create`: create a new slide.
- `heroSlides.update`: update copy, media, alt text, link, object position and autoplay inclusion.
- `heroSlides.reorder`: move slides up, down, first or last.
- `heroSlides.publish`: toggle active/passive state.
- `heroSlides.delete`: delete a slide record.

Slides select images from the Media Library. Archived media and non-image media cannot be selected. Deleting a Hero slide never deletes the referenced media record.

Slider settings are stored as the typed `hero.slider.settings` site setting. Public updates revalidate the homepage, dashboard and Hero Slider admin routes.

## Device Group Management

Cihaz grupları `/admin/devices` modülüyle yönetilir.

- `devices.view`: liste, detay ve önizleme.
- `devices.create`: yeni cihaz grubu oluşturma.
- `devices.update`: içerik, ikon, yetenek, medya ve SEO alanlarını güncelleme.
- `devices.reorder`: yukarı/aşağı/ilk/son sıralama kontrolleri.
- `devices.publish`: aktif/pasif ve ana sayfada öne çıkarma durumu.
- `devices.delete`: arşivleme, geri alma ve yalnız arşivli kayıt için kontrollü silme.

Aktif olmayan veya arşivlenen cihaz grupları public sayfalarda görünmez. Ana sayfa önizlemesi yalnız `isActive=true`, `isFeatured=true` ve arşivlenmemiş ilk 6 cihazı sıralamaya göre gösterir.

İkonlar ve yetenek etiketleri allowlist registry üzerinden seçilir; admin formu arbitrary component, HTML veya CSS class kabul etmez. Cihaz görseli ve Open Graph görseli Medya Kütüphanesi içinden seçilir; PDF veya arşivlenmiş medya seçilemez.
# Hizmetler Yönetimi

Hizmetler modülü `/admin/services` altında yönetilir. Yetkili kullanıcılar hizmet oluşturabilir, içerik ve SEO alanlarını güncelleyebilir, medya kütüphanesinden görsel seçebilir, kayıtları aktif/pasif yapabilir, ana sayfada öne çıkarabilir, sıralayabilir ve arşivleyebilir.

Yönetilen alanlar:

- Başlık, slug, kısa açıklama ve detaylı açıklama
- Allowlist tabanlı Lucide ikon anahtarı
- Opsiyonel hizmet görseli ve Open Graph görseli
- Ana sayfada öne çıkarma durumu
- Aktif/pasif ve arşiv durumu
- Sıralama
- SEO başlığı ve SEO açıklaması
- Opsiyonel CTA etiketi ve güvenli CTA bağlantısı

Normal silme davranışı arşivlemedir. Kalıcı silme yalnızca arşivlenmiş ve referanssız kayıtlar için SUPER_ADMIN politikasıyla kullanılmalıdır. Media kayıtları hizmet silindiğinde otomatik silinmez.
# Ana Sayfa Yönetimi

Ana sayfa içerikleri `/admin/homepage` altında yönetilir.

- `homepage.view`: ana sayfa yönetim ekranlarını okur.
- `homepage.update`: section metni ve tip kontrollü içerikleri günceller.
- `homepage.reorder`: ana sayfa bölümlerini yukarı/aşağı/ilk/son taşıyabilir.
- `homepage.publish`: section görünürlüğünü yönetir.
- `homepage.seo.manage`: ana sayfa meta title, description ve OG görsel ayarlarını yönetir.

Hero slider, cihaz grupları, hizmetler ve ileride blog yazıları kendi modüllerinde yönetilir. Ana sayfa yönetimi bu modülleri yeniden kurmaz; yalnızca görünürlük, sıralama, section metinleri, CTA içerikleri ve preview limitlerini yönetmek için temel sağlar.

Section içerikleri JSON olarak saklansa da her section key için Zod şemasıyla doğrulanır. DB’den arbitrary component adı, HTML veya raw media storage key okunmaz.
## Blog CMS

Blog yazilari `/admin/blog` altinda, kategoriler `/admin/blog/categories` altinda yonetilir.

- Icerik ham HTML olarak saklanmaz; paragraph, heading, list, quote, image, callout ve divider bloklarindan olusan typed JSON saklanir.
- Public article body render sirasinda `dangerouslySetInnerHTML` kullanmaz; React text escaping ve allowlisted block renderer kullanilir.
- Draft preview `/admin/blog/[id]/preview` route'u oturum ve `blog.view` izni gerektirir, noindex metadata tasir ve public URL degildir.
- Publish, schedule, archive ve category yonetimi ayri server-side permission kontrolleriyle korunur.
- Gecici typed blog icerikleri seed sirasinda DRAFT olarak tasinir; fake author/date ile otomatik yayinlanmaz.
- `/blog` yalniz yayinlanmis, arsivlenmemis ve zamani gelmis yazilari listeler. `/blog/[slug]` draft, scheduled future ve archived icerikler icin 404 verir.
- `/blog/kategori/[slug]` yalniz aktif, arsivlenmemis ve en az bir yayinlanmis/gorunur yazisi olan kategorileri acar. Bos veya pasif kategoriler public tarafta 404 politikasina tabidir ve sitemap'e eklenmez.
- Planli yayin UI'si otomatik worker aktifmis gibi davranmaz. Production asamasinda ayrica publish-due-posts worker/cron kurulana kadar planli yazilar yalnizca "Planlandi" olarak etiketlenir.
- `BlogPostRevision` tablo temeli hazirdir; gelismis revision karsilastirma/geri alma UI'i editorial workflow hardening asamasina ertelenmistir.

## Site Settings

Site ayarlari `/admin/settings` altinda yonetilir. Modul sirket kimligi, iletisim, WhatsApp, adres, harita, marka gorselleri, global SEO, sosyal medya, search verification, analytics ID'leri, footer, legal gorunurluk, default CTA ve maintenance mode ayarlarini tip kontrollu `SiteSetting` kayitlari olarak saklar.

- `settings.view`: ayar ekranlarini goruntuler.
- `settings.update`: marka, iletisim, footer, legal ve sistem ayarlarini gunceller.
- `settings.seo.manage`: global SEO, search verification ve analytics ayarlarini gunceller.

Logo, favicon ve default OG image yalniz Media Library icindeki aktif image kayitlarindan secilir; raw storage key girisi yoktur. Public Navbar, Footer, Contact, structured data, sitemap ve robots ayarlari bu modulu tek kaynak olarak kullanir. Maintenance mode public layout seviyesinde bakim ekrani gosterir; admin panel bu akisin disindadir.

## Operations Dashboard

`/admin/dashboard` artik gercek PostgreSQL verilerinden beslenen operasyon merkezi olarak calisir.

- Servis talebi ozetleri: yeni, incelenen/bekleyen, onarimda ve secili aralikta tamamlanan talepler.
- Talep yogunlugu: 7/30 gun icin gunluk; 90 gun/yil araligi icin daha uzun bucket stratejisine hazir hafif bar gosterimi ve tablo alternatifi.
- Durum dagilimi ve acik is yuku: PII gostermeden status, atama, ek dosya ve uzun suredir guncellenmeyen talepler.
- Icerik sagligi: blog, cihaz gruplari, hizmetler, homepage, Hero slider ve SEO/medya eksikleri.
- Medya sagligi: aktif/arsivli/unused medya, alt metin eksigi ve DB metadata'sindan toplam variant boyutu.
- Site hazirlik durumu: sirket, iletisim, marka, SEO, legal ve maintenance ayarlari icin configured/missing kontrolu.
- Guvenlik ozeti: yetkili rollerde login/reset/session/MFA ve kritik audit sayimlari.
- Son aktivite: raw audit metadata yerine typed, guvenli etiketlerle gosterilir.

Dashboard role-aware calisir. `EDITOR` agirlikli olarak icerik sagligini, `SERVICE_STAFF` servis operasyonlarini, `ADMIN`/`SUPER_ADMIN` ise daha genis operasyon ve guvenlik ozetlerini gorur. Quick action kartlari mutation izinlerine gore filtrelenir; gorunurluk sadece UX'tir, her modul kendi server-side permission kontrolunu korur.

## User, Role And Permission Management

`/admin/users` ve `/admin/roles` admin kullanici ve fixed-role RBAC yonetimi icin gercek moduller olarak calisir.

- Kullanici listesi: ad, e-posta, rol, aktif/pasif durum, MFA durumu, son giris, aktif oturum sayisi.
- Kullanici olusturma: kalici plaintext sifre yoktur; bilinmeyen random hash ve tek kullanimlik parola kurulum/reset linki uretilir.
- Kullanici detay: guvenlik durumu, aktif oturumlar, etkili izinler, son audit olaylari ve acik servis atama sayisi.
- Rol atama: server-side privilege policy ile korunur ve rol degisikligi hedef kullanicinin aktif oturumlarini iptal eder.
- Deactivation: fiziksel silme yerine `isActive=false`, `deactivatedAt`, `deactivatedById` ve reason kaydi kullanilir; aktif oturumlar revoke edilir.
- Force password reset: eski reset tokenlari gecersiz kilar, yeni token uretir ve oturumlari revoke eder.
- `/admin/roles` fixed system role matrix'i read-only olarak gosterir; permission source of truth kod tarafindaki `rolePermissions` map'idir.

Custom role editing, SCIM/SSO ve enterprise identity federation bu asamada bilincli olarak ertelenmistir.
## Audit Log ve Guvenlik Merkezi

- `/admin/audit` salt okunur audit viewer olarak calisir; kayit duzenleme veya silme yoktur.
- `/admin/audit/[id]` ham JSON yerine yalnizca allowlist'lenmis, redakte edilmis metadata gosterir.
- CSV export yalnizca `audit.export` izni olan kullanicilara aciktir ve export islemi ayrica audit'e yazilir.
- `/admin/security` kimlik dogrulama, oturum, hesap guvenligi, konfigurasyon hazirligi ve son guvenlik olaylarini gercek PostgreSQL verisinden ozetler.
- ADMIN guvenlik merkezini gorebilir; audit export yalnizca SUPER_ADMIN tarafinda kalir.
- Ertelenen isler: SIEM entegrasyonu, dis alarm/notification akisi, cold archive, gelismis anomaly detection ve tam forensic timeline.

## Bildirimler ve E-posta Operasyonu

- `/admin/notifications` kullanicinin kendi panel ici bildirimlerini listeler ve okundu isaretler.
- `/admin/account/notifications` kullanicinin kendi bildirim tercihlerini yonetir; kritik guvenlik e-postalari kapatilamaz.
- `/admin/settings/email` SMTP/capture provider durumunu, queue sagligini ve test e-postasini gosterir.
- `/admin/notifications/email-deliveries` redakte edilmis delivery listesi, retry ve cancel operasyonlarini sunar.
- Delivery operasyonlari `notifications.emailDeliveries.*`, provider ayarlari `notifications.settings.*`, test mail `notifications.testEmail.send` izinleriyle korunur.
- SMS, push notification, bounce webhook ve provider-specific SDK ekranlari sonraki hardening asamasina ertelendi.
