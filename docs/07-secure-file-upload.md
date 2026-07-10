# Secure File Upload

The service request endpoint accepts one optional private attachment.

## Allowed Formats

- JPEG: `.jpg`, `.jpeg`, `.jfif`
- PNG: `.png`
- WebP: `.webp`
- PDF: `.pdf`

All other formats are rejected, including SVG, HTML, JavaScript, executables,
archives, Office macro files, and unknown binary formats.

## Maximum Size

The maximum upload size is 10 MB.

The HTTP request body is rejected early when `Content-Length` is greater than
12 MB. This application-level check is not enough by itself. Production must
enforce the same limit at the reverse proxy or edge layer, for example:

```nginx
client_max_body_size 12M;
```

## Why Client-Side Validation Is Not Enough

Browser-side checks such as `accept`, file extension checks, and `File.type`
improve user experience, but they are not a security boundary. A malicious
request can bypass the UI and submit arbitrary multipart data directly to the
HTTP endpoint.

The server therefore validates:

- Expected form fields
- Text field length and format
- File count and file size
- Extension allowlist
- Reported MIME type
- Detected file signature / magic bytes
- Extension, MIME type, and detected type consistency

Images are decoded and re-encoded with `sharp` before private storage so user
metadata is not preserved. Image decoding is limited to 40,000,000 input pixels
to reduce decompression bomb risk.

PDF uploads are checked for matching extension, reported MIME type, detected
signature, and an EOF marker. This is not full PDF sanitization or structural
validation.

## Local Storage Location

Local development stores accepted files outside the public web root:

```text
storage/private/service-requests/
```

Files in this directory are not publicly addressable and are not returned to the
client as raw filesystem paths.

Development service request metadata is stored as private JSON files under:

```text
storage/private/service-requests/requests/
```

This local JSON repository is development-only. It stores metadata, not raw file
contents. Production will replace this adapter with PostgreSQL/Prisma.

## Production Storage Plan

The code uses a storage adapter interface so production can move uploads to an
S3-compatible private object store without changing route validation logic.

Production storage should:

- Use private buckets or private object ACLs
- Avoid public download URLs by default
- Use random server-side object names
- Keep original filenames only as sanitized metadata
- Avoid hardcoded credentials

Production metadata persistence should use PostgreSQL with Prisma or an
equivalent database-backed repository adapter.

## Rate Limit Plan

The local implementation uses an in-memory limiter:

- 5 submissions per IP
- 15 minute window

Production should replace this with Redis or another shared store so limits work
across multiple server instances.

`TRUST_PROXY` controls whether proxy IP headers are trusted:

- `TRUST_PROXY=true`: parse the first valid `x-forwarded-for` address, then
  `x-real-ip`.
- Any other value: ignore forwarded IP headers.

Production reverse proxies must overwrite inbound forwarded headers so clients
cannot spoof rate-limit identity. Production should use a Redis-backed
rate-limit adapter.

## Origin Policy

Set `APP_ORIGIN` in production, for example:

```text
APP_ORIGIN=https://orontesteknoloji.com
```

Multiple origins can be supplied as a comma-separated list if needed. Malformed
`Origin` headers are rejected. Development also allows `http://localhost:3000`.

## Antivirus And Content Scanning

Antivirus scanning is not implemented yet and should not be assumed to exist.
Before launch, PDF and other accepted document uploads should be routed through
a real scanning layer such as ClamAV or a managed malware scanning service.

A production flow should keep files quarantined until the scanner returns a
clean result.

If PDF uploads remain enabled in production, add structural PDF validation and,
where appropriate, Content Disarm and Reconstruction before files are released
to internal users.

## Retention And Deletion

Before launch, define:

- How long service request attachments are retained
- Who can access private attachments
- How users or admins can request deletion
- How backups handle deleted attachments
