# Security Notes

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

Admin panelde client-side guard güvenlik sınırı değildir. Protected admin
route'ları için gerçek server-side session doğrulaması zorunludur.

Current foundation:

- Admin public UI'dan route group ile ayrılmıştır.
- Admin layout Navbar, Footer veya cookie consent banner render etmez.
- `requireAdminSession()` gerçek oturum yoksa `/admin/login` yönlendirmesi yapar.
- `requirePermission()` gelecek permission kontrolleri için contract sağlar.
- `ADMIN_DEV_BYPASS` varsayılan kapalıdır.
- `ADMIN_DEV_BYPASS=true` sadece production dışı ortamda geliştirme/test amacıyla çalışır.

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
