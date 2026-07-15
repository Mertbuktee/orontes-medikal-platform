# Production Values and Provider Checklist

This checklist is the launch-time source for values that cannot be invented in
the repository. Do not mark an item complete until the real provider/business
owner has confirmed it.

## Business and Site Settings

- `site.general.companyName`
- `site.general.legalCompanyName`
- `site.contact.phonePrimary`
- `site.contact.emailPrimary`
- `site.contact.emailSupport`
- `site.whatsapp.whatsappNumber`
- `site.address.addressLine`
- `site.social.instagram`
- `site.social.linkedin`
- `site.branding.logoMediaId`
- `site.branding.faviconMediaId`
- `site.branding.appleTouchIconMediaId`
- `site.branding.defaultOgImageMediaId`

Production brand media must be active image Media records with generated
variants. The readiness endpoint treats missing brand media as a production
blocker.

## Environment

- `APP_ENV=production`
- `APP_ORIGIN=https://...`
- `TRUST_PROXY=true`
- `DATABASE_URL`
- `MFA_ENCRYPTION_KEY`
- `PRODUCTION_PROFILE=single-instance` when `STORAGE_PROVIDER=local`
- `PRIVATE_STORAGE_ROOT=/app/storage/private`
- `PRIVATE_STORAGE_BACKUP_ENABLED=true`
- `BACKUP_REMOTE_URL` or `BACKUP_S3_BUCKET`
- `MAIL_WORKER_ENABLED=true`
- `BLOG_SCHEDULER_ENABLED=true`
- `MONITORING_PROVIDER` or `ERROR_MONITORING_DSN`
- `LEGAL_APPROVAL_CONFIRMED=true`

Run:

```bash
npm run production:check
```

This command emits safe diagnostics only and exits non-zero while blockers remain.

## Mail Provider

- `MAIL_PROVIDER=smtp`
- `MAIL_FROM_NAME`
- `MAIL_FROM_ADDRESS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`

Validate the provider connection:

```bash
npm run mail:verify
```

Send one explicit live test only after setting a real recipient:

```bash
MAIL_TEST_RECIPIENT="operator@example.com" MAIL_TEST_CONFIRM=SEND_TEST_EMAIL npm run mail:test
```

DNS checks are manual/provider-side:

- SPF includes the SMTP provider.
- DKIM selector is published and verified.
- DMARC policy exists.
- MAIL FROM / return-path alignment is accepted by the provider.

## Workers

Production Compose includes two background services:

- `mail-worker`: runs `npm run mail:process`.
- `blog-publisher`: runs `npm run blog:publish-due` every
  `BLOG_PUBLISH_INTERVAL_SECONDS` seconds.

Both services require the same release image family and the production database.
Set the readiness flags only after the services are deployed and observed:

- `MAIL_WORKER_ENABLED=true`
- `BLOG_SCHEDULER_ENABLED=true`

## Backups

Before go-live:

```bash
npm run backup:database
npm run backup:verify -- backups/database/<backup-file>.dump
```

The local dump is not enough. Copy database backups off-host and document the
remote destination. For local private file storage, configure persistent volume
snapshots or a separate off-host copy process and set:

- `PRIVATE_STORAGE_BACKUP_ENABLED=true`
- `BACKUP_REMOTE_URL` or `BACKUP_S3_BUCKET`

## Storage Decision

Current release decision: local private storage is acceptable only for a
single-instance deployment with persistent volume backup.

Required constraints:

- `STORAGE_PROVIDER=local`
- `PRODUCTION_PROFILE=single-instance`
- no horizontal web scaling while local private storage is used
- persistent volume survives container replacement
- off-host backup is scheduled and restorable

The S3-compatible adapter is intentionally not enabled in this release. If
multi-instance deployment is required, add and test the adapter before launch.

## Manual Approval

Business/legal owner must approve:

- company legal identity and address
- phone, e-mail, WhatsApp and social links
- Privacy Policy, Cookie Policy and KVKK content
- cookie categories and consent text
- technical/medical claims
- published blog content
- retention/deletion policy

No repository command can replace this approval.
