# Deployment Checklist

> Güncel canlı karar kaynağı: `docs/16-production-runbook.md`. Bu dosya tarihsel checklist notlarını da içerir; canlı öncesi son kontrol için önce production runbook okunmalıdır.

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
- Use `npm run admin:list-users` instead of ad-hoc `psql` commands when checking admin accounts; it avoids shell quoting problems and never prints password hashes.
- Use `npm run admin:rotate-password` with `ADMIN_ROTATE_CONFIRM=ROTATE_ADMIN_PASSWORD` for deliberate password rotation. This revokes active sessions for the target user.
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
## Service Request Operations Deployment Notes

- `storage/private/service-requests/` kalıcı disk veya object storage ile korunmalıdır.
- PostgreSQL backup ve private storage backup aynı retention politikasına göre planlanmalıdır; yalnız DB backup dosya içeriklerini kurtarmaz.
- Local JSON import production öncesi yalnız backup alındıktan sonra ve önce dry-run raporu incelenerek çalıştırılmalıdır.
- Import komutu varsayılan olarak yazmaz: `npm run service-requests:import`.
- Gerçek import için bilinçli apply gerekir: `npm run service-requests:import -- --apply`.
- Admin attachment erişimi public CDN veya static hosting üzerinden verilmemelidir; yetkili `/admin/...` route handler veya gelecekte signed/private object storage adapter kullanılmalıdır.
## Media Library Deployment Notes

Development media storage:

- General media files are written under `storage/private/media/`.
- Hardened variants are split into `originals/`, `thumbnails/`, `medium/` and `large/`.
- This directory must be persisted in local/staging environments where uploads should survive restarts.

Production media storage:

- Move the `LocalMediaStorageAdapter` contract to private S3-compatible object storage before relying on multi-instance production uploads.
- Public buckets must not expose raw uploads or private storage keys.
- Public website images should be delivered through a controlled media URL helper, a CDN/object URL policy or a signed/public-object abstraction.
- CDN caching should target hardened immutable variants, not unprocessed uploads.
- PostgreSQL backups do not include file bytes; object storage backups and database backups must be planned together.
- Deleting media is not database-atomic with object storage deletion. Use an outbox/retry deletion workflow before exposing high-volume destructive operations.
- SVG remains intentionally unsupported until a dedicated sanitization strategy exists.
- Service-request attachments must stay outside the media library and must not be migrated into public media storage.

Launch checks for media:

- Upload JPEG, PNG and WebP from the admin panel.
- Confirm thumbnail, medium, large and original hardened variants are created.
- Confirm `/media/[id]/[variant]` works for active media and returns 404 for archived media.
- Confirm raw storage paths are not reachable from the browser.
- Confirm duplicate uploads do not create duplicate file bytes unnecessarily.

## Windows Local Prisma Notes

On Windows, `prisma generate` may fail with `EPERM` if a running `next dev`, `next build`, Prisma Studio or another Node process has loaded files under `node_modules/.prisma/client`.

Before schema-changing work:

1. Stop the local dev server.
2. Run database commands sequentially, not in parallel.
3. Apply migrations first, then generate the Prisma client, then seed.

Recommended local order:

```powershell
$env:DATABASE_URL="postgresql://orontes_dev:LOCAL_ONLY_PASSWORD@localhost:5432/orontes_medikal?schema=public"
npm run db:deploy
npm run db:generate
npm run db:seed
```

If `db:generate` still reports `EPERM`, close remaining project Node processes and run `npm run db:generate` again. Do not delete `node_modules` as a first response; the issue is usually a locked generated client file.
## Blog Publishing Deployment Notes

Scheduled blog publishing currently has a safe foundation but no always-on background worker. Future production automation should run an authenticated/isolated publish-due-posts job or queue worker. Sitemap includes only currently public posts; production DB migrations must run before deployment so `BlogPostRevision` and new blog fields exist before Next build/prerender.

## Site Settings Deployment Notes

Before go-live, verify `/admin/settings` values for company identity, phone, e-mail, WhatsApp message, address, maps, logo, favicon, default OG image, social links, legal visibility and canonical origin. `APP_ORIGIN` remains the deployment guard; `site.seo.canonicalOrigin` may override public URL generation only when intentionally configured.

Maintenance mode can be enabled from admin settings for public pages. Admin routes remain available so an authorized user can disable it. Analytics/search IDs must not be wired to third-party scripts unless cookie-consent gating for the related category is active.
# Admin Account Security Deployment

## User Management Deployment Notes

Before go-live:

- Confirm at least one active SUPER_ADMIN exists.
- Confirm no shared/default admin password exists.
- Configure a real transactional mail provider before relying on new-user setup links.
- Confirm development password-reset email sink files are not used in production.
- Confirm role changes, forced password resets and deactivation revoke active sessions.
- Document the emergency recovery procedure for losing access to all SUPER_ADMIN accounts.

Custom roles, SCIM/SSO and enterprise identity federation are intentionally deferred.

- Production password reset için gerçek transactional mail provider yapılandırılmalıdır.
- Development adapter reset linklerini `storage/private/auth/password-reset-emails/` altına yazar; production'da kullanılmamalıdır.
- `MAIL_PROVIDER`, `MAIL_FROM` ve SMTP/provider secretları yalnız deployment secret manager içinde tutulmalıdır.
- Remember Me için `ADMIN_REMEMBER_SESSION_MAX_AGE_SECONDS` bilinçli belirlenmelidir.
- MFA etkinleştirilmeden önce `MFA_ENCRYPTION_KEY` base64 encoded 32-byte secret olarak sağlanmalıdır.
- Password reset URL'leri validated `APP_ORIGIN` üzerinden üretilir; production'da localhost canonical/origin kabul edilmez.
## Audit ve Security Center Deployment Notlari

- Production'da `APP_ORIGIN`, mail provider ve MFA encryption ayarlari Security Center tarafinda durum olarak gorunur; sir degerleri UI'da gosterilmez.
- Audit export dosyalari kullanici istegine anlik uretilir, server diskinde kalici olarak tutulmaz.
- Expired session cleanup periyodik calistirilmalidir; Security Center suresi gecmis temizlenmemis oturumlari uyarir.
- Canli sonrasi izleme icin ertelenen isler: SIEM entegrasyonu, dis alarm/notification, cold archive ve audit retention politikasi.

## SMTP, DNS ve Mail Worker Deployment

- Production mail icin `MAIL_PROVIDER=smtp`, `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` tanimlanmalidir.
- Sender domain icin SPF, DKIM ve DMARC kayitlari canliya cikmadan once dogrulanmalidir.
- `npm run mail:process -- --batchSize=25` cron/container worker olarak periyodik calistirilmalidir; otomatik delivery bunun schedule edilmesine baglidir.
- Development capture modu production'da kullanilamaz.
- Bounce webhook, provider-specific event webhook, SMS ve push delivery sonraki asamaya ertelidir.
