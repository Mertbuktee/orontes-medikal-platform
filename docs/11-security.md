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
