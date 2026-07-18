# Roadmap

This document tracks product direction at a high level. Keep detailed tasks in
the issue tracker or sprint board; keep this page focused on durable themes.

## Current Priorities

- Finish technical operations panel QA without folding technician workflows back into `/admin`.
- Keep public service request handling image-only, strongly validated and stable.
- Verify notification previews, live service-request refresh and completion flows across admin and technical panels.
- Keep homepage content, media, SEO and Site Settings source-of-truth behavior stable.
- Improve visual QA and RBAC E2E coverage before production releases.

## Completed Recently

- Split `/technical` into a separate technician-facing panel with its own login, shell and notifications list.
- Added technical customer, location, contact, device and service-history foundations.
- Added live service-request refresh plus admin/technical notification preview dropdowns.
- Added same-device previous service history on technical request detail pages.
- Removed PDF/document support from public service request uploads; only JPEG, PNG and WebP images remain accepted.
- Removed homepage hero/process numeric badges while preserving the original public text.

## Later

- Expand admin reporting.
- Add deeper integration tests for database-backed admin CRUD.
- Reintroduce document/PDF upload only after malware scanning, structural validation and retention policy are designed.
- Review dependency upgrades on a scheduled cadence.
