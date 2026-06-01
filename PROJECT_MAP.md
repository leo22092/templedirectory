# Project Map

Compact orientation for future AI sessions. Read this instead of scanning the repo.

## Graph

```mermaid
flowchart TD
  Visitor[Public visitor] --> Home[index.html]
  Visitor --> MapPage[map.html]
  Visitor --> Festivals[festivals.html]

  StateConfig[assets/js/core/states.js] --> MainJS[assets/js/public/main.js]
  StateConfig --> MapJS[assets/js/public/map.js]
  StateConfig --> Admin[dashboard.html]
  Home --> MainJS
  MapPage --> MapJS
  Festivals --> FestivalData[assets/js/public/festivals-data.js]

  MainJS --> StaticData[data/*.json]
  MapJS --> StaticData
  MapJS --> Leaflet[Leaflet map]

  MainJS --> SubmitUI[submit/correction UI]
  SubmitUI --> SubmitAPI[/api/submit-temple]
  SubmitAPI --> SubmitFunction[functions/api/submit-temple.js]
  SubmitFunction --> Requests[(D1 temple_requests)]

  Admin[dashboard.html] --> TemplesAPI[/api/temples]
  Admin --> StatesAPI[/api/temple-states]
  Admin --> RequestsAPI[/api/temple-requests]
  TemplesAPI --> TemplesFunction[functions/api/temples.js]
  StatesAPI --> StatesFunction[functions/api/temple-states.js]
  RequestsAPI --> RequestsFunction[functions/api/temple-requests.js]
  TemplesFunction --> Temples[(D1 temples)]
  StatesFunction --> Temples
  RequestsFunction --> Temples
  RequestsFunction --> Requests

  ImportScript[scripts/d1/import-json-to-d1.mjs] --> StaticData
  ImportScript --> ImportSQL[tmp/d1-import-batches/*.sql]
  ImportSQL --> Temples
  Admin --> ExportBundle[D1 all-state export bundle]
  ExportBundle --> SplitScript[scripts/split-d1-export-bundle.mjs]
  SplitScript --> StaticData
```

## File Ownership

| Area | Files | Notes |
| --- | --- | --- |
| Public homepage/listing | `index.html`, `assets/js/public/main.js`, `assets/css/style.css` | Cards, filters, detail modal, correction entry points. |
| Public map | `map.html`, `assets/js/public/map.js`, `assets/css/style.css` | JSON loading, Leaflet markers, map filters. |
| Shared state config | `assets/js/core/states.js` | Single source for public state metadata, data files, hero images, map views, tabs, map links, dashboard state list. |
| Temple data | `data/*.json` | Public cacheable source of temple listings by state. Avoid loading every state unless needed. |
| Submissions UI | `assets/js/public/submit-location.js`, `assets/js/public/main.js`, `contact.html` | Posts visitor submissions and corrections to `/api/submit-temple`. |
| Admin dashboard | `dashboard.html`, `assets/js/admin/dashboard.js` | Static JSON editor, D1 records, editable request queue, import/export/health sections. |
| Static assets | `assets/css/`, `assets/js/`, `assets/images/` | Frontend code, shared CSS, hero images, source images, favicons. |
| API: state discovery | `functions/api/temple-states.js` | Returns D1-backed state list/counts for admin maintenance. |
| API: temples | `functions/api/temples.js` | Reads and writes canonical D1 `temples` records. |
| API: submit | `functions/api/submit-temple.js` | Accepts public submissions/corrections/deletions and stores request rows. |
| API: requests | `functions/api/temple-requests.js` | Admin request queue, editable payloads, and approve/reject/needs-review actions. |
| Database | `schema.sql`, `scripts/d1/add-request-workflow.sql` | D1 table definitions and migration history. |
| D1 import | `scripts/d1/import-json-to-d1.mjs` | Generates import batches from `data/*.json`. |
| D1 export publish | `scripts/split-d1-export-bundle.mjs` | Splits dashboard all-state D1 export bundle into `data/<state>.json` files. |
| Deployment notes | `CLOUDFLARE-DEPLOY.md`, `_redirects`, `sitemap.xml`, `Robots.txt` | Cloudflare Pages/static deployment support. Some deploy doc examples are old. |

## Common Entry Points

- Change public temple listing behavior: open `assets/js/public/main.js`, then the relevant part of
  `index.html`; sample one relevant `data/<state>.json` only if data shape matters.
- Change map behavior: open `assets/js/public/map.js` and `map.html`.
- Add or change a public state: update `assets/js/core/states.js` and add/update
  `data/<state>.json`; homepage tabs, map links, and dashboard state options are
  rendered from the shared config.
- Change admin records behavior: open `dashboard.html` plus
  `assets/js/admin/dashboard.js` plus `functions/api/temples.js`, and
  `functions/api/temple-states.js` if state discovery is involved.
- Change request approval behavior: open `dashboard.html` plus
  `assets/js/admin/dashboard.js` plus `functions/api/temple-requests.js`.
  Submission approvals insert new D1 rows; correction/deletion approvals match an
  existing D1 row by `temple_id`, `source_json_id`, then state/name fallback.
- Change public submission fields: open `assets/js/public/main.js`,
  `assets/js/public/submit-location.js`, and `functions/api/submit-temple.js`.
- Change D1 schema/import: open `schema.sql`,
  `scripts/d1/add-request-workflow.sql`, and `scripts/d1/import-json-to-d1.mjs`.
- Publish a dashboard D1 all-state export to public JSON: run
  `node scripts/split-d1-export-bundle.mjs <bundle.json> --write`, then review
  and commit `data/*.json`.

## Adding New Frontend Work

- Keep root HTML pages as route entry points for Cloudflare Pages.
- Put public page scripts in `assets/js/public/`.
- Put shared browser config/helpers in `assets/js/core/`.
- Put admin-only scripts in `assets/js/admin/`.
- Put shared styling in `assets/css/`.
- Put hero/source/favicon images in `assets/images/`.
- Keep old asset redirects in `_redirects` when moving public files that may be cached or linked.

## Current Architecture Summary

- Public visitors mostly read static JSON.
- D1 holds canonical/admin-managed records and community request queues.
- Admin maintenance discovers available states from D1 via `/api/temple-states`,
  then merges those states with static display metadata.
- Community submissions, corrections, and deletions are editable in the admin
  request queue before approval.
- Static JSON is not automatically synced from D1; publish with a dashboard D1
  bundle and `scripts/split-d1-export-bundle.mjs`.
- Cloudflare Pages deploys the root static files and `functions/api` routes.
