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
