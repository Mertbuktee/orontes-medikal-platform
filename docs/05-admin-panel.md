# Admin Panel

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

Ilk admin kullanicisi seed ile uretilmez. Bootstrap komutu bilerek ve gecici env degerleriyle calistirilir:

```bash
ADMIN_BOOTSTRAP_EMAIL="admin@example.com" \
ADMIN_BOOTSTRAP_NAME="Admin" \
ADMIN_BOOTSTRAP_PASSWORD="strong-password" \
npm run admin:bootstrap
```

Bootstrap parolasi kaynak koda veya production config dosyasina yazilmaz; islemden sonra ortam degiskenleri temizlenmelidir.

## Service Requests Admin Module

Ilk gercek admin modulu servis talepleridir.

- Public `/api/service-requests` endpoint'i artik `PrismaServiceRequestRepository` ile PostgreSQL'e yazar.
- `/admin/service-requests`: aktif servis taleplerini listeler, durum ve arama filtresi sunar.
- `/admin/service-requests/[id]`: talep detayi, musteri bilgileri, cihaz bilgileri, attachment metadata, internal notlar ve durum gecmisini gosterir.
- Durum guncelleme ve internal not ekleme server action olarak calisir.
- Her mutation kendi icinde `serviceRequests.update` permission kontrolu yapar.
- Durum degisiklikleri `ServiceRequestStatusHistory` ve `AuditLog` kaydi olusturur.
- Internal not ekleme audit metadata'sinda not icerigini saklamaz.

Private dosya storage key veya filesystem path client response'a donulmez. Guvenli admin dosya indirme/goruntuleme endpoint'i sonraki sertlestirilmis adimda acilacaktir.
