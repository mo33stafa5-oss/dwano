# Dwano — Frontend Demo

Next.js 15 + React 19 + TypeScript + Framer Motion. Arabic-first responsive frontend prototype.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Demo routes

- `/` — Landing page
- `/search` — Search and simulated map
- `/pharmacy/ph-1` — Pharmacy profile
- `/login` — Demo role selection
- `/pharmacy/dashboard` — Pharmacy dashboard
- `/admin/dashboard` — Admin dashboard
- `/about`, `/how-it-works`, `/contact`, `/register`, `/faq`, `/forgot-password`, `/reset-password` — Supporting routes

## Demo data

30 fictional pharmacies, 50 medicines, 180 inventory records, six Fayoum districts. Stock changes persist to LocalStorage. No backend, live inventory, or authentication service. The map is a schematic visualization, not a real geographic map. Contact actions are intentionally disabled for fictional pharmacies.

## Scope and limitations

This is a runnable **first implementation**, not the full production-grade spec. Missing items include actual Leaflet/OpenStreetMap tiles, complete English localization, full pharmacy/admin CRUD across all entities, advanced registration wizard, real-world QA and comprehensive accessibility audits. Do not use this prototype to make medical availability claims.
