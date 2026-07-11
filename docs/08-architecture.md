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
