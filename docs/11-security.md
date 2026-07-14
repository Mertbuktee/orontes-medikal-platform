# Security Notes

## Secure Admin Authentication

Admin authentication uses database-backed opaque sessions.

Password policy:

- Hash algorithm: Argon2id.
- Minimum password length: 12 characters.
- Maximum password length: 128 characters.
- Passwords are never logged, returned, seeded as defaults or stored in plaintext.

Session policy:

- Cookie name: `orontes_admin_session`.
- Cookie attributes: HttpOnly, SameSite=Lax, Path=/admin, Secure in production.
- The browser stores only the raw opaque token.
- PostgreSQL stores only a SHA-256 hash of the token.
- Default session lifetime: 10 hours, configurable with `ADMIN_SESSION_MAX_AGE_SECONDS`.
- Expired, revoked and inactive-user sessions are rejected.

Login protection:

- Login POSTs require same-origin validation.
- Errors remain generic; account existence is not disclosed.
- Login attempts are rate-limited per normalized email and trusted client IP.
- The current in-memory login limiter is suitable for local development only; production should use Redis or an equivalent shared store.

Bootstrap:

- Initial admin creation is explicit through `npm run admin:bootstrap`.
- Required env values: `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_PASSWORD`.
- Bootstrap refuses weak passwords and does not create duplicate super admins.
- Bootstrap variables must be removed from the deployment environment after use.

Audit:

- LOGIN, LOGIN_FAILURE and LOGOUT are persisted.
- Audit metadata must never contain passwords, raw session tokens, token hashes, password hashes or full request bodies.

## Cookie Consent Foundation

The public website stores cookie preferences in a first-party cookie named
`orontes_cookie_consent`.

Stored data:

- `version`: current consent version, currently `1`
- `necessary`: always `true`
- `analytics`: optional analytics consent
- `marketing`: optional marketing consent
- `updatedAt`: ISO timestamp of the latest selection

Retention and attributes:

- Maximum lifetime: 180 days
- `Path=/`
- `SameSite=Lax`
- `Secure` only in production
- No IP address, user ID, email, phone number or other personal information is
  stored in the cookie

Default behavior:

- Necessary cookies are always enabled and cannot be disabled.
- Analytics cookies are disabled by default.
- Marketing cookies are disabled by default.
- If the cookie is missing, malformed or older than the current consent version,
  the consent banner is shown again.

Future analytics integrations must be gated behind `AnalyticsConsentGate` or an
equivalent typed helper and must not run before `consent.analytics === true`.
Future marketing or remarketing integrations must be gated behind
`MarketingConsentGate` or an equivalent typed helper and must not run before
`consent.marketing === true`.

Legal policy text and real policy URLs must be reviewed before production. This
technical implementation does not by itself constitute KVKK, GDPR or other legal
compliance.

## Admin Security Foundation

## Database Security

`DATABASE_URL` yalnizca server ortam degiskeni olarak tutulur. Client component, browser bundle, public config veya response icinde gosterilmez.

Kurallar:

- Prisma client yalniz server-side import edilir.
- `src/lib/database/prisma.ts` browser ortaminda calisirsa hata verir.
- Repository DTO'lari `passwordHash` dondurmez.
- Plain password database modelinde yer almaz.
- Parola hashleme ve dogrulama bir sonraki auth gorevinde server-side uygulanacaktir.
- Database credential loglanmaz.
- External input once Zod veya ilgili validation katmanindan gecirilir.
- Mass-assignment kalibi kullanilmaz; repository data alanlari acikca maplenir.
- Upload file content PostgreSQL'e yazilmaz.
- Attachment ve Media kayitlari private/object storage key metadata'si tutar.

Audit log hassasiyetleri:

- Audit metadata'sinda password, password hash, session token, file content, raw private path, telefon, e-posta veya mesaj icerigi tutulmaz.
- IP address ve user agent gerekirse minimum operasyonel guvenlik amaciyla tutulur.
- Audit log kayitlari uygulama davranisi olarak immutable planlanir.

Production authorization:

- Prisma repository varligi tek basina yetki kontrolu degildir.
- Admin API'lari server-side session ve permission kontrolu olmadan acilmamalidir.
- Client-side RBAC gosterim yardimcisidir; guvenlik siniri degildir.

Admin panelde client-side guard güvenlik sınırı değildir. Protected admin
route'ları için gerçek server-side session doğrulaması zorunludur.

Current foundation:

- Admin public UI'dan route group ile ayrılmıştır.
- Admin layout Navbar, Footer veya cookie consent banner render etmez.
- `requireAdminSession()` gerçek oturum yoksa `/admin/login` yönlendirmesi yapar.
- `requirePermission()` gelecek permission kontrolleri için contract sağlar.
- `ADMIN_DEV_BYPASS` varsayılan kapalıdır.
- `ADMIN_DEV_BYPASS` normal admin gelistirme akisi icin kullanilmaz; production disinda yalniz izole test sozlesmesi olarak kalir.

Future session requirements:

- HttpOnly session cookie
- Secure cookie in production
- SameSite policy
- Server-side session lookup
- Password hashing
- Rate limit for login attempts
- CSRF strategy for state-changing admin actions
- Role and permission checks on every server mutation

Audit logging plan:

- Login / logout
- Create / update / delete
- Publish / archive
- Service request status changes
- User and role changes

Audit kayıtları `src/lib/audit/audit-log.ts` içindeki typed contract üzerinden başlayacak, production aşamasında veritabanına yazılacaktır.
## Admin Service Request Security

- Public uploads remain private and are never exposed through permanent public URLs.
- Admin attachment downloads require a valid admin session, `serviceRequests.attachments.view` permission and request/attachment ownership match.
- Attachment responses use stored server-validated MIME type, `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-store`.
- Customer message and internal notes are rendered as plain text only; HTML is never trusted.
- Audit metadata must not include customer message, phone, email, raw filenames, raw storage paths, session tokens, password hashes or file contents.
- `VIEWER` can inspect requests but cannot mutate, note, assign, archive or download attachments.
- `SERVICE_STAFF` can work the request flow but cannot assign or archive.
- `ADMIN` and `SUPER_ADMIN` can assign and archive.

Filesystem and database changes are not treated as a single atomic operation. When storage succeeds and database persistence fails, the route attempts safe storage cleanup. Future object storage should keep the same cleanup/outbox discipline.

## Admin Media Library Security

- General media uploads are stored under `storage/private/media/` in development and remain separate from `storage/private/service-requests/`.
- Service-request attachments are not listed in the media library and must not be exposed through media delivery routes.
- The media upload flow validates extension, reported MIME type and detected magic bytes server-side.
- JPEG, PNG and WebP files are decoded and re-encoded with Sharp, metadata is stripped where possible, only one page/frame is processed and an input pixel limit is enforced.
- SVG, HTML, JavaScript, executables, archives, Office macro formats and unknown file types are rejected.
- Media files use UUID-based storage keys; original filenames are display-only metadata.
- Duplicate detection uses a SHA-256 content hash of the hardened image output, not the filename.
- Public media delivery resolves by `Media` ID and variant only; local filesystem paths and raw storage keys are never returned to clients.
- Delivery responses use `X-Content-Type-Options: nosniff`, ETag and immutable cache headers for hardened public variants.
- Archived media returns 404 from public delivery routes.
- Raw uploads are not public. Only hardened variants are deliverable.
- Media metadata updates cannot mutate storage keys, MIME type or binary content through generic form input.
- Hard delete is restricted to unused media and authorized roles. Filesystem and database deletion are not considered a single atomic transaction; production object storage should use an outbox/retry strategy for deletion failures.
- Audit metadata for media actions may contain media ID, category, MIME type, size, variant count and duplicate reuse status. It must never contain file bytes, raw private paths, session tokens or secrets.
## Hero Slider Security

- Hero slide mutations require server-side admin session and RBAC permission checks.
- Navigation visibility is only UX; actions enforce permissions again.
- Hero media selection accepts active image media only and rejects archived media or documents.
- Admin forms never accept raw storage keys or filesystem paths.
- Hero link URLs reject `javascript:`, `data:` and protocol-relative URLs.
- Public rendering uses generated media delivery URLs and does not expose storage keys.
- Preview routes are authenticated admin pages; draft or inactive content is not exposed through public routes.
- Audit metadata stores IDs and state changes, not full marketing copy or private storage paths.

## Device Group Security

- Device group reads and mutations require server-side RBAC checks.
- Navigation visibility is only UX; server actions enforce permissions again.
- Slugs are URL-safe and validated server-side.
- Icon keys and capability labels are allowlisted; arbitrary component names, HTML or CSS class names are not accepted.
- Device image and Open Graph image selection accepts active image media only. Archived media and PDFs are rejected.
- Public DTOs do not expose storage keys, filesystem paths, audit metadata or internal user IDs.
- Audit metadata stores IDs, slug, active/featured state and media IDs only; full descriptions and storage paths are intentionally excluded.

## Site Settings Security

Site settings are public website configuration, not a secret store. Do not store API secrets, private tokens, database credentials or webhook secrets in `SiteSetting`. Branding values reference Media IDs and are validated against active image media. URL fields reject unsafe protocols such as `javascript:` and `data:`.

Maintenance mode is enforced in the public layout so it can read typed database settings safely. It is not treated as an authorization boundary; admin authentication and RBAC still protect all admin routes server-side.
# Hizmet Yönetimi Güvenliği

Hizmet CRUD işlemleri server-side RBAC ve Zod validasyonu gerektirir. İkonlar allowlist üzerinden seçilir; arbitrary component/code adı kabul edilmez. CTA bağlantıları yalnızca güvenli internal path veya `http/https` mutlak URL olarak kabul edilir; `javascript:` ve benzeri unsafe şemalar reddedilir.

Medya seçimi raw storage key kabul etmez. Sadece aktif image media kayıtları kullanılabilir; public DTO storage key veya internal user bilgisi döndürmez.
## Homepage Content Security

Ana sayfa yönetimi DB’den arbitrary component, HTML veya script çalıştırmaz. Section key değerleri allowlist ile sınırlıdır ve `content` JSON payload’ları key’e özel Zod şemalarıyla doğrulanır.

CTA bağlantıları server-side doğrulanır; `javascript:` ve `data:` gibi unsafe scheme değerleri reddedilir. Medya referansları yalnızca aktif görsel medya ID’leriyle kabul edilir; raw storage key veya filesystem path admin formundan yazılamaz.

Navigation görünürlüğü sadece UX katmanıdır. Ana sayfa içerik update, reorder, visibility ve SEO mutation’ları server-side `requirePermission()` ile korunur.
## Blog Content Security

Blog article bodies do not accept raw HTML, script, style or arbitrary component names. All content blocks are validated with Zod and rendered through an exhaustive typed renderer. Draft preview requires an authenticated admin session and `blog.view`; public pages return 404 for drafts, archived posts and future scheduled posts. Blog media references resolve by Media ID and never expose storage keys.
# Admin Account Security

## Dashboard Data Minimization

The admin dashboard is an operational summary, not a customer-data export surface.

- Service request widgets avoid full customer messages, phone numbers, e-mail addresses and attachment filenames.
- Recent activity renders typed safe labels instead of raw audit metadata.
- Security widgets show counts and high-level event labels; they do not expose IP addresses, user agents, session identifiers, reset tokens or MFA secrets by default.
- Forbidden widgets are not queried for roles that lack the related permission.
- Dashboard pages are authenticated, dynamic and must not be publicly cached.
- Synthetic visual QA fixtures must not include real customer or account data.

Any future export/reporting feature must go through a separate privacy review before exposing broader operational data.

## User Management Security

- Built-in role permissions remain code-defined; database users store only their assigned fixed role.
- `canManageUser()` enforces privilege boundaries server-side.
- ADMIN cannot create, edit, promote, deactivate, reset or revoke sessions for SUPER_ADMIN accounts.
- Users cannot change their own role or deactivate themselves.
- The last active SUPER_ADMIN cannot be demoted or deactivated.
- Role changes, deactivation and forced password resets revoke target sessions.
- New users and forced resets use one-time password setup/reset tokens; no default or plaintext permanent password is created.
- User list/detail DTOs exclude password hashes, session token hashes, raw MFA secrets and recovery codes.
- Audit metadata records IDs, role changes, active state and counts only; it must not contain passwords, reset tokens, session tokens or raw e-mail bodies.

- Passwords Argon2id ile hashlenir; plaintext password, password hash veya reset token loglanmaz.
- Password reset tokenları en az 256 bit entropy ile üretilir ve veritabanında yalnız hash olarak tutulur.
- Reset sayfası `noindex` ve `no-referrer` metadata kullanır; token analytics veya client storage'a yazılmaz.
- Remember Me session'ları sonludur, database expiry ile cookie expiry eşleşir ve revoke edilebilir.
- MFA secretları production'da `MFA_ENCRYPTION_KEY` ile AES-256-GCM şifrelenmeden saklanmamalıdır.
- Recovery code değerleri yalnız hash olarak saklanır ve yeniden gösterilmez.
- Full TOTP enforcement bu milestone'da aktif değildir; UI bunu production-complete MFA olarak göstermemelidir.
## Audit Log Gizliligi

Audit Log viewer ve Security Center veri minimizasyonu ile calisir:

- Ham metadata admin UI'da render edilmez.
- Parola, passwordHash, token, tokenHash, cookie, session, secret, MFA secret, recovery code, database URL, SMTP bilgisi, storage path, dosya adi, musteri mesaji, telefon ve e-posta anahtarlari audit yaziminda suzulur.
- IP adresleri maskelenir, user-agent metinleri tarayici ozeti olarak gosterilir.
- CSV export yalnizca `audit.export` iznine baglidir ve export islemi audit'e yazilir.
- Audit kayitlari normal admin UI'dan duzenlenemez veya silinemez.

Ertelenen production hardening: merkezi SIEM aktarimi, dis alarm kurallari, cold archive ve ileri anomaly detection.
