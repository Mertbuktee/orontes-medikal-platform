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

POST /api/admin/login

POST /api/admin/logout

GET /api/admin/me

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

GET

POST

DELETE

/api/admin/media

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

## Future Database-Backed Admin APIs

Admin API'lari gercek auth/session ve server-side RBAC tamamlandiktan sonra Prisma repository katmanina baglanacaktir.

Planlanan temel API gruplari:

- `GET /api/admin/service-requests`: servis talepleri listeleme, filtreleme ve durumlara gore sorgulama.
- `GET /api/admin/service-requests/:id`: talep detayi, attachment metadata, notlar ve durum gecmisi.
- `PATCH /api/admin/service-requests/:id`: durum, atama ve arsivleme islemleri.
- `POST /api/admin/service-requests/:id/notes`: internal note ekleme.
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
