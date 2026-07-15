# Orontes Medikal Platform

Orontes Medikal Platform is a Next.js 16 application for a public medical
technical-service website and a database-backed admin panel. It manages service
requests, media, homepage content, blog content, site settings, notifications,
audit logs and release-readiness checks.

This repository does not contain production secrets, default credentials or a
completed public deployment.

## Stack

- Next.js 16.2.10 with App Router and standalone output
- React 19
- TypeScript
- Prisma 7 with PostgreSQL
- Tailwind CSS
- Playwright for visual and release E2E checks
- Vitest for unit/integration tests
- Docker and Docker Compose references for production-style runtime

## Public Modules

- Home page
- Services
- Device groups
- Board repair
- About
- Service process
- Blog list/detail/category pages
- Contact
- Service request form
- Legal pages
- Sitemap and robots

## Admin Modules

- Authentication and account security
- Dashboard
- Service request management
- Media library
- Hero slider management
- Device and service management
- Homepage management
- Blog CMS
- Site Settings
- Users and fixed roles
- Audit Log and Security Center
- Notifications and e-mail delivery queue

## Prerequisites

- Node.js `22.13.1`
- npm compatible with Node 22
- Docker Desktop or a Docker Engine installation
- PostgreSQL 17 for local development, usually through Docker Compose

Local Node 24 may run many commands, but the project policy is Node `22.13.1`.
CI and production images use Node `22.13.1`.

## Install

```bash
npm ci
```

On Windows, stop running Next.js/dev processes before `npm ci`; native packages
such as Tailwind or Lightning CSS can otherwise be locked by the OS.

## Environment

Copy `.env.example` to `.env.local` and fill local-only values.

Required for local database-backed work:

```bash
APP_ORIGIN=http://localhost:3000
TRUST_PROXY=false
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/orontes_medikal?schema=public"
MAIL_PROVIDER=development
```

Never commit real secrets.

## PostgreSQL

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

For production, use `npm run db:deploy` instead of `db:migrate`.

## First Admin

There are no default admin credentials.

```bash
ADMIN_BOOTSTRAP_EMAIL="admin@example.com" ^
ADMIN_BOOTSTRAP_NAME="Admin" ^
ADMIN_BOOTSTRAP_PASSWORD="use-a-real-secret" ^
npm run admin:bootstrap
```

Remove bootstrap environment values after use.

## Development

```bash
npm run env:check
npm run dev
```

Open `http://localhost:3000`.

## Quality Gates

```bash
npm run db:validate
npm run db:generate
npm run test
npm run lint
npm run build
npm run qa:visual
npm run security:audit
```

Release E2E checks:

```bash
npm run test:e2e:service-requests
npm run test:e2e:rbac
```

## Mail

Development mail is captured under private storage. Production capture mode is
not allowed.

```bash
npm run mail:verify
MAIL_TEST_RECIPIENT="operator@example.com" MAIL_TEST_CONFIRM=SEND_TEST_EMAIL npm run mail:test
npm run mail:process
```

Real SMTP delivery requires provider credentials and DNS work: SPF, DKIM, DMARC
and MAIL FROM alignment.

## Backups

```bash
npm run backup:database
npm run backup:verify -- backups/database/example.dump
npm run storage:migrate:dry-run
```

The local backup command creates a PostgreSQL dump and checksum metadata. It does
not prove off-host backup is active. Production must configure a remote backup
destination and test restore procedures.

## Production Docker

The build needs database access during `next build`; pass `DATABASE_URL` as a
BuildKit secret.

```bash
docker build --secret id=database_url,env=DATABASE_URL --target runner -t orontes-medikal-platform:release .
docker build --target worker -t orontes-medikal-platform:worker .
```

Run smoke tests against a started environment:

```bash
SMOKE_BASE_URL=https://example.com npm run smoke
```

## Readiness

```bash
npm run production:check
```

This command prints safe diagnostics only. It exits non-zero when launch blockers
remain.

## Security Cautions

- Do not expose `.env` files.
- Do not expose private storage.
- Do not run `Prisma Studio` publicly.
- Use HTTPS and `TRUST_PROXY=true` only behind a trusted reverse proxy.
- In-memory rate limiting is single-instance only.
- MFA is foundation-only until an end-to-end enforcement flow is enabled.

## Documentation Index

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

## Deployment Warning

This repository can prepare a release candidate, but it does not configure real
production DNS, TLS, SMTP, object storage, monitoring, legal approval or off-host
backup by itself. Do not treat a local green build as a completed production
deployment.
