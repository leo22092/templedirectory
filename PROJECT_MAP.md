# Project Map

Compact orientation for future AI sessions. Read this instead of scanning the repo.

## Graph

```mermaid
flowchart TD
  Visitor[Public visitor] --> Home[index.html]
  Visitor --> MapPage[map.html]
  Visitor --> Festivals[festivals.html]

  Home --> MainJS[main.js]
  MapPage --> MapJS[map.js]
  Festivals --> FestivalData[festivals-data.js]

  MainJS --> StaticData[data/*.json]
  MapJS --> StaticData
  MapJS --> Leaflet[Leaflet map]

  MainJS --> SubmitUI[submit/correction UI]
  SubmitUI --> SubmitAPI[/api/submit-temple]
  SubmitAPI --> SubmitFunction[functions/api/submit-temple.js]
  SubmitFunction --> Requests[(D1 temple_requests)]

  Admin[dashboard.html] --> TemplesAPI[/api/temples]
  Admin --> RequestsAPI[/api/temple-requests]
  TemplesAPI --> TemplesFunction[functions/api/temples.js]
  RequestsAPI --> RequestsFunction[functions/api/temple-requests.js]
  TemplesFunction --> Temples[(D1 temples)]
  RequestsFunction --> Temples
  RequestsFunction --> Requests

  ImportScript[scripts/d1/import-json-to-d1.mjs] --> StaticData
  ImportScript --> ImportSQL[tmp/d1-import-batches/*.sql]
  ImportSQL --> Temples
```

## File Ownership

| Area | Files | Notes |
| --- | --- | --- |
| Public homepage/listing | `index.html`, `main.js`, `style.css` | State registry, cards, filters, detail modal, correction entry points. |
| Public map | `map.html`, `map.js`, `style.css` | State config, JSON loading, Leaflet markers. |
| Temple data | `data/*.json` | Public cacheable source of temple listings by state. Avoid loading every state unless needed. |
| Submissions UI | `submit-location.js`, `main.js`, `contact.html` | Posts visitor submissions and corrections to `/api/submit-temple`. |
| Admin dashboard | `dashboard.html` | Static JSON editor, D1 records, request queue, import/export/health sections. |
| API: temples | `functions/api/temples.js` | Reads and writes canonical D1 `temples` records. |
| API: submit | `functions/api/submit-temple.js` | Accepts public submissions/corrections/deletions and stores request rows. |
| API: requests | `functions/api/temple-requests.js` | Admin request queue and approve/reject/needs-review actions. |
| Database | `schema.sql`, `scripts/d1/add-request-workflow.sql` | D1 table definitions and migration history. |
| D1 import | `scripts/d1/import-json-to-d1.mjs` | Generates import batches from `data/*.json`. |
| Deployment notes | `CLOUDFLARE-DEPLOY.md`, `_redirects`, `sitemap.xml`, `Robots.txt` | Cloudflare Pages/static deployment support. Some deploy doc examples are old. |

## Common Entry Points

- Change public temple listing behavior: open `main.js`, then the relevant part of
  `index.html`; sample one relevant `data/<state>.json` only if data shape matters.
- Change map behavior: open `map.js` and `map.html`.
- Change admin records behavior: open `dashboard.html` plus
  `functions/api/temples.js`.
- Change request approval behavior: open `dashboard.html` plus
  `functions/api/temple-requests.js`.
- Change public submission fields: open `main.js`, `submit-location.js`, and
  `functions/api/submit-temple.js`.
- Change D1 schema/import: open `schema.sql`,
  `scripts/d1/add-request-workflow.sql`, and `scripts/d1/import-json-to-d1.mjs`.

## Current Architecture Summary

- Public visitors mostly read static JSON.
- D1 holds canonical/admin-managed records and community request queues.
- Community submissions and corrections are reviewed before becoming canonical.
- Static JSON is not automatically synced from D1 yet.
- Cloudflare Pages deploys the root static files and `functions/api` routes.

