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