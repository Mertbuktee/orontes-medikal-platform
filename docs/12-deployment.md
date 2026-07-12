# Deployment Checklist

Bu dosya Orontes Medikal Platform canlıya alınmadan önce ve canlıya alındıktan sonra unutulmaması gereken teknik, güvenlik, SEO ve operasyon adımlarını takip etmek için tutulur.

Public site şu an feature-freeze adayıdır. Admin panel foundation başlamadan önce bu checklist korunmalı; canlıya çıkış öncesinde her madde tekrar gözden geçirilmelidir.

## Production Environment

Canlı ortamda zorunlu değişkenler:

- `APP_ENV=production`
- `APP_ORIGIN=https://orontesteknoloji.com`
- `TRUST_PROXY=true`

Kurallar:

- `APP_ORIGIN` production deployment sırasında zorunludur.
- `APP_ORIGIN` mutlak ve geçerli HTTPS URL olmalıdır.
- `localhost`, `127.0.0.1` ve `::1` production origin olarak kabul edilmez.
- Canonical, sitemap, robots ve JSON-LD URL'leri production ortamda localhost üretmemelidir.
- Development ortamında `APP_ORIGIN=http://localhost:3000` kullanılabilir.

Deploy platformunda kontrol edilecekler:

- Environment variable değerleri doğru girildi.
- Preview ve production ortamları karıştırılmadı.
- Build loglarında `APP_ORIGIN` guard hatası yok.
- Production build sonrası `/sitemap.xml` canlı domain ile üretiliyor.
- Production build sonrası `/robots.txt` canlı sitemap URL'sini gösteriyor.

## Reverse Proxy And Network

Canlı ortam reverse proxy veya edge katmanı:

- HTTPS zorunlu olmalı.
- HTTP istekleri HTTPS'e yönlendirilmeli.
- Upload body limiti uygulanmalı: `12M`.
- Nginx örneği: `client_max_body_size 12M;`
- `x-forwarded-for` ve `x-real-ip` başlıkları proxy tarafından overwrite edilmeli.
- İstemciden gelen sahte forwarded header'lar temizlenmeli.
- `TRUST_PROXY=true` yalnızca güvenilir proxy arkasında açılmalı.

Önerilen güvenlik header'ları:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- Uygun `Content-Security-Policy`
- `Permissions-Policy`

Not: Header politikaları deploy platformuna göre ayrıca doğrulanmalıdır.

## Storage And Uploads

Development mevcut durum:

- Dosyalar `storage/private/service-requests/` altında tutulur.
- Talep metadata kayıtları `storage/private/service-requests/requests/` altında local JSON olarak saklanır.

Production öncesi yapılacaklar:

- Local JSON repository yerine PostgreSQL/Prisma repository kullanılmalı.
- Local private filesystem yerine private S3-compatible object storage kullanılmalı.
- Upload bucket public olmamalı.
- Uploaded dosyalar doğrudan public URL ile servis edilmemeli.
- Dosya isimleri server-side UUID ile saklanmalı.
- Orijinal dosya adı sadece sanitize edilmiş metadata olarak tutulmalı.
- Dosya erişimi admin yetkisi ve audit log ile kontrol edilmeli.

Malware scanning:

- Production'da gerçek antivirüs/malware scanning eklenmeden PDF ve doküman kabulü tekrar risk değerlendirmesinden geçmeli.
- ClamAV veya managed malware scanning servisi eklenmeli.
- Dosyalar tarama tamamlanana kadar karantinada tutulmalı.
- PDF için ileride yapısal doğrulama veya CDR katmanı değerlendirilmeli.

Retention:

- Servis talebi dosyalarının saklama süresi belirlenmeli.
- Silme ve arşivleme politikası belirlenmeli.
- Backup içindeki silinmiş dosya davranışı belirlenmeli.
- KVKK talepleri için silme/anonimleştirme prosedürü yazılmalı.

## Database And Persistence

Production hedefi:

- PostgreSQL
- Prisma ORM
- Redis cache/rate-limit
- Private object storage

Canlı öncesi yapılacaklar:

- Prisma schema oluşturulmalı.
- Migration akışı tanımlanmalı.
- Seed/test data canlıya taşınmamalı.
- Admin kullanıcı bootstrap süreci güvenli olmalı.
- Database backup planı oluşturulmalı.
- Backup restore testi yapılmalı.
- Service request metadata artık local JSON'a yazılmamalı.

## Rate Limiting

Mevcut development:

- In-memory limiter
- 5 submission / IP / 15 dakika

Production öncesi:

- Redis-backed rate limiter eklenmeli.
- Multi-instance deploylarda limiter ortak state kullanmalı.
- Proxy IP güven modeli doğrulanmalı.
- Rate-limit bypass testleri yapılmalı.
- 429 response kullanıcı deneyimi kontrol edilmeli.

## Service Request Form

Korunması gereken mevcut davranış:

- Endpoint: `POST /api/service-requests`
- `multipart/form-data`
- `website` honeypot
- `formStartedAt`
- Tek dosya yükleme
- Server-side dosya validasyonu
- Magic byte kontrolü
- Image re-encode
- PDF signature/EOF kontrolü
- Hassas veri loglanmaması

Canlı öncesi:

- Form gönderimi production domain üzerinden test edilmeli.
- Dosyalı ve dosyasız başvuru test edilmeli.
- Büyük dosya 413 response test edilmeli.
- Desteklenmeyen dosya response test edilmeli.
- Rate limit response test edilmeli.
- Talep admin panelde detaylı görüntülenebilir hale getirilmeli.
- Mail bildirimi gerekiyorsa güvenli mail provider ile eklenmeli.

## Admin Panel Deployment Notes

Admin foundation sırasında yapılacak route ayrımı:

```text
src/app/
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── cihazlar/
│   ├── hizmetler/
│   └── ...
├── admin/
│   ├── layout.tsx
│   └── ...
└── api/
```

Admin canlıya çıkmadan önce:

- `/admin` public sitemap'e eklenmemeli.
- `/admin` robots tarafından disallow edilmeli.
- Cookie consent banner admin route'larında görünmemeli.
- Admin layout public Navbar/Footer kullanmamalı.
- Auth zorunlu olmalı.
- Session cookie secure/httpOnly/sameSite olmalı.
- CSRF stratejisi belirlenmeli.
- Role-based access control uygulanmalı.
- Audit log yazılmalı.
- Admin dosya görüntüleme ve indirme yetki kontrolünden geçmeli.

## SEO Launch Checklist

Canlı öncesi:

- `APP_ORIGIN` canlı domain ile doğru.
- Her public sayfada unique title ve description var.
- Canonical URL'ler canlı domain ile doğru.
- Open Graph title/description doğru.
- Gerçek OG image hazırlanmalı.
- `/sitemap.xml` canlıda erişilebilir.
- `/robots.txt` canlıda erişilebilir.
- Sitemap yalnızca public route'ları içeriyor.
- API/admin route'ları sitemap dışında.
- Organization JSON-LD doğrulanmalı.
- LocalBusiness JSON-LD iletişim sayfasında doğrulanmalı.
- Breadcrumb JSON-LD detay sayfalarında doğrulanmalı.
- Rating/review/price gibi gerçek olmayan schema eklenmemeli.
- Google Search Console mülkü açılmalı.
- Sitemap Search Console'a gönderilmeli.
- Google Business Profile bilgileri doğrulanmalı.

Canlı sonrası:

- Search Console index coverage kontrol edilmeli.
- Sitemap crawl durumu kontrol edilmeli.
- 404 raporları izlenmeli.
- Marka araması ve sitelink görünümü takip edilmeli.
- Core Web Vitals izlenmeli.
- Sayfa başlıkları ve snippet'ler gerçek arama sonuçlarında gözlenmeli.

## Cookie Consent And Legal

Canlı öncesi:

- Çerez politikası hukuk/KVKK uzmanı tarafından kontrol edilmeli.
- Gizlilik politikası kontrol edilmeli.
- KVKK aydınlatma metni kontrol edilmeli.
- Gerçek kullanılan analytics/marketing scriptleri consent kategorileriyle eşleşmeli.
- Analytics scriptleri `analytics` consent olmadan çalışmamalı.
- Marketing scriptleri `marketing` consent olmadan çalışmamalı.
- Cookie `Secure` production'da aktif olmalı.
- Footer'daki legal linkler canlıda çalışmalı.

Not:

- Mevcut teknik consent altyapısı tek başına hukuki uyumluluk garantisi değildir.

## Content And Media

Canlı öncesi gerçek şirket girdisi gerekenler:

- Gerçek OG/social paylaşım görseli
- Blog detay içerikleri
- Blog kapak görselleri
- Hizmet sayfaları için daha uzun özgün teknik içerikler
- Elektronik kart tamiri landing page için SSS
- Gerçek çalışma saatleri, eğer yayınlanacaksa
- Yetki, sertifika, marka, yıl, sayı gibi iddialar ancak doğrulanmışsa eklenmeli

Şimdilik bilinçli olarak ertelenenler:

- `/blog/[slug]` detay sayfaları
- Admin-managed public page content
- Admin-managed media library
- Admin-managed SEO fields

## Monitoring And Operations

Canlı sonrası izlenecekler:

- Application error logs
- Service request accepted/failed log oranı
- Rate-limit hit oranı
- Upload storage büyümesi
- Malware scanning sonuçları
- 404 route logları
- Admin login denemeleri
- Audit log bütünlüğü
- Database backup başarısı
- Disk/object storage quota
- Core Web Vitals
- Search Console uyarıları

Log kuralları:

- Telefon, e-posta, mesaj içeriği ve dosya içeriği loglanmamalı.
- Request ID loglanabilir.
- Dosya path'i client response içinde dönmemeli.

## Admin Authentication Deployment

Before enabling the admin panel in production:

- Set `DATABASE_URL` in the hosting environment.
- Set `APP_ENV=production` and an HTTPS `APP_ORIGIN`.
- Ensure HTTPS is active so `orontes_admin_session` is sent with `Secure`.
- Run production migrations with `npm run db:deploy`.
- Create the first super admin with `npm run admin:bootstrap` using temporary, secret environment variables.
- Remove `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME` and `ADMIN_BOOTSTRAP_PASSWORD` after bootstrap.
- Do not use default credentials; none are shipped with the app.
- Replace local/in-memory login rate limiting with Redis or a shared production adapter before multi-instance deployment.
- Keep `ADMIN_SESSION_MAX_AGE_SECONDS` explicit if the default 10-hour admin session is not desired.

Logout uses `/admin/auth/logout` because the admin session cookie is scoped to `/admin`.

## Verification Commands

Canlı öncesi her release için:

```bash
npm run test
npm run lint
npm run build
npm run qa:visual
```

Ek manuel kontroller:

- `/`
- `/hizmetler`
- `/cihazlar`
- `/elektronik-kart-tamiri`
- `/hakkimizda`
- `/servis-sureci`
- `/blog`
- `/iletisim`
- `/servis-talebi`
- `/sitemap.xml`
- `/robots.txt`
- 404 sayfası
- Mobil menü
- Çerez banner
- Çerez tercih merkezi
- Servis talebi formu

## Feature Freeze Notes

## PostgreSQL / Prisma Deployment Flow

Zorunlu production environment:

- `DATABASE_URL`
- `APP_ENV=production`
- `APP_ORIGIN=https://orontesteknoloji.com`
- `TRUST_PROXY=true`

Production database:

- Managed PostgreSQL veya guvenilir self-hosted PostgreSQL kullanilmali.
- Connection string secret manager veya platform env sistemi ile verilmeli.
- `DATABASE_URL` repo, client bundle veya log icinde gorunmemeli.
- Pooling ihtiyaci deploy platformuna gore planlanmali. Serverless ortamlarda pooler veya Prisma'nin onerilen deployment stratejisi degerlendirilmelidir.

Migration akisi:

```bash
npm run db:generate
npm run db:deploy
npm run build
```

Kurallar:

- Production'da `db:migrate` yerine `db:deploy` kullanilir.
- `prisma migrate reset` production'da kullanilmaz.
- Migration oncesi backup alinmali.
- En az bir restore testi canliya gecmeden once yapilmali.
- Seed canli ortamda fake admin, fake servis talebi veya fake musteri verisi olusturmamalidir.
- Initial admin bootstrap ayri ve denetlenebilir komutla uygulanmalidir.

Backup/restore:

- Gunluk otomatik backup planlanmali.
- Backup retention suresi KVKK ve operasyon ihtiyacina gore kararlastirilmali.
- Restore proseduru dokumante edilmeli ve periyodik test edilmelidir.
- Object storage ve PostgreSQL yedeklerinin tutarliligi ayrica planlanmalidir.

Public site şu an şu durumdadır:

- Çok sayfalı mimari hazır.
- SEO temel altyapısı hazır.
- Sitemap/robots hazır.
- JSON-LD temel altyapısı hazır.
- Güvenli servis talebi endpoint'i hazır.
- Admin-ready typed content geçici katmanı hazır.

Public siteye bundan sonra yalnızca şu nedenlerle dönülmelidir:

- Gerçek içerik eklemek
- Blog detay sayfaları kurmak
- Hata düzeltmek
- SEO/canlı yayın gereği production ayarlarını tamamlamak

Bir sonraki büyük geliştirme: Admin Panel Foundation.
