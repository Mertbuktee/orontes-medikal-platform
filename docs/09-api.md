# API

# Public API

---

## POST /api/service-requests

Yeni servis talebi oluşturur.

### Request

multipart/form-data

Alanlar

- fullName
- company
- phone
- email
- message
- attachment
- website
- formStartedAt

---

### Success

200

```json
{
  "success": true,
  "requestId": "uuid",
  "message": "Servis talebiniz alınmıştır."
}
```

### Validation Error

400

```json
{
  "success": false,
  "requestId": "uuid",
  "message": "Gönderilen bilgiler geçersiz.",
  "fieldErrors": {}
}
```

### Status Codes

- 200 Success
- 400 Validation Error
- 403 Origin Rejected
- 413 Payload Too Large
- 429 Too Many Requests
- 500 Internal Server Error

---

# Admin API

## Authentication

POST /api/admin/auth/login

POST /admin/auth/logout

GET /api/admin/me (planned)

### POST /api/admin/auth/login

Accepts JSON credentials:

- `email`
- `password`

Security behavior:

- Same-origin POST only.
- Argon2id password verification.
- Generic error message for missing account, inactive account or wrong password.
- Login rate limit by normalized email plus trusted client IP.
- On success, creates an opaque database-backed session and sets `orontes_admin_session`.

### POST /admin/auth/logout

Revokes the current database session, clears `orontes_admin_session` and redirects to `/admin/login`.

This route intentionally lives under `/admin` because the admin session cookie uses `Path=/admin`. GET requests must not perform logout mutation.

---

## Service Requests

GET /api/admin/service-requests

↓

Tüm servis taleplerini getirir.

GET /api/admin/service-requests/:id

↓

Tek servis talebini getirir.

PATCH /api/admin/service-requests/:id

↓

Durum veya not günceller.

DELETE /api/admin/service-requests/:id

↓

Servis talebini siler.

---

## Devices

GET

POST

PATCH

DELETE

/api/admin/devices

---

## Services

GET

POST

PATCH

DELETE

/api/admin/services

---

## Blog

GET

POST

PATCH

DELETE

/api/admin/blog

---

## Media

Media library currently uses App Router pages and server actions:

- `GET /admin/media`: server-rendered admin gallery/list.
- `GET /admin/media/:id`: server-rendered admin detail.
- `uploadMedia(formData)`: server action requiring `media.upload`.
- `updateMediaMetadata(formData)`: server action requiring `media.update`.
- `archiveMedia(formData)`: server action requiring `media.update`.
- `restoreMedia(formData)`: server action requiring `media.update`.
- `deleteUnusedMedia(formData)`: server action requiring `media.delete`.
- `GET /media/:id/:variant`: controlled public hardened image delivery.

No raw upload path, private storage path or service-request attachment URL is exposed.

---

## Settings

GET

PATCH

/api/admin/settings

---

## Users

GET

POST

PATCH

DELETE

/api/admin/users
# Public API Notları

Public site mimarisi değişirken mevcut güvenli backend davranışı korunur.

## Servis Talebi

Endpoint:

- `POST /api/service-requests`

Form field adları:

- fullName
- company
- phone
- email
- message
- deviceBrand
- deviceModel
- deviceSerialNumber
- attachment
- website
- formStartedAt

Frontend:

- `/servis-talebi` sayfası mevcut güvenli `ServiceRequestForm` component'ini kullanır.
- `multipart/form-data` davranışı korunur.
- Honeypot `website` alanı korunur.
- `formStartedAt` alanı korunur.
- Dosya yükleme server-side validasyonları korunur.

Sitemap ve robots:

## Admin Service Request Operations

Servis talebi admin akisi su an App Router server component ve server action yapisi ile calisir.

- `/admin/service-requests`: server-side pagination, arama, durum, atanan personel, attachment, tarih, arşiv ve sıralama filtresi.
- `/admin/service-requests/[id]`: detay, attachment metadata, notlar ve durum gecmisi.
- `updateServiceRequestStatus(formData)`: server action, `serviceRequests.update` izni gerektirir.
- `assignServiceRequest(formData)`: server action, `serviceRequests.assign` izni gerektirir.
- `addServiceRequestNote(formData)`: server action, `serviceRequests.notes.create` izni gerektirir.
- `archiveServiceRequest(formData)`: server action, `serviceRequests.archive` izni gerektirir.
- `GET /admin/service-requests/:id/attachments/:attachmentId`: authenticated private download endpoint, `serviceRequests.attachments.view` izni ve ownership kontrolü gerektirir.

Bu islemler Prisma repository katmanini kullanir; UI component icinde dogrudan Prisma sorgusu dagitilmaz.

Admin attachment endpoint'i bilinçli olarak `/api` altında değildir. Admin session cookie `Path=/admin` ile sınırlandığı için private dosya erişimi `/admin/...` route handler'ı üzerinden yapılır.

## Future Database-Backed Admin APIs

Admin API'lari ve server action'lari gercek auth/session ve server-side RBAC ile Prisma repository katmanina baglanir.

Planlanan temel API gruplari:

- `GET/PATCH /api/admin/service-requests`: ileride headless/API ihtiyaci olursa mevcut server action/repository sozlesmesi uzerinden acilabilir.
- `GET/POST/PATCH /api/admin/devices`: cihaz grubu yonetimi.
- `GET/POST/PATCH /api/admin/services`: hizmet yonetimi.
- `GET/POST/PATCH /api/admin/hero-slides`: hero slider yonetimi.
- `GET/POST/PATCH /api/admin/blog`: blog kategori ve yazi yonetimi.
- `GET/POST/PATCH /api/admin/settings`: site ayarlari.
- `GET /api/admin/audit-log`: audit log goruntuleme.

Kurallar:

- Admin mutation endpoint'leri session, permission ve CSRF stratejisi olmadan acilmamalidir.
- Prisma query'leri route dosyalarina dagitilmaz; repository adapter'lari kullanilir.
- `passwordHash`, session token, raw upload path veya file content response'a eklenmez.
- Audit log metadata'sinda parola, token, dosya icerigi, telefon/e-posta/mesaj gibi hassas veriler tutulmaz.

- API route'ları sitemap'e eklenmez.
- `/api/` robots tarafından disallow edilir.
## Hero Slider Admin Actions

Hero Slider management currently uses App Router server actions rather than public API routes.

- `createHeroSlide(formData)`: requires `heroSlides.create`.
- `updateHeroSlide(formData)`: requires `heroSlides.update`.
- `deleteHeroSlide(formData)`: requires `heroSlides.delete`.
- `moveHeroSlide(formData)`: requires `heroSlides.reorder`.
- `toggleHeroSlideActive(formData)`: requires `heroSlides.publish`.
- `toggleHeroSlideAutoplay(formData)`: requires `heroSlides.update`.
- `updateHeroSliderSettings(formData)`: requires `heroSlides.update`.

All actions validate input server-side, select media by Media ID only, write audit events and revalidate affected public/admin routes.

## Device Group Admin Actions

Device group management currently uses App Router server actions rather than public API routes.

- `createDeviceGroup(formData)`: requires `devices.create`.
- `updateDeviceGroup(formData)`: requires `devices.update`.
- `moveDeviceGroup(formData)`: requires `devices.reorder`.
- `toggleDeviceActive(formData)`: requires `devices.publish`.
- `toggleDeviceFeatured(formData)`: requires `devices.publish`.
- `archiveDeviceGroup(formData)`: requires `devices.delete`.
- `restoreDeviceGroup(formData)`: requires `devices.publish`.
- `deleteArchivedDeviceGroup(formData)`: requires `devices.delete`.

All actions validate input server-side, select media by Media ID only, reject unknown icons/capabilities, write audit events and revalidate `/`, `/cihazlar`, `/admin/devices` and `/admin/dashboard`.
# Hizmet Yönetimi Aksiyonları

Hizmet yönetimi admin server action mimarisiyle yürür. Create, update, reorder, active/featured state, archive, restore ve kalıcı silme işlemleri server-side oturum ve permission kontrolü gerektirir.

Public route değişmez:

- `/hizmetler` aktif hizmetleri listeler.
- Ana sayfa yalnızca aktif ve öne çıkan hizmetleri gösterir.
- Elektronik kart tamiri hizmeti `/elektronik-kart-tamiri` landing page'ine yönlenmeye devam eder.
## Homepage Admin Actions

Ana sayfa yönetimi ilk aşamada Server Actions ile çalışır:

- section update
- section reorder
- visibility toggle
- homepage SEO update

Her action admin session, RBAC permission, Zod validation, repository call, audit log ve ilgili cache/path revalidation akışından geçer. Public API endpoint’i eklenmedi; public homepage server-side section registry ile DB-backed içerikleri okur.
## Blog CMS Actions

Blog CMS uses server actions under `/admin/blog` for create, update, publish, unpublish, archive, category create/update/reorder/archive and authenticated preview navigation. Public `/blog` and `/blog/[slug]` are read-only routes backed by repository queries; there is no public mutation endpoint and no public draft URL.
