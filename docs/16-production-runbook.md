# Production Runbook

Son güncelleme: 2026-07-13

Bu dosya canlıya çıkmadan önce ve canlıya çıktıktan sonra unutulmaması gereken güncel karar kaynağıdır. Sohbette alınan production kararları burada tutulur.

## Hazır Olan Temeller

- Public site çok sayfalı SEO mimarisine geçti.
- Admin panel gerçek auth, opaque database session ve server-side RBAC kullanıyor.
- Prisma 7 + PostgreSQL veri katmanı hazır.
- Servis talepleri public formdan PostgreSQL'e yazılıyor ve admin panelde yönetiliyor.
- Servis talebi attachment dosyaları private storage'da kalıyor; admin route'u olmadan public erişim yok.
- Media Library genel görseller için ayrı private storage domain'i kullanıyor.
- Hero Slider, Cihaz Grupları, Hizmetler ve Ana Sayfa içerikleri DB-backed admin yönetimine geçti.
- Blog CMS DB-backed admin yönetimine geçti; canlıdan önce blog schedule job stratejisi ve gerçek yayın içerikleri ayrıca kontrol edilecek.
- Homepage sections `HomepageSection` modeliyle visibility, order ve content yönetiyor.
- Homepage section içerikleri JSONB saklansa da key'e özel Zod şemalarıyla doğrulanıyor.
- Cookie consent teknik altyapısı hazır; hukuki uyumluluk ayrıca onay gerektiriyor.

## Production Environment

Zorunlu:

- `APP_ENV=production`
- `APP_ORIGIN=https://orontesteknoloji.com`
- `TRUST_PROXY=true`
- `DATABASE_URL=postgresql://...`

Opsiyonel ama bilinçli belirlenmeli:

- `ADMIN_SESSION_MAX_AGE_SECONDS`

Production deployment sinyali (`APP_ENV=production` veya `VERCEL_ENV=production`) varken:

- `APP_ORIGIN` boş olamaz.
- `APP_ORIGIN` HTTPS olmak zorunda.
- `localhost`, `127.0.0.1`, `::1` kabul edilmez.
- Canonical, sitemap, robots ve JSON-LD localhost üretemez.
- `ADMIN_DEV_BYPASS` production'da çalışmamalı.

## Database And Migration Flow

Production'da `db:migrate` kullanılmaz.

Sıra:

```bash
npm run db:generate
npm run db:deploy
npm run build
```

Migration öncesi:

- Managed PostgreSQL instance hazır.
- `DATABASE_URL` sadece server env/secret manager içinde.
- Güncel DB backup alındı.
- Restore prosedürü ayrı ortamda test edildi.
- Local development DB veya test seed verisi production'a körlemesine taşınmadı.

Seed notu:

- Seed production'da fake müşteri, fake servis talebi veya default admin oluşturmamalı.
- Public content seed'i gerekiyorsa önce staging'de doğrulanmalı.
- Hero/media seed dosyalarının local asset bağımlılıkları production ortamında ayrıca kontrol edilmeli.

## First Admin Bootstrap

İlk admin kullanıcı için:

```bash
ADMIN_BOOTSTRAP_EMAIL="..."
ADMIN_BOOTSTRAP_NAME="..."
ADMIN_BOOTSTRAP_PASSWORD="..."
npm run admin:bootstrap
```

Kurallar:

- Default credential yoktur ve eklenmeyecek.
- Bootstrap parolası kaynak koda, dokümana veya loglara yazılmamalı.
- Bootstrap env değerleri işlemden sonra deployment ortamından silinmeli.
- Bootstrap sonrası `npm run admin:list-users` ile kullanıcı kontrol edilmeli.
- Parola rotasyonu gerekiyorsa `npm run admin:rotate-password` kullanılmalı.

## Storage And Object Storage

Development storage:

- Servis talepleri: `storage/private/service-requests/`
- Genel medya: `storage/private/media/`

Production kararı:

- Multi-instance veya kalıcı production için private S3-compatible object storage'a geçilmeli.
- Public bucket kullanılmamalı.
- Raw upload dosyaları public URL ile sunulmamalı.
- Media public delivery yalnız hardened variant ve media ID/variant route'u üzerinden çalışmalı.
- Service-request attachments media library'ye karıştırılmamalı.
- PostgreSQL backup dosya byte'larını içermez; object storage backup planı ayrı yapılmalı.

## Upload, PDF And Malware Scanning

- Reverse proxy body limiti: 12 MB.
- Public servis talebi upload server-side magic-byte, MIME/extension ve boyut kontrolünü korumalı.
- Görseller Sharp ile decode/re-encode edilmeye devam etmeli.
- PDF kabulü production'da malware scanning olmadan tekrar risk değerlendirmesinden geçmeli.
- ClamAV veya managed scanning servisi production hardening olarak planlanmalı.
- Malware scanning yoksa kullanıcıya veya admin'e "antivirüs yapıldı" gibi bir iddia gösterilmemeli.

## Rate Limiting And Proxy

Mevcut in-memory limiter local development için uygundur.

Production öncesi:

- Login rate limit Redis veya shared adapter'a taşınmalı.
- Service request rate limit Redis veya shared adapter'a taşınmalı.
- `TRUST_PROXY=true` yalnız güvenilir reverse proxy arkasında açılmalı.
- Proxy, istemciden gelen forwarded header'ları overwrite etmeli.
- HTTP istekleri HTTPS'e yönlendirilmeli.
- Önerilen header'lar: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, uygun CSP ve Permissions-Policy.

## Admin Launch Checks

Production öncesi admin panelde elle test:

- `/admin/login`
- Login başarısız mesajı generic kalıyor mu?
- Login başarılı olunca `/admin/dashboard`
- Logout POST ile session revoke ediyor mu?
- `VIEWER` mutation yapamıyor mu?
- `SERVICE_STAFF` yalnız servis talebi operasyonlarını yapabiliyor mu?
- `ADMIN` content/media/homepage modüllerini yönetebiliyor mu?
- Audit log kritik mutation'ları kaydediyor mu?
- Cookie consent admin route'larında görünmüyor mu?
- Admin routes sitemap içinde yok mu?
- Robots admin route'ları disallow ediyor mu?

## Public Content Launch Checks

Admin panelden kontrol:

- Hero Slider: aktif slaytlar, autoplay ve media kullanımı.
- Cihaz Grupları: aktif, featured, sıralama, slug, SEO alanları.
- Hizmetler: aktif, featured, sıralama, slug, SEO alanları.
- Ana Sayfa Yönetimi: section visibility/order, Board Repair, Why Us, Process, Final CTA, preview limitleri.
- Homepage SEO: meta title, description, OG görsel.
- Media Library: görsel variantları, archived media davranışı, raw path sızıntısı yok.
- Legal sayfalar: Gizlilik Politikası, KVKK, Çerez Politikası metinleri gerçek ve hukuk/KVKK kontrolünden geçmiş.

## Manual Smoke Test Before Go-Live

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
- Çerez banner ve tercih merkezi
- Servis talebi formu: dosyasız
- Servis talebi formu: geçerli görsel
- Servis talebi formu: unsupported file
- Admin listesinde yeni talep görünümü
- Admin attachment download unauthorized iken erişim yok

## Verification Commands Per Release

```bash
npm run test
npm run lint
npm run build
npm run db:validate
npm run db:generate
npm run qa:visual
```

Production deploy öncesi ek:

```bash
npm run db:deploy
```

## First 24 Hours After Go-Live

- Application error logları.
- Admin login failure oranı.
- Service request accepted/failed oranı.
- Upload error oranı.
- Rate-limit hit oranı.
- 404 route raporları.
- Sitemap erişilebilirliği.
- Search Console index coverage.
- Core Web Vitals.
- DB backup job başarısı.
- Object storage quota.
- Audit log yazımı.

## Deferred But Not Forgotten

- Redis/shared rate limiter.
- S3-compatible production storage adapter.
- Blog scheduled publishing worker/cron and editorial review workflow.
- Malware scanning / PDF hardening.
- Blog CMS ve gerçek `/blog/[slug]`.
- Kullanıcılar, roller ve audit log ekranları.
- Site ayarları / iletişim / global SEO yönetimi.
- Notification modülü: e-posta/SMS/WhatsApp teslimi.
- Retention/KVKK silme-anonimleştirme prosedürü.
- Legal metinlerin hukuk/KVKK uzmanı tarafından onayı.

## Update Policy

Her yeni admin/public/security modülü tamamlandığında bu dosya güncellenecek. Canlıya çıkmadan önce bu dosya son kez baştan sona okunacak ve işaretlenmemiş production maddeleri kapatılmadan deploy yapılmayacak.
