# Database

## Production Database

PostgreSQL

ORM

Prisma

---

# User

- id
- name
- email
- passwordHash
- role
- isActive
- createdAt
- updatedAt

---

# ServiceRequest

- id
- fullName
- company
- phone
- email
- message
- status
- assignedUserId
- createdAt
- updatedAt

---

# Attachment

- id
- serviceRequestId
- storageKey
- mimeType
- originalName
- size
- createdAt

---

# Device

- id
- title
- slug
- description
- icon
- tags
- order
- isActive
- createdAt
- updatedAt

---

# Service

- id
- title
- slug
- description
- icon
- order
- isActive
- createdAt
- updatedAt

---

# BlogCategory

- id
- name
- slug
- createdAt

---

# BlogPost

- id
- title
- slug
- excerpt
- content
- coverImageId
- categoryId
- seoTitle
- seoDescription
- publishedAt
- createdAt
- updatedAt

---

# Media

- id
- storageKey
- mimeType
- size
- width
- height
- altText
- uploadedById
- createdAt

---

# SiteSetting

- id
- key
- value
- type
- updatedAt

---

## HeroSlide

- id
- title
- description
- badge
- imageId
- imageAlt
- linkUrl
- order
- isActive
- includeInAutoplay
- createdAt
- updatedAt

Planlanan ilişki:

HeroSlide

→

Media

---

# AuditLog

- id
- userId
- action
- entity
- entityId
- ipAddress
- metadata
- createdAt

---

# Roller

- SUPER_ADMIN
- ADMIN
- EDITOR
- SERVICE_STAFF
- VIEWER

---

# Servis Durumları

- NEW
- REVIEWING
- WAITING_FOR_CUSTOMER
- APPROVED
- IN_REPAIR
- COMPLETED
- CANCELLED
- ARCHIVED

---

# İlişkiler

User

↓

BlogPost

↓

Media

↓

ServiceRequest

↓

Attachment

BlogCategory

↓

BlogPost

---

# Development

Storage

Local JSON Repository

---

# Production

Storage

S3 Compatible Storage

Database

PostgreSQL

ORM

Prisma

Cache

Redis

---

## PageContent

- id
- slug
- title
- metaTitle
- metaDescription
- excerpt
- status
- createdAt
- updatedAt

Planlanan ilişki:

PageContent

→

ContentBlock

## ContentBlock

- id
- pageId
- type
- title
- body
- order
- isActive
- createdAt
- updatedAt

## ServiceCategory

- id
- title
- slug
- description
- detail
- iconKey
- order
- isActive
- createdAt
- updatedAt

## DeviceGroup

- id
- title
- slug
- shortDescription
- fullDescription
- iconKey
- capabilities
- isFeatured
- order
- isActive
- seoTitle
- seoDescription

## ServiceCategory

- id
- title
- slug
- shortDescription
- fullDescription
- iconKey
- isFeatured
- order
- isActive
- seoTitle
- seoDescription

## BlogPost Public Fields

## Prisma / PostgreSQL Foundation

Prisma 7 ve PostgreSQL icin definitive schema `prisma/schema.prisma` altindadir. Runtime baglanti `@prisma/adapter-pg` ve `DATABASE_URL` ile kurulur.

### Enums

- `Role`: SUPER_ADMIN, ADMIN, EDITOR, SERVICE_STAFF, VIEWER
- `ServiceRequestStatus`: NEW, REVIEWING, WAITING_FOR_CUSTOMER, APPROVED, IN_REPAIR, COMPLETED, CANCELLED, ARCHIVED
- `ContentStatus`: DRAFT, PUBLISHED, ARCHIVED
- `AuditAction`: LOGIN, LOGOUT, LOGIN_FAILURE, SESSION_REVOKED, PASSWORD_CHANGED, ACCOUNT_LOCKED, CREATE, UPDATE, DELETE, PUBLISH, ARCHIVE, STATUS_CHANGE

### Core Models

- `User`: admin kullanicilari. `email` unique ve normalize edilmelidir. `passwordHash` zorunludur; plain password alani yoktur.
- `ServiceRequest`: public servis talebi metadata'si, cihaz bilgileri, status, atama ve arsiv tarihi.
- `Attachment`: private/object storage dosya metadata'si. Binary data PostgreSQL'e yazilmaz.
- `ServiceRequestNote`: admin internal notlari.
- `ServiceRequestStatusHistory`: durum degisikligi gecmisi.
- `DeviceGroup`: cihaz gruplari, slug, aciklamalar, icon key, capabilities, featured/active/order ve SEO alanlari.
- `Service`: hizmetler, slug, aciklamalar, icon key, featured/active/order ve SEO alanlari.
- `Media`: private/object storage medya metadata'si, alt text ve boyut bilgisi.
- `HeroSlide`: admin tarafindan yonetilecek hero slider slaytlari; `Media` ile iliskili.
- `BlogCategory`: blog kategori sozlugu.
- `BlogPost`: blog yazisi, JSON content, status, kategori, cover media, author ve SEO alanlari.
- `SiteSetting`: typed application-level parsing gerektiren JSON ayar degeri. Secret'lar burada tutulmaz.
- `AdminSession`: opaque admin session token hash'i, expiry, revocation, last seen, IP ve user-agent metadata'si.
- `AuditLog`: immutable davranisla planlanan guvenlik/yonetim olay kayitlari.

### Index And Uniqueness

- `User.email` unique ve indexlidir.
- `DeviceGroup.slug`, `Service.slug`, `BlogCategory.slug`, `BlogPost.slug` unique tutulur.
- `Attachment.storageKey` ve `Media.storageKey` unique tutulur.
- Status, assigned user, active/featured/order, created date, entity ve actor alanlari sorgu performansi icin indexlenir.
- `AdminSession.tokenHash` unique tutulur. `userId`, `expiresAt`, `revokedAt` ve aktif session sorgulari icin composite index bulunur.

### Relation And Delete Policies

- User silmek audit tarihcesini sessizce yok etmez; `AuditLog.actor` kullanici silinirse `SetNull` davranisiyla tarihceyi korur.
- User session'lari user'a baglidir; kullanici silme yerine kullaniciyi pasife alma ve session revoke etme tercih edilir.
- Blog author, note author ve status changer iliskileri restrict davranisindadir.
- Service request kayitlari normalde fiziksel silinmez; `ARCHIVED` status veya `archivedAt` kullanilir.
- Service request fiziksel silinirse attachment/note/history kayitlari cascade temizlenir; storage dosya silme uygulama katmaninda koordine edilir.
- Service request assigned user silinirse atama `SetNull` olur.
- Media silme, referansli hero slide veya blog cover varsa restrict davranisiyla engellenir.
- Blog category silme, publish edilmis veya mevcut postlari orphan birakmamak icin restrict davranisindadir.
- Site setting updated user silinirse `updatedBy` `SetNull` olur.

### Migration Workflow

Development:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

Production:

```bash
npm run db:deploy
npm run db:generate
```

Kurallar:

- `prisma migrate reset` otomatik calistirilmaz.
- Production migration oncesi database backup alinmali ve restore testi dogrulanmalidir.
- Seed production admin parolasi veya fake musteri verisi olusturmaz.
- Initial admin bootstrap `npm run admin:bootstrap` ile bilincli calistirilir; seed fake/default admin parolasi olusturmaz.

### Local JSON Migration Readiness

Development servis talepleri halen `storage/private/service-requests/requests/` altinda local JSON olarak bulunabilir. Import temeli dry-run calisir, duplicate id/storage key raporlar ve dosya veya JSON silmez. Production gecisinde `PrismaServiceRequestRepository` hedef repository olacaktir.

- id
- title
- slug
- excerpt
- contentBlocks
- category
- coverImageId
- status
- publishedAt
- seoTitle
- seoDescription
- description
- capabilityChips
- iconKey
- featuredOnHome
- order
- isActive
- createdAt
- updatedAt
## Service Request Operations

`ServiceRequest`, `Attachment`, `ServiceRequestNote` and `ServiceRequestStatusHistory` now back the first real admin module.

- Public form submissions create `ServiceRequest` rows and optional `Attachment` metadata rows.
- Uploaded file bytes stay in private storage; PostgreSQL stores only `storageKey`, MIME type, size and optional display metadata.
- Status changes are written through repository transactions and create `ServiceRequestStatusHistory` rows.
- Archive is the normal retention action: `archivedAt` is set and status becomes `ARCHIVED`. Hard delete is not exposed in the normal admin UI.
- Assignment uses `assignedUserId` and is limited to active admin/service roles.
- Internal notes are stored as plain text and never shown publicly.
- Audit logs store safe metadata only; customer message, phone, email and file contents are excluded.

The JSON importer reads local development records from `storage/private/service-requests/requests/`, reports duplicates and missing attachments, and writes only when `--apply` is supplied.

## Media Library Models

`Media` now stores general media metadata for admin-managed images:

- `title`, `description`, `altText`
- `category`
- `usageType`
- `contentHash`
- `archivedAt`
- relation to `MediaVariant`

`MediaVariant` stores hardened derivative records:

- `ORIGINAL`
- `THUMBNAIL`
- `MEDIUM`
- `LARGE`

Binary image data is not stored in PostgreSQL. `Media.storageKey` points to the hardened original variant metadata, while each variant has its own unique storage key. Hero slides and blog covers reference `Media`; service-request attachments remain a separate model and are not part of the media library.
## Hero Slider Models

`HeroSlide` is now the database source for the public homepage Hero slider.

- `imageId` references `Media`; deleting a slide does not delete media.
- `createdById` and `updatedById` reference admin `User` rows with `SetNull` delete behavior.
- `linkLabel`, `linkUrl` and `objectPosition` support admin-managed CTA and image focal point settings.
- `order`, `isActive` and `includeInAutoplay` control public ordering and autoplay behavior.

Slider settings are stored in `SiteSetting` under `hero.slider.settings` as typed JSON. The application validates interval and transition bounds before persistence.

## Device Group Model

`DeviceGroup` backs both the homepage device preview and `/cihazlar`.

- `slug` is unique and URL-safe.
- `capabilities` is stored as a PostgreSQL text array validated by application allowlists.
- `imageId` and `openGraphImageId` reference `Media` with `SetNull` delete behavior.
- `createdById` and `updatedById` reference admin users with `SetNull` delete behavior.
- `archivedAt` keeps normal admin deletion non-destructive.
- `isActive`, `isFeatured` and `order` support public filtering and homepage preview ordering.

Indexes cover slug, title, active/order, featured/active/order, archive state and media/user references. Deleting a device group never deletes referenced media.
# Service

`Service` modeli teknik servis hizmetlerini temsil eder. Slug benzersizdir. Public listeler `isActive=true` ve `archivedAt=null` koşuluyla çalışır. Ana sayfa önizlemesi ayrıca `isFeatured=true` koşulunu uygular.

İlişkiler:

- `imageId` ve `openGraphImageId` opsiyonel `Media` ilişkileridir.
- `createdById` ve `updatedById` opsiyonel `User` ilişkileridir.
- Hizmet silme işlemi medya dosyalarını silmez.

Politika:

- Varsayılan silme davranışı arşivlemedir.
- Restore sonrası kayıt pasif kalır ve ayrıca aktifleştirilmelidir.
- Sıralama normalize edilir ve public sorgular order alanına göre döner.
## HomepageSection

`HomepageSection` ana sayfa bölümlerinin yönetilebilir kayıtlarını tutar.

- `key` benzersiz allowlist section anahtarıdır.
- `title`, `eyebrow`, `description` public/admin metin alanlarıdır.
- `content` JSONB olarak saklanır ancak application katmanında section key’e göre Zod ile doğrulanır.
- `order` public sıralamayı belirler.
- `isVisible=false` olan kayıtlar public homepage render’ına dahil edilmez.
- `updatedById` opsiyonel admin kullanıcı referansıdır ve kullanıcı silinirse `SetNull` davranışı kullanılır.

Homepage SEO ayarı `SiteSetting` içinde `homepage.seo` key’i ile tipli JSON olarak saklanır.
## Blog CMS Tables

`BlogPost` now supports draft/published/archived workflow, structured JSON content, featured state, scheduled publication timestamp, cover media, Open Graph media, optional author, created/updated actors and archive timestamp. `BlogCategory` supports description, SEO fields, order, active state and archive timestamp. `BlogPostRevision` stores previous structured content snapshots for published-post updates. Media rows are referenced, never deleted automatically by blog mutations.
