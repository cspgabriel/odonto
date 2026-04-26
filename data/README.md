# CareNova Demo & Seed Data

## Single source: data.json

All demo seeding uses **data/data.json** only.

| File | Purpose |
|------|---------|
| **data.json** | **Demo seed** – loaded by `npm run db:seed` and by `npm run seed:payments`. Supabase export format `[{ "json_build_object": { ... } }]` is supported and unwrapped automatically. |
| **seed-data.json** | No longer used by seed. Can be removed or kept as a local backup; Settings → Import seed data accepts uploaded JSON in the same flat format. |

**Run demo:** `npm run db:seed` (with `SUPABASE_SERVICE_ROLE_KEY` in `.env`). Seed reads `data/data.json`, skips `role_permissions`, and seeds all tables. It also adds extra appointments, prescriptions, and dashboard data when the DB is empty.

---

## data.json format

- **Supabase export:** `[{ "json_build_object": { "clinics": [...], "departments": [...], "patients": [...], ... } }]` – supported; seed unwraps it.
- **Flat:** `{ "clinics": [...], "departments": [...], ... }` – also supported.
- **Size:** Can be large (~5 MB). Full demo = more patients, appointments, invoices; seed will take longer.

---

## Demo logins (after seed)

`admin@carenova.demo`, `doctor@carenova.demo`, `receptionist@carenova.demo`, `nurse@carenova.demo` with password from `DEMO_PASSWORD` in `.env` (default `Demo123!`).

---

## Optional: flat export for Import seed data

If you need a flat JSON file (e.g. for Settings → Import seed data):

```bash
npm run seed:convert-export
```

Writes `data/seed-from-export.json` (flat format). Main seed stays `data/data.json`.
