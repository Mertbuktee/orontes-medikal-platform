# Changelog

## Unreleased

- TASK-040 production hardening: added shared private storage configuration, readiness validation, Docker build-secret flow, worker dependency hardening and a non-destructive storage migration inventory command.
- TASK-039E Site Settings source-of-truth audit: removed business identity/contact fallbacks from canonical route config, stopped metadata helpers from injecting a hardcoded company site name, made Organization/LocalBusiness/Article JSON-LD require Site Settings identity input, and added production Site Settings readiness validation.
- Cleaned stale visual QA Turkish text expectations and tightened Site Settings source-of-truth behavior for footer social links, Article JSON-LD publisher identity and notification email branding.
- Added production-hardening foundations: standalone Docker build, production Compose/Nginx references, runtime environment validation, health/readiness endpoints, backup/restore-check scripts, smoke tests, CI workflow and go-live checklist.
- Added production admin operations dashboard with real PostgreSQL summaries for service requests, content health, media health, site readiness, security activity, recent activity feed, role-aware widgets and lightweight accessible charts.
- Added production user, fixed-role and permission management with user lifecycle screens, setup-link onboarding, role matrix, session revocation, forced password reset, privilege-escalation policy and last SUPER_ADMIN protection.
- Added admin account-security foundation with Remember Me session policy, password change, active-session management, password-reset tokens, development email sink, MFA encryption/recovery-code foundation and account-security visual QA.
- Added a current production runbook that tracks go-live environment, migration, storage, admin bootstrap, rate-limit, SEO, legal and post-launch operations in one place.
- Added production Site Settings for company identity, contact information, branding, global SEO, social links, footer content, legal visibility, default CTA and maintenance mode.
- Added database-backed Homepage Content Management with section visibility/order, typed section JSON validation, public homepage registry rendering, homepage SEO settings, seed data, RBAC permissions and admin overview/section/SEO routes.
- Added unsaved live preview modals for Homepage section editors so admins can inspect section changes before publishing them.
- Added Blog CMS foundation with structured content blocks, admin post/category routes, authenticated draft preview, DB-backed `/blog`, real `/blog/[slug]` pages, Article JSON-LD, sitemap integration and draft-only seed migration.
- Finalized Blog CMS public category architecture with `/blog/kategori/[slug]`, active/published-only sitemap policy, scheduled-publishing disclosure and targeted Blog visual QA coverage.
- Added database-backed Device Group management with admin list/detail/create/edit routes, media selection, icon and capability allowlists, active/featured controls, ordering, public homepage preview integration and `/cihazlar` DB-backed rendering.
- Added database-backed Hero Slider management with media selection, admin create/edit/detail/list routes, ordering controls, slider settings, public DB-backed rendering, audit events and dashboard summaries.
- Added the production media library foundation with Prisma media variants, secure admin upload, duplicate detection, private media storage, public hardened variant delivery, media listing/detail screens and visual QA coverage.
- Added service-request final hardening with internal transition reasons, audit summary, notification event contract and expanded admin visual QA.
- Hardened service request management with granular RBAC, status transition enforcement, assignment, archive, private attachment access, dashboard summaries and local JSON import command.
- Added the first real admin module for service requests with Prisma-backed public submissions, admin listing, detail view, status workflow, internal notes and audit-backed mutations.
- Added secure admin authentication with Argon2id password hashing, opaque database-backed sessions, login/logout flow, login rate limiting, explicit super-admin bootstrap and authentication audit events.
- Added Prisma 7 and PostgreSQL foundation with Docker Compose development database, initial schema, migration, seed workflow, repository contracts, Prisma client singleton and local JSON import readiness.
- Established admin panel foundation with public/admin route separation, login UI, protected admin shell, dashboard skeleton, typed admin navigation, RBAC contracts, auth boundary and audit contracts.
- Added a production deployment checklist covering environment variables, SEO, sitemap/robots, structured data, secure uploads, storage, rate limiting, legal consent, monitoring and post-launch operations.

# Hizmetler Yönetimi

- Hizmetler modülü PostgreSQL destekli admin yönetimine hazırlandı.
- Hizmetler için aktif/pasif, ana sayfada öne çıkarma, sıralama, arşivleme, SEO alanları, medya ilişkisi ve audit log akışı eklendi.
- Ana sayfa Hizmetler önizlemesi ve `/hizmetler` sayfası artık public DB sorgularından beslenir.
- Yerel typed hizmet içeriği seed/import kaynağı olarak korunur; production public içerik için ana kaynak veritabanıdır.

## TASK-038 - Audit Log Viewer ve Security Center

- `/admin/audit`, `/admin/audit/[id]` ve guvenli CSV export eklendi.
- `/admin/security` kimlik dogrulama, hesap, oturum, konfigurasyon ve son guvenlik olaylari ozetlerini gercek veriden gosterir.
- Audit metadata redaction merkezi hale getirildi.
- Audit sorgulari icin ek index migration'i olusturuldu.
- Visual QA ve unit test kapsami genisletildi.

## TASK-039 - Notification, SMTP ve Operations Alerting

- SMTP provider abstraction, development mail capture adapter ve typed email template registry eklendi.
- NotificationPreference, Notification, EmailDelivery ve EmailDeliveryAttempt modelleriyle DB-backed notification/outbox altyapisi kuruldu.
- `/admin/notifications`, `/admin/account/notifications`, `/admin/settings/email` ve `/admin/notifications/email-deliveries` ekranlari eklendi.
- `npm run mail:process` bounded batch worker komutu eklendi.
- Public servis talebi ve servis atama akislari internal bildirim/email outbox uretecek sekilde baglandi.
