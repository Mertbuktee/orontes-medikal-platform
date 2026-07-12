# Testing Strategy

## Admin Authentication Tests

Authentication tests cover server-side security contracts without requiring real browser credentials:

- Argon2id password hashing and verification.
- Password policy minimum and maximum length.
- High-entropy opaque session token generation.
- Raw session token is not stored in database DTOs.
- Expired, revoked and inactive-user sessions fail validation.
- Login rate limit activates and resets after a successful login.
- Bootstrap refuses missing variables and weak passwords.
- Bootstrap does not create duplicate super admins.
- RBAC checks keep `SUPER_ADMIN` fully privileged and prevent `VIEWER` management access.
- Audit metadata helpers reject password/token/hash shaped data.

Database-backed login route testing should use a dedicated test database or transaction strategy. Destructive resets must never run against production data.

## Database Tests

Database foundation testleri varsayilan olarak live production database gerektirmez. Unit testler schema sozlesmesi, seed donusumu, repository DTO guvenligi ve local JSON import dry-run davranisini dogrular.

Kapsanan alanlar:

- Prisma enumlari ile RBAC type'lari hizali mi?
- Service request status akisi schema'da eksiksiz mi?
- Device/service slug'lari unique mi?
- Seed transformlari order, active ve featured alanlarini koruyor mu?
- Repository DTO'lari `passwordHash` dondurmuyor mu?
- Local JSON importer dry-run ve duplicate raporu uretiyor mu?
- `DATABASE_URL` eksikse DB operasyonlari erken hata veriyor mu?
- Public sayfalar henuz dogrudan database import etmiyor mu?

## Integration Tests

Local integration dogrulamasi Docker PostgreSQL ile yapilir:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed
```

Ikinci seed calistirmasi idempotency kontrolu olarak kullanilir.

## Production Database Testing

Production veritabani testleri canli data uzerinde destructive calismaz.

- Migration staging/preview ortamda denenmeli.
- Backup restore testi production oncesi ayri ortamda yapilmali.
- Admin CRUD geldikten sonra repository integration testleri fixture database ile calismalidir.

## Standard Verification

Her buyuk degisiklikte:

```bash
npm run test
npm run lint
npm run build
npm run db:validate
npm run db:generate
```
## Service Request Module Tests

Unit coverage includes RBAC role behavior, service request status transition policy, upload validation and public route response behavior. Database-backed module tests should use an isolated test database or transaction strategy before destructive scenarios are added.

Manual local verification for the module:

1. Submit a public service request without attachment.
2. Submit a public service request with a valid image or PDF.
3. Confirm both records appear in PostgreSQL.
4. Confirm `/admin/service-requests` lists them after login.
5. Open detail, update status, add an internal note and assign a user when available.
6. Confirm authorized attachment download works and unauthenticated access fails.
7. Archive the request and confirm it disappears from the default active listing.
8. Confirm status history and audit rows are created without PII-heavy metadata.

Visual QA now also captures synthetic admin service-request list and detail states. These screenshots must not include real customer data or private customer attachments.
