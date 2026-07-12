# Testing Strategy

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
