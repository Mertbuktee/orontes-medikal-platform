# SEO Standardı

Public site çok sayfalı mimariye taşındıktan sonra her sayfa aşağıdaki teknik sözleşmeye göre yönetilir.

## Public Sayfalar

- `/`
- `/hizmetler`
- `/cihazlar`
- `/elektronik-kart-tamiri`
- `/hakkimizda`
- `/servis-sureci`
- `/blog`
- `/iletisim`
- `/servis-talebi`

Yasal sayfalar da sitemap içinde yer alır:

- `/cerez-politikasi`
- `/gizlilik-politikasi`
- `/kvkk`

## Metadata

Her public sayfa için:

- Benzersiz title
- Benzersiz description
- Canonical path
- Open Graph title
- Open Graph description
- Open Graph URL

Metadata üretimi merkezi yapıdan beslenir:

- `src/config/site.ts`
- `src/lib/seo/metadata.ts`

Production domain değeri `APP_ORIGIN` üzerinden verilir. Geliştirme ortamında güvenli fallback `http://localhost:3000` kullanılır.

## Sitemap ve Robots

- Sitemap: `src/app/sitemap.ts`
- Robots: `src/app/robots.ts`

Sitemap yalnızca public sayfaları içerir. API ve admin route'ları sitemap'e eklenmez.

Robots:

- `/api/` disallow
- `/admin/` disallow
- sitemap URL bildirimi

## Structured Data

Eklenen yapılandırılmış veri:

- Organization JSON-LD: global layout
- LocalBusiness JSON-LD: iletişim sayfası
- BreadcrumbList JSON-LD: detay sayfaları

Kasıtlı olarak eklenmeyenler:

- Rating
- Review
- Price
- Opening hours
- Sertifika veya yetki iddiaları

Bu bilgiler gerçek ve doğrulanmış şirket verisi olmadan eklenmemelidir.

## Blog Mimarisi

Blog listesi şimdilik `/blog` altında anchor tabanlı planlı içerik yapısıdır. İnce içerik üretmemek için sahte detay sayfaları oluşturulmaz.

Gelecek mimari:

- `/blog/[slug]`
- Yayın durumu
- Yayın tarihi
- Kapak görseli
- İçerik blokları
- SEO title
- SEO description

## Cihaz ve Hizmet İçerikleri

Cihaz ve hizmet kartları typed content katmanından beslenir:

- `src/content/devices.ts`
- `src/content/services.ts`

Admin panelde yönetilecek alanlar:

- Başlık
- Slug
- Kısa açıklama
- Detay açıklama
- Icon key
- Yetenek etiketleri
- Öne çıkarılmış durum
- Sıralama
- Aktif / pasif
- SEO title
- SEO description
