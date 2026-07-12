# Architecture

## Genel Mimari

Uygulama Next.js App Router mimarisi üzerine kurulmuştur.

Katmanlar

Browser

↓

Next.js

↓

API Routes

↓

Validation

↓

Security

↓

Repository

↓

Storage

↓

Database

---

# Frontend

src/app

Sayfalar

src/components

Tekrar kullanılabilir bileşenler

src/sections

Ana sayfa bölümleri

src/lib

İş mantığı

src/hooks

Custom hook'lar

src/types

TypeScript tipleri

---

# Backend

API Route

↓

Origin Validation

↓

Rate Limit

↓

Zod Validation

↓

File Validation

↓

Repository

↓

Storage

↓

Database

---

# Repository Pattern

Route içerisinde doğrudan database kullanılmaz.

Repository katmanı kullanılır.

Development

Local JSON Repository

Production

Prisma Repository

---

# Storage

Development

storage/private

Production

S3 Compatible Storage

---

# Validation

Server Side

- Zod

Client Side

- React Validation

---

# Security

- Origin Check
- Rate Limit
- MIME Validation
- Magic Byte Validation
- Image Re-encode
- Private Storage
- Audit Log

---

# Admin Panel

/ admin

dashboard

↓

service requests

↓

devices

↓

services

↓

blog

↓

media

↓

settings

↓

users

---

# Production Yapısı

Internet

↓

Cloudflare

↓

Nginx

↓

Next.js

↓

Redis

↓

PostgreSQL

↓

S3 Storage
# Public Site Architecture

Public site artık tek uzun anasayfa yerine çok sayfalı kurumsal mimariyle ilerler.

## Route Yapısı

- `/`
- `/hizmetler`
- `/cihazlar`
- `/elektronik-kart-tamiri`
- `/hakkimizda`
- `/servis-sureci`
- `/blog`
- `/iletisim`
- `/servis-talebi`

API route'ları mevcut yerlerinde korunur ve public sitemap'e eklenmez.

## İçerik Kaynağı

Geçici typed content katmanı:

- `src/content/devices.ts`
- `src/content/services.ts`
- `src/content/blog-posts.ts`

Bu katman ileride PostgreSQL/Prisma ve admin panel yönetimiyle değiştirilecek şekilde tasarlanır.

## SEO Katmanı

- Site config: `src/config/site.ts`
- Metadata helper: `src/lib/seo/metadata.ts`
- Structured data helper: `src/lib/seo/structured-data.ts`
- Sitemap: `src/app/sitemap.ts`
- Robots: `src/app/robots.ts`

## Form Ayrımı

- `/iletisim`: iletişim bilgileri ve ofis konumu
- `/servis-talebi`: güvenli servis talebi formu

İletişim sayfasında ikinci bir form kopyası oluşturulmaz.

## Public / Admin Route Separation

App Router uzun vadeli yapı route group ayrımıyla düzenlenir:

```text
src/app/
├── (public)/
│   ├── layout.tsx
│   └── page.tsx
├── admin/
│   ├── layout.tsx
│   ├── login/
│   └── (protected)/
│       ├── layout.tsx
│       ├── dashboard/
│       └── [...module]/
└── api/
```

Public layout yalnızca web sitesi ziyaretçilerine ait Navbar, Footer, cookie consent ve public structured data içerir. Admin layout public UI içermez.

## Admin Auth Boundary

`src/lib/auth/admin-session.ts` geçici auth contract katmanıdır.

- `getCurrentAdminSession()`
- `requireAdminSession()`
- `requirePermission()`

Gerçek session altyapısı uygulanana kadar protected admin route'ları oturum yoksa `/admin/login` adresine yönlenir. Geliştirme ortamında `ADMIN_DEV_BYPASS=true` ile admin shell görsel test için açılabilir.

## RBAC Layer

`src/lib/rbac/permissions.ts` rolleri, izinleri ve route erişim sözleşmesini tanımlar. Bu katman gelecekte server-side session ve Prisma repository ile birlikte uygulanacaktır.

## Future Prisma Repository

## Prisma / PostgreSQL Layer

Database foundation `prisma/schema.prisma` ile tanimlanir. Runtime access yalnizca server-side calisan repository katmani uzerinden yapilir.

Temel dosyalar:

- `prisma/schema.prisma`: PostgreSQL model, enum, relation ve index sozlesmeleri.
- `prisma.config.ts`: Prisma CLI datasource, migration ve seed ayarlari.
- `prisma/seed.ts`: idempotent development seed.
- `src/lib/database/prisma.ts`: server-only PrismaClient singleton.
- `src/lib/database/repositories/*`: UI ve route'lardan ayrilmis repository contract/adapters.
- `src/lib/database/importers/service-request-json-importer.ts`: local JSON servis talepleri icin dry-run import temeli.

Public sayfalar simdilik database'e bagli degildir. Public typed content katmani admin CRUD hazir olana kadar korunur; sonrasinda veri kaynagi repository uzerinden PostgreSQL'e tasinir.

Repository sinirlari:

- UI component icinde Prisma query yazilmaz.
- API route ve server action katmani once validation yapar, sonra repository cagirir.
- Password hash, file content, secret veya raw filesystem path DTO olarak disari verilmez.
- Service request dosya kayitlari database'de yalniz storage key, MIME type ve boyut metadata'si olarak tutulur.

Local development akisi:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Typed content dosyaları geçicidir. Admin CRUD tamamlandığında cihaz, hizmet, blog, medya, servis talepleri, kullanıcılar, roller ve audit log kayıtları Prisma repository katmanından beslenecektir.
