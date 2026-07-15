# TASK-040 Production Hardening Notes

This document records the production-readiness decisions for Docker, storage,
backup, monitoring and CI. It is a readiness aid, not proof that production
deployment has happened.

## First Step Report

Production gaps found:

- Docker image builds need `DATABASE_URL` during `next build` because selected
  public pages collect database-backed data at build time.
- The readiness endpoint and storage adapters were not using one shared private
  storage root setting.
- Worker image used the full dependency install even though it only needs runtime
  dependencies plus the existing `tsx` runner.
- Object storage environment variables existed, but the app had no runtime
  readiness gate that clearly rejected an unwired object-storage adapter.
- Storage migration had no non-destructive inventory command.
- CI built the image without passing the build-time database URL as a secret.
- Production rate limiting is still in-memory and must not be treated as
  horizontally safe.

Files created or modified:

- `Dockerfile`
- `docker-compose.production.yml`
- `.github/workflows/ci.yml`
- `package.json`
- `package-lock.json`
- `src/lib/storage/storage-config.ts`
- `src/lib/storage/storage-config.test.ts`
- `src/lib/env/production.ts`
- `src/lib/env/production.test.ts`
- `src/lib/security/storage.ts`
- `src/lib/media/media-storage.ts`
- `src/app/api/health/ready/route.ts`
- `scripts/storage-migrate-dry-run.mjs`
- `docs/17-production-hardening-task-040.md`

Proposed container topology:

- `reverse-proxy`: Nginx TLS terminator and request-size/header boundary.
- `web`: Next standalone server, no public database port, private storage volume.
- `mail-worker`: separate bounded worker for queued transactional email.
- `postgres`: PostgreSQL with an internal network and persistent data volume.

Persistent volumes:

- `orontes_postgres_data`: PostgreSQL data directory.
- `orontes_private_storage`: service-request attachments, media variants and
  development mail capture.
- `orontes_database_backups`: local backup landing area before off-host copy.

Backup strategy:

- Run `npm run backup:database` before migrations and on a schedule.
- Run `npm run backup:verify -- <backup.dump>` against each backup artifact.
- Copy verified dumps off-host with provider-specific tooling outside this repo.
- Database backups do not include private file storage; object/local storage needs
  a separate retention and restore plan.

Monitoring strategy:

- `/api/health/live` is a fast process check.
- `/api/health/ready` verifies database, writable local storage, Site Settings and
  production env readiness.
- Alert externally on readiness failures, backup job failures, mail queue
  failures, storage quota/write errors, rate-limit spikes and login anomalies.
- Logs are JSON-file bounded in compose; production should ship them to a real log
  platform.

CI/CD strategy:

- CI runs install, Prisma generate/validate, tests, lint, build and Docker image
  build.
- Docker image build receives `DATABASE_URL` through a BuildKit secret, not a build
  arg, so it is not baked into image metadata.
- Production deployment must run database backup, `npm run db:deploy`, image
  rollout, readiness check and smoke test in that order.

Deliberately deferred provider-specific work:

- S3-compatible runtime storage adapter and CDN policy.
- Redis/shared rate limiter.
- Real alert provider wiring such as Sentry, Grafana, Prometheus or uptime SaaS.
- Off-host backup copy implementation.
- Blog scheduled-publishing worker.
- Malware scanning for production uploads.

## Verification Notes

Local verification completed:

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run db:validate`
- `npm run security:audit`
- `npm run storage:migrate:dry-run`
- `npm run qa:visual`
- `npm run smoke`

Docker build note:

- Docker daemon responded and local Postgres container was healthy.
- `docker build` commands repeatedly exceeded the local 10 minute command limit
  after Docker Desktop became unresponsive during build verification.
- Before deployment, rerun:

```bash
docker build --secret id=database_url,env=DATABASE_URL --target runner -t orontes-medikal-platform:release .
docker build --target worker -t orontes-medikal-platform:worker .
```

For CI on Linux, use `--network=host` with the PostgreSQL service and pass
`DATABASE_URL` as a BuildKit secret, as configured in `.github/workflows/ci.yml`.
