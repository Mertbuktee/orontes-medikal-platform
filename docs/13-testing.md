# Testing Strategy

## Admin Authentication Tests

Authentication tests cover server-side security contracts without requiring real browser credentials:

- Argon2id password hashing and verification.
- Password policy minimum and maximum length.
- High-entropy opaque session token generation.
- Raw session token is not stored in database DTOs.
- Expired, revoked and inactive-user sessions fail validation.
- Login rate limit activates and resets after a successful login.
- Bootstrap refuses missing variables and weak passwords.
- Bootstrap does not create duplicate super admins.
- RBAC checks keep `SUPER_ADMIN` fully privileged and prevent `VIEWER` management access.
- Audit metadata helpers reject password/token/hash shaped data.

Database-backed login route testing should use a dedicated test database or transaction strategy. Destructive resets must never run against production data.

## Database Tests

Database foundation testleri varsayilan olarak live production database gerektirmez. Unit testler schema sozlesmesi, seed donusumu, repository DTO guvenligi ve local JSON import dry-run davranisini dogrular.

Kapsanan alanlar:

- Prisma enumlari ile RBAC type'lari hizali mi?
- Service request status akisi schema'da eksiksiz mi?
- Technical customer/device registry ve technical service request modelleri WorkOrder eklemeden tanimli mi?
- Device/service slug'lari unique mi?
- Seed transformlari order, active ve featured alanlarini koruyor mu?
- Repository DTO'lari `passwordHash` dondurmuyor mu?
- Local JSON importer dry-run ve duplicate raporu uretiyor mu?
- `DATABASE_URL` eksikse DB operasyonlari erken hata veriyor mu?
- Public sayfalar henuz dogrudan database import etmiyor mu?

## Integration Tests

Local integration dogrulamasi Docker PostgreSQL ile yapilir:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed
```

Ikinci seed calistirmasi idempotency kontrolu olarak kullanilir.

## Production Database Testing

Production veritabani testleri canli data uzerinde destructive calismaz.

- Migration staging/preview ortamda denenmeli.
- Backup restore testi production oncesi ayri ortamda yapilmali.
- Admin CRUD geldikten sonra repository integration testleri fixture database ile calismalidir.

## Standard Verification

Her buyuk degisiklikte:

```bash
npm run test
npm run lint
npm run build
npm run db:validate
npm run db:generate
```
## Service Request Module Tests

Unit coverage includes RBAC role behavior, service request status transition policy, upload validation and public route response behavior. Database-backed module tests should use an isolated test database or transaction strategy before destructive scenarios are added.

Manual local verification for the module:

1. Submit a public service request without attachment.
2. Submit a public service request with a valid image or PDF.
3. Confirm both records appear in PostgreSQL.
4. Confirm `/technical/service-requests` lists them after login.
5. Confirm malformed phone values such as `0535+564` are rejected before persistence.
6. Link or create a customer and customer device when the device identity is known.
7. Fill diagnosis, work performed and final result; complete the request without requiring technician assignment.
8. Confirm the current user becomes `completedById` and linked device `lastServiceAt` is updated.
9. Confirm `/technical/history` shows the completed, linked device service history.
10. Confirm `/technical/service-requests` and `/admin/service-requests` auto-refresh through the live watcher when new requests arrive.
11. Open detail, update status, add an internal note and assign a user when available.
12. Confirm authorized attachment download works and unauthenticated access fails.
13. Archive the request and confirm it disappears from the default active listing.
14. Confirm status history and audit rows are created without PII-heavy metadata.

Visual QA now also captures synthetic admin service-request list and detail states. These screenshots must not include real customer data or private customer attachments.

## Media Library Tests

Media tests cover the shared upload foundation without using customer attachments:

- JPEG, PNG and WebP processing.
- SVG and unknown file rejection.
- Server-side MIME, extension and magic-byte enforcement.
- Sharp derivative generation for original, thumbnail, medium and large variants.
- No unnecessary upscale for small images.
- Local private media storage path isolation.
- Media page-size allowlist behavior.
- Duplicate detection, archive/delete and usage queries should be covered with isolated database integration tests as the media CRUD surface grows.

Visual QA captures:

- `/admin/media` desktop gallery.
- `/admin/media` mobile layout.
- `/admin/media/[id]` media detail.

Synthetic visual QA media must be clearly test-only and stored under `storage/private/media/`. Service-request attachments are never used as media visual fixtures.

## Hero Slider Tests

Hero Slider coverage includes:

- active slide filtering and ordering
- autoplay skip behavior for manually reachable slides
- reduced-motion, hover/focus and visibility pause logic
- safe link and object-position validation
- slider settings bounds
- backwards-compatible slider counter default
- RBAC permissions for Hero slider management

Database-backed Hero slide repository behavior should use isolated database integration tests before destructive reorder/delete scenarios are expanded.

Panel search and footer settings coverage:

- site settings tests verify backwards-compatible footer advanced defaults
- source-of-truth tests guard against hardcoded footer social/powered-by identity
- visual QA covers homepage/footer rendering after settings changes

## Device Group Tests

Device group coverage includes:

- slug normalization and URL-safe validation
- icon-key and capability allowlists
- admin page-size allowlist behavior
- RBAC distinction between view, update, publish, reorder and delete permissions
- seed import idempotency through slug-based upsert
- public featured device limit and active-only behavior

Repository reorder/archive/delete behavior should use isolated database integration tests before destructive scenarios are expanded.
# Hizmet Modülü Testleri

Hizmet validasyonu için slug normalizasyonu, allowlist ikon kontrolü, CTA URL güvenliği, CTA eşleşme kuralı ve liste sorgusu normalizasyonu test edilir. Repository ve public entegrasyon testleri cihaz modülündeki DB stratejisiyle aynı izole test veritabanı yaklaşımını kullanmalıdır.
## Homepage Content Tests

Ana sayfa yönetimi için öncelikli test kapsamı:

- section key allowlist doğrulaması
- section payload Zod şemaları
- güvenli CTA URL doğrulaması
- Why Us / Process aktif item minimumları
- public render’da görünür section sıralaması
- mutation sonrası `homepage-content` ve `homepage-seo` cache invalidation

Repository ve visual QA kapsamı ileride section başına özel görsel editörler eklendikçe genişletilecektir.
## Blog CMS Tests

Blog validation tests cover safe structured blocks, H1 rejection, unknown block rejection, empty article rejection and Turkish slug normalization. Category policy tests cover active category exposure, inactive category rejection, empty-category 404 policy and sitemap inclusion/exclusion. Visual QA includes admin blog list/create/edit/preview and public blog list/detail/category routes on desktop and mobile. Repository and visual coverage should be expanded with real DB fixtures before final production freeze, especially publish/schedule/cache and draft preview authorization paths.

## Site Settings Tests

Site settings validation tests cover default parsing, phone/e-mail validation, safe URL/CTA protocol handling and maintenance mode payloads. Visual QA captures `/admin/settings` desktop and mobile states. Production hardening should add database-backed integration tests for settings audit events, branding media relation checks and maintenance mode smoke tests.
# Account Security Tests

## Operations Dashboard Tests

Dashboard tests cover the pure range and aggregation helpers first:

- allowlisted range parsing and default `30d` fallback
- previous-period comparison without misleading percentages when the previous period is zero
- zero-filled timeline buckets
- `Europe/Istanbul` display bucket behavior
- role-specific dashboard permission scopes

Visual QA should capture the protected dashboard desktop/mobile states after login. Future hardening should add isolated database fixtures for heavy service-request workload, empty database state, role dashboards and activity-feed privacy assertions.

## User Management Tests

User-management coverage prioritizes privilege-escalation policy and lifecycle behavior:

- ADMIN cannot create/promote/manage SUPER_ADMIN accounts.
- Users cannot change their own role or deactivate themselves.
- The last active SUPER_ADMIN cannot be demoted or deactivated.
- New-user onboarding and forced reset must not create plaintext/default passwords.
- Role changes, deactivation and forced reset revoke sessions.
- User DTOs and visual QA must not expose password hashes, token hashes, reset tokens, MFA secrets or real account data.

- Remember Me session duration and cookie/DB expiry policy helpers are unit-tested.
- Password reset token entropy, hashing, TTL and validation helpers are unit-tested.
- MFA AES-256-GCM encryption/decryption, wrong-key failure and recovery-code hashing are unit-tested.
- Full DB-backed password reset/session revocation integration should be covered with isolated test database before production hardening.
## Audit ve Security Center Testleri

- Audit presentation unit testleri hassas metadata redaction, allowlisted metadata sunumu, kategori/severity turetimi, IP ve user-agent redaction davranisini kapsar.
- Visual QA kapsamina `/admin/audit` ve `/admin/security` desktop/mobile ekranlari eklendi.
- Export ve aggregate sorgular canli PII gostermeden safe DTO uzerinden test edilmelidir.

## Notification ve Mail Testleri

- Mail config testleri production guard, missing SMTP config ve development capture davranisini kapsar.
- Template testleri HTML escape, unsafe URL reddi ve plain-text fallback davranisini kapsar.
- Queue testleri enqueue, idempotency, retry backoff, SENT/FAILED transition ve worker batch davranisini kapsamalidir.
- Visual QA notification listesi, preferences, email settings ve delivery list ekranlarini synthetic data ile yakalar.
