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
