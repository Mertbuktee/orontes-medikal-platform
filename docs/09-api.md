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