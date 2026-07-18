# Orontes Medikal Platform

Orontes Medikal Platform; public medikal teknik servis web sitesi,
veritabanı destekli admin paneli ve ayrı teknik operasyon paneli için
geliştirilen bir Next.js 16 uygulamasıdır. Servis talepleri, müşteri/cihaz
kayıtları, medya, ana sayfa içerikleri, blog içerikleri, site ayarları,
bildirimler, audit kayıtları ve release-readiness kontrollerini yönetir.

Bu repository production secret, varsayılan giriş bilgisi veya tamamlanmış bir
public deployment içermez.

## Teknoloji

- App Router ve standalone output ile Next.js 16.2.10
- React 19
- TypeScript
- PostgreSQL ile Prisma 7
- Tailwind CSS
- Görsel ve release E2E kontrolleri için Playwright
- Unit/integration testleri için Vitest
- Production benzeri çalışma ortamı için Docker ve Docker Compose referansları

## Public Modüller

- Ana sayfa
- Hizmetler
- Cihaz grupları
- Elektronik kart tamiri
- Hakkımızda
- Servis süreci
- Blog liste/detay/kategori sayfaları
- İletişim
- Servis talebi formu
- Yasal sayfalar
- Sitemap ve robots

Public servis talebi ekleri yalnızca görsel kabul eder: JPEG, PNG ve WebP
desteklenir; PDF ve doküman yüklemeleri reddedilir.

## Admin Modülleri

- Kimlik doğrulama ve hesap güvenliği
- Dashboard
- Servis talebi yönetimi
- Medya kütüphanesi
- Hero slider yönetimi
- Cihaz ve hizmet yönetimi
- Ana sayfa yönetimi
- Blog CMS
- Site ayarları
- Kullanıcılar ve sabit roller
- Audit Log ve Güvenlik Merkezi
- Bildirimler ve e-posta delivery queue

## Teknik Panel

- Ayrı `/technical/login` ve `/technical` shell yapısı
- Tekniker servis talebi kuyruğu ve detay akışı
- Müşteri, lokasyon, yetkili ve cihaz kayıtları
- Tamamlanan taleplerden otomatik cihaz servis geçmişi
- Marka, model ve seri numarasına göre aynı cihazın önceki geçmiş eşleşmesi
- Teknik bildirim önizlemesi ve `/technical/notifications`

## Gereksinimler

- Node.js `22.13.1`
- Node 22 ile uyumlu npm
- Docker Desktop veya Docker Engine kurulumu
- Local development için PostgreSQL 17, genellikle Docker Compose üzerinden

Local Node 24 birçok komutu çalıştırabilir; ancak proje politikası Node
`22.13.1` kullanmaktır. CI ve production image’ları Node `22.13.1` kullanır.

## Kurulum

```bash
npm ci
```

Windows’ta `npm ci` çalıştırmadan önce çalışan Next.js/dev process’lerini
durdurun; Tailwind veya Lightning CSS gibi native paketler aksi halde işletim
sistemi tarafından kilitlenebilir.

## Ortam Değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayın ve local-only değerleri
doldurun.

Local veritabanı destekli çalışma için gerekli değerler:

```bash
APP_ORIGIN=http://localhost:3000
TRUST_PROXY=false
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/orontes_medikal?schema=public"
MAIL_PROVIDER=development
```

Gerçek secret değerleri asla commit etmeyin.

## PostgreSQL

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

Production ortamında `db:migrate` yerine `npm run db:deploy` kullanın.

## İlk Admin

Varsayılan admin kullanıcı bilgisi yoktur.

```bash
ADMIN_BOOTSTRAP_EMAIL="admin@example.com" ^
ADMIN_BOOTSTRAP_NAME="Admin" ^
ADMIN_BOOTSTRAP_PASSWORD="use-a-real-secret" ^
npm run admin:bootstrap
```

Kullanımdan sonra bootstrap ortam değişkenlerini kaldırın.

## Geliştirme

```bash
npm run env:check
npm run dev
```

`http://localhost:3000` adresini açın.

## Kalite Kontrolleri

```bash
npm run db:validate
npm run db:generate
npm run test
npm run lint
npm run build
npm run qa:visual
npm run security:audit
```

Release E2E kontrolleri:

```bash
npm run test:e2e:service-requests
npm run test:e2e:rbac
```

## E-posta

Development e-postaları private storage altında capture edilir. Production’da
capture mode kullanılamaz.

```bash
npm run mail:verify
MAIL_TEST_RECIPIENT="operator@example.com" MAIL_TEST_CONFIRM=SEND_TEST_EMAIL npm run mail:test
npm run mail:process
```

Gerçek SMTP gönderimi provider credential’ları ve DNS çalışması gerektirir:
SPF, DKIM, DMARC ve MAIL FROM alignment.

## Yedekler

```bash
npm run backup:database
npm run backup:verify -- backups/database/example.dump
npm run storage:migrate:dry-run
```

Local backup komutu PostgreSQL dump ve checksum metadata oluşturur. Bu komut,
off-host backup’ın aktif olduğunu kanıtlamaz. Production ortamında uzak backup
hedefi yapılandırılmalı ve restore prosedürleri test edilmelidir.

## Production Docker

`next build` sırasında build’in veritabanı erişimine ihtiyacı vardır;
`DATABASE_URL` değerini BuildKit secret olarak geçin.

```bash
docker build --secret id=database_url,env=DATABASE_URL --target runner -t orontes-medikal-platform:release .
docker build --target worker -t orontes-medikal-platform:worker .
```

Başlatılmış bir ortama karşı smoke test çalıştırın:

```bash
SMOKE_BASE_URL=https://example.com npm run smoke
```

## Hazırlık Kontrolü

```bash
npm run production:check
```

Bu komut yalnızca güvenli diagnostik çıktılar üretir. Launch blocker kaldığında
non-zero exit code ile çıkar.

## Güvenlik Uyarıları

- `.env` dosyalarını açığa çıkarmayın.
- Private storage alanını açığa çıkarmayın.
- `Prisma Studio`yu public olarak çalıştırmayın.
- HTTPS kullanın ve `TRUST_PROXY=true` değerini yalnızca güvenilir reverse proxy arkasında etkinleştirin.
- In-memory rate limiting yalnızca single-instance çalışma için uygundur.
- MFA, end-to-end enforcement akışı etkinleştirilene kadar foundation seviyesindedir.

## Dokümantasyon İndeksi

- `docs/08-architecture.md`
- `docs/09-api.md`
- `docs/10-database.md`
- `docs/11-security.md`
- `docs/12-deployment.md`
- `docs/13-testing.md`
- `docs/16-production-checklist.md`
- `docs/16-production-runbook.md`
- `docs/17-release-candidate-audit.md`
- `docs/18-production-values-checklist.md`

## Deployment Uyarısı

Bu repository bir release candidate hazırlayabilir; ancak gerçek production DNS,
TLS, SMTP, object storage, monitoring, hukuki onay veya off-host backup
yapılandırmasını tek başına sağlamaz. Local ortamda yeşil build almak,
production deployment’ın tamamlandığı anlamına gelmez.
