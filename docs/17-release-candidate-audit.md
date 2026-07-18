# Release Candidate Audit

Audit date: 2026-07-15

Base commit audited: `427b629 chore: harden production readiness`

TASK-041 fixes and this report are in the current HEAD commit.

Package: `orontes-medikal-platform@0.1.0`

Recommendation: **CONDITIONALLY APPROVED**

No P0 go-live blocker was verified after targeted fixes. Public launch still
requires the P1 items below to be completed or consciously accepted by the
deployment owner.

## Repository State

- Branch: `main`
- Remote state: `main` is 3 commits ahead of `origin/main`
- Worktree before targeted fixes: clean
- Local Node: `v24.18.0`
- Local npm: `11.16.0`
- CI/Docker Node: `22.13.1`
- Package lock: present and used by Docker/CI
- Prisma migrations: 13 migrations
- Local migration status: database schema up to date
- Docker services at audit start: `orontes-medikal-postgres` healthy
- Production stack at audit start: not running

## Quality Gates

| Gate | Result | Notes |
| --- | --- | --- |
| `npm ci` | Failed locally | Windows file lock on native `lightningcss` / `tailwindcss-oxide` binaries. Existing Next processes were stopped; `npm install` restored the local environment. Clean Docker/CI `npm ci` path passed during image builds. |
| `npm install` | Passed | 741 packages audited, 0 vulnerabilities. Cleanup warning remained for a locked Tailwind native temp directory. |
| `npm run db:validate` | Passed | Prisma schema valid. |
| `npm run db:generate` | Passed | Prisma Client generated. |
| `npm run test` | Passed | 37 files, 218 tests. |
| `npm run lint` | Passed | No ESLint failures. |
| `npm run build` | Passed | Next 16.2.10 Turbopack build succeeded. |
| `npm run qa:visual` | Passed | 1 Playwright visual test passed. Known warnings: standalone `next start` warning and `pg@9` client-query deprecation warning. |
| `npm run security:audit` | Passed | 0 moderate+ vulnerabilities. |
| Docker runner build | Passed | BuildKit secret used for `DATABASE_URL`; image `orontes-medikal-platform:task-041-runner`. |
| Docker worker build | Passed | image `orontes-medikal-platform:task-041-worker`. |
| Container health | Passed | Production-like runner container returned live 200 and ready 200. |
| Container smoke | Passed | Smoke suite passed against `http://localhost:3200`. |
| Database backup | Passed after fix | Host lacked `pg_dump`; backup tooling now falls back to local Docker Postgres client. |
| Restore verification | Passed after fix | `pg_restore --list` verified the generated dump through Docker fallback. |

## Route Status

Public routes verified with standalone server:

- `/` 200
- `/hizmetler` 200
- `/cihazlar` 200
- `/elektronik-kart-tamiri` 200
- `/hakkimizda` 200
- `/servis-sureci` 200
- `/blog` 200
- `/iletisim` 200
- `/servis-talebi` 200
- `/gizlilik-politikasi` 200
- `/cerez-politikasi` 200
- `/kvkk` 200
- `/sitemap.xml` 200
- `/robots.txt` 200
- synthetic missing route 404

Admin unauthenticated route behavior:

- `/admin/login` 200
- protected admin routes redirect to `/admin/login` with 307
- private attachment smoke route redirects or denies unauthenticated access

Not fully verified in this audit:

- authenticated admin click-through for every module
- all breadcrumbs and quick actions under every role
- full service-request operational workflow with assignment/status/history cleanup

## Security Status

- Auth foundation: Argon2id password hashing, opaque database sessions, secure
  admin cookie policy, logout/session revocation and reset-token foundations are
  implemented.
- MFA status: **foundation only**, not end-to-end enforced protection.
- RBAC status: server-side permission model and tests exist; full role-by-role
  browser audit remains a P1 manual verification.
- Rate limiting: single-instance in-memory. Multi-instance deployment requires a
  shared backend such as Redis.
- Admin dev bypass: production validation rejects `ADMIN_DEV_BYPASS=true`.
- Secrets: no real secret was found in source scan; `.env.local` is ignored.

## Infrastructure Status

- Dockerfile: production multi-stage build, non-root runner, standalone output.
- Compose reference: reverse proxy, web, mail worker and Postgres topology.
- Reverse proxy: Nginx reference includes HTTPS redirect, body limit and headers.
- PostgreSQL: internal in production compose; local dev maps to localhost only.
- Healthchecks: liveness and readiness implemented.
- Storage: local private volume works; object-storage runtime adapter is not wired.
- Workers: mail worker image builds; scheduling must be configured by deployment.
- Monitoring: health endpoints and log rotation reference exist; external alerting
  and metrics provider are not wired.

## Environment Matrix

| Variable | Dev required | Prod required | Secret | Owner | Validation | Example |
| --- | --- | --- | --- | --- | --- | --- |
| `APP_ENV` | No | Yes | No | runtime | production mode switch | `production` |
| `APP_ORIGIN` | Recommended | Yes | No | routing/SEO/auth | rejects invalid production origin | `https://example.com` |
| `TRUST_PROXY` | No | Yes | No | security/proxy | must be `true` in production | `true` |
| `DATABASE_URL` | Yes for DB features | Yes | Yes | database | required in production | `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public` |
| `PRIVATE_STORAGE_ROOT` | No | Yes | No | storage | required in production | `/app/storage/private` |
| `STORAGE_PROVIDER` | No | Yes | No | storage | `local` or `s3-compatible` | `local` |
| `S3_ENDPOINT` | No | If S3 selected | No | storage | required for S3 config | `https://s3.example.com` |
| `S3_REGION` | No | If S3 selected | No | storage | required for S3 config | `eu-central-1` |
| `S3_BUCKET` | No | If S3 selected | No | storage | required for S3 config | `orontes-private` |
| `S3_ACCESS_KEY_ID` | No | If S3 selected | Yes | storage | required for S3 config | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | No | If S3 selected | Yes | storage | required for S3 config | `secret` |
| `MAIL_PROVIDER` | No | Yes if mail promised | No | mail | `development` rejected in production | `smtp` |
| `MAIL_FROM_ADDRESS` | No | SMTP yes | No | mail | required for SMTP | `noreply@example.com` |
| `SMTP_HOST` | No | SMTP yes | No | mail | required for SMTP | `smtp.example.com` |
| `SMTP_PORT` | No | SMTP yes | No | mail | required for SMTP | `587` |
| `SMTP_USER` | No | Provider-specific | Yes | mail | not strictly required | `smtp-user` |
| `SMTP_PASSWORD` | No | Provider-specific | Yes | mail | not strictly required | `secret` |
| `MAIL_WORKER_BATCH_SIZE` | No | No | No | worker | 1-100 when mail enabled | `25` |
| `MFA_ENCRYPTION_KEY` | No | If MFA enforced | Yes | auth | required only when MFA flags enabled | base64 32-byte key |
| `ADMIN_DEV_BYPASS` | No | Must be false/unset | No | auth | rejected when true in production | `false` |
| `BACKUP_DIR` | No | Recommended | No | backup | readiness warning if absent | `/backups` |
| `BACKUP_DOCKER_CONTAINER` | No | No | No | backup tooling | fallback container name | `orontes-medikal-postgres` |
| `SMOKE_BASE_URL` | No | CI/deploy yes | No | smoke | script input | `https://example.com` |
| `SMOKE_TIMEOUT_MS` | No | No | No | smoke | numeric timeout | `10000` |
| `GIT_COMMIT_SHA` | No | Recommended | No | release metadata | recorded in backup metadata | `abcdef1` |

## Backup And Restore

- Backup command passed and produced a `.dump` plus `.json` metadata.
- Metadata includes timestamp, format, file, size, sha256 and optional commit.
- Restore verification passed with `pg_restore --list`.
- The verification is non-destructive and does not overwrite the active DB.
- Off-host backup copy is not implemented in this repo and remains P1 for real
  production operations.
- Database backups do not include private storage files; attachment/media backup
  policy remains a deployment responsibility.

## Storage Status

Classification: **still local-only for runtime production**.

- Local private storage works with persistent volume.
- Service-request attachments and media storage are separate.
- Dry-run storage inventory passed.
- S3-compatible environment validation exists.
- S3-compatible runtime adapter is intentionally not enabled and is a P1/P2
  decision depending on whether deployment is single-instance local volume or
  multi-instance/object-storage.

## Mail And Worker Status

Classification: **worker ready but not scheduled**.

- SMTP configuration validation exists.
- Development capture mode is isolated and rejected in production.
- Mail worker image builds.
- Worker scheduling is not active in this local audit.
- SPF/DKIM/DMARC and real SMTP deliverability must be verified with the chosen
  provider before public launch.

## Monitoring Status

Classification: **integration-ready, not operational**.

- `/api/health/live` works without DB.
- `/api/health/ready` verifies DB, writable storage, Site Settings and env.
- External alerting, metrics, uptime monitor, queue backlog alerting and backup
  failure alerting are not wired.

## SEO Status

- Sitemap and robots returned 200.
- Admin/API/private routes are excluded by smoke/route policy.
- Production origin validation rejects localhost when production mode is enabled.
- Organization/LocalBusiness/Article JSON-LD now depends on Site Settings input.
- Content still requiring real owner input: logo, favicon, default OG media, legal
  text approval, company legal details, social links, real blog content accuracy.

## Legal And Manual Requirements

Must be reviewed by the business/legal owner before launch:

- Privacy Policy
- Cookie Policy
- KVKK text
- company legal name and address
- phone/e-mail/WhatsApp/social links
- data retention and deletion policy
- cookie categories and consent wording
- analytics/search verification settings
- medical/technical claims
- published blog content accuracy

No legal compliance claim is made by this audit.

## P0 Findings

None remaining after targeted fixes.

Fixed during TASK-041:

- Backup and restore verification initially failed because `pg_dump` /
  `pg_restore` were not installed on the Windows host. The scripts now fall back
  to the local Docker Postgres container without logging secrets.

## P1 Findings

- `npm ci` failed locally due Windows native binary file locks; clean Docker/CI
  install path passes, but local release operators should stop dev servers before
  dependency reset.
- Site Settings readiness warns that production logo, favicon and default OG media
  IDs are missing.
- Full authenticated service-request workflow was not manually completed in this
  audit: assignment, status update, internal note, history and audit cleanup need
  final browser verification.
- Full role-by-role RBAC browser audit remains manual.
- Mail worker is build-ready but not scheduled.
- Real SMTP provider, SPF, DKIM and DMARC are unverified.
- External monitoring/alerting is not operational.
- Off-host database backup copy is not implemented.
- Private storage backup policy is not implemented.
- Object storage adapter is not wired; local volume is acceptable only for a
  single-instance deployment with explicit persistent disk backup.
- README still contains Create Next App / Vercel starter text.
- Production Node version policy should be explicit: local dev uses Node 24 while
  CI/Docker use Node 22.13.1.

## P2 Improvements

- Redis/shared rate limiter for multi-instance production.
- Blog scheduled publishing worker.
- MFA end-to-end enforcement UI and challenge flow.
- Revision compare/restore UI.
- Custom roles.
- WebAuthn/security keys.
- External SIEM/log platform.
- Malware scanning and document/PDF hardening before reintroducing non-image uploads.
- Advanced analytics and reporting.

## Recommended Deployment Sequence

1. Set real production environment variables in the target secret manager.
2. Configure production DNS/TLS/reverse proxy.
3. Confirm Site Settings company/contact/social/legal/branding values.
4. Upload and assign production logo, favicon and default OG media.
5. Configure SMTP and mail worker schedule if e-mail behavior is promised.
6. Take database backup and verify restore listing.
7. Run `npm run db:deploy`.
8. Build/pull the release image by commit SHA.
9. Start web and worker containers.
10. Check `/api/health/live` and `/api/health/ready`.
11. Run `npm run smoke` against production origin.
12. Keep previous image and verified backup available for rollback.

## Rollback Status

- Image rollback strategy is documented but not executed locally.
- Database restore tooling is verified for listing, not for destructive restore.
- Real production rollback must identify the previous image tag, database backup
  artifact and communication owner before deployment.

## TASK-041B Follow-up

Repo-level P1 closure work added after this audit:

- README starter text replaced with a project-specific operations guide.
- Node policy pinned with `.nvmrc`, `.node-version` and `package.json` engines.
- `npm run env:check` added for local/CI/runtime policy checks.
- `npm run production:check` added for safe production readiness diagnostics.
- `npm run mail:verify` and guarded `npm run mail:test` added.
- `npm run blog:publish-due` added for scheduled blog publishing.
- Production Compose now includes an explicit `blog-publisher` worker example.
- Site Settings production readiness now treats logo, favicon, apple-touch icon
  and default OG image Media records as production blockers.
- Targeted E2E scripts added for service-request workflow and admin RBAC route
  boundaries.
- Provider/business checklist added at `docs/18-production-values-checklist.md`.

Remaining P1 items are provider or business dependent:

- real production brand media must be uploaded and selected in Site Settings
- SMTP provider, SPF, DKIM, DMARC and MAIL FROM alignment must be verified
- monitoring/alerting provider must be configured
- off-host database backup destination must be configured and tested
- local private storage backup must be configured for the single-instance profile
- business/legal owner must approve live legal and company content

TASK-041B verification run:

- `npm run env:check` passed with local Node 24 warning; CI/production standard
  remains Node 22.13.1.
- `npm test` passed: 37 files, 219 tests.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test:e2e:service-requests` passed.
- `npm run test:e2e:rbac` passed.
- `npm run qa:visual` passed.
- `npm run mail:verify` passed in development mode as `manual-not-required`.
- `npm run production:check` correctly failed locally with provider/business
  blockers rather than claiming production readiness.

Runtime observations:

- The local Playwright/visual QA server still prints the Next standalone warning
  because it uses the programmatic production server helper for local QA.
- A `pg` deprecation warning appears during browser QA; it did not fail the
  checks, but should be watched during future Prisma/adapter upgrades.
