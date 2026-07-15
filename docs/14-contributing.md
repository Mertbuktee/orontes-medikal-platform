# Contributing

## Local Checks

Run these before handing off larger changes:

```bash
npm run test
npm run lint
npm run build
npm run db:validate
```

## Notes

- Do not commit local captures, traces, or generated QA archives.
- Keep admin actions protected by permission and same-origin checks.
- Prefer schema validation over throwing on malformed form input.
