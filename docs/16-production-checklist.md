# Production Checklist

This checklist is the final go-live gate. Do not mark an item complete unless it is verified in the target production environment.

## Domain And TLS

- DNS points to the reverse proxy.
- HTTPS certificate is installed and renewed automatically.
- `APP_ORIGIN` is the final HTTPS production origin.
- HTTP redirects to HTTPS.

## Environment

- `APP_ENV=production`.
- `TRUST_PROXY=true`.
- `DATABASE_URL` is server-only.
- `ADMIN_DEV_BYPASS=false` or unset.
- No `.env` file is committed or baked into the image.

## Database

- `npm run db:deploy` completed.
- A backup was taken before migration.
- Restore verification was performed against a non-production target.
- Seed did not create fake production users, customers or requests.

## Storage

- `storage/private` is a persistent volume or S3-compatible storage is configured.
- Service-request attachments remain private.
- Public service-request uploads accept only JPEG, PNG and WebP images; PDF/document uploads are rejected.
- Media originals remain private.
- Public media delivery uses controlled hardened variants only.

## Mail And Workers

- SMTP/provider credentials are configured in secrets.
- `MAIL_PROVIDER=development` is not used in production.
- Mail worker is scheduled or run as a separate bounded process.
- Scheduled publishing worker strategy is active or explicitly deferred.

## Backups

- `npm run backup:database` succeeds.
- `npm run backup:verify -- <backup.dump>` succeeds.
- Off-host backup destination is configured.
- Backup retention is documented.

## Monitoring

- `/api/health/live` responds quickly without DB.
- `/api/health/ready` fails when DB/storage is unavailable.
- Readiness, backup failure, mail queue failure and storage failures have alerts.
- Logs are collected outside the container.

## Security

- Secure headers are present.
- Admin cookies are Secure over HTTPS.
- Public DB/storage ports are not exposed.
- Prisma Studio is not exposed.
- Audit redaction remains active.
- Rate limiting strategy matches deployment topology.

## SEO And Legal

- `/sitemap.xml` uses production URLs.
- `/robots.txt` points to production sitemap.
- Search Console verification is configured.
- Legal pages are reviewed by a qualified person.
- Logo, favicon and default OG image are real production assets.

## Admin

- At least one active SUPER_ADMIN exists.
- Emergency admin recovery procedure is documented.
- Site Settings contact, social, footer and SEO values are verified.
- Maintenance mode can be enabled and disabled by an admin.
- Admin notification bell opens the unread preview menu and the full notifications page remains accessible.

## Technical Panel

- `/technical/login` works separately from `/admin/login`.
- `SERVICE_STAFF` can access `/technical` but cannot access `/admin`.
- `SUPER_ADMIN` can access both panels.
- `EDITOR` is denied from technical operations.
- Technical notification bell opens the unread preview menu and `/technical/notifications` remains accessible.
- Completing a service request requires diagnosis, work performed and final result.
- Completed linked requests update device service history.
- Same-brand/model/serial previous completed history appears on technical detail pages.

## Smoke Tests

- `npm run smoke` passes against production.
- Admin login page loads.
- Technical login page loads.
- Protected admin route redirects unauthenticated users.
- Protected technical route redirects unauthenticated users.
- Private attachment URL rejects unauthenticated access.

## Rollback

- Previous image tag is retained.
- Database rollback limitation is understood.
- Restore procedure and communication owner are documented.
