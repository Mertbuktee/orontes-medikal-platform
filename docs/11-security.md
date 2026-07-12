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
