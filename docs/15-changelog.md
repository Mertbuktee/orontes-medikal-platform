# Changelog

## Unreleased

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
