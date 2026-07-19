# Agent Context

This repo is a static TempleDiary site with Cloudflare Pages Functions and D1.
It is not a Python `uv` project; there is no `pyproject.toml` or `uv.lock`.

## Token-Efficient Read Order

Start here before opening broad files:

1. `AGENTS.md` - current agent instructions and file ownership.
2. `.agents/CHANGELOG.md` - recent changes by agents or developers (newest first).
3. `.agents/DEVELOPER_MANUAL.md` - full route reference, decisions, conventions, playbooks.
4. `.agents/PROJECT_HISTORY.md` - full evolution story: why KV→D1, SSG, naming changes, etc.
5. `PROJECT_MAP.md` - compact project graph and common workflows.
6. `ARCHITECTURE.md` - deeper system notes, D1 tables, and API flows.
7. `SSG-CONTEXT.md` - SSG build layer details (only if touching SEO/build/dist).
8. Only then open the specific HTML/JS/API/data file needed for the task.

Avoid reading all `data/*.json`, all HTML pages, or all generated SQL batches unless
the task explicitly needs them.

## Agent Logging Rule

**Before ending any session where files were changed**, add a dated entry to
`.agents/CHANGELOG.md` that includes: actor, files changed, motivation, and a bullet
list of what changed. This keeps the change history visible across sessions.

## Project Shape

- Static public pages live at repo root: `index.html`, `map.html`, `festivals.html`,
  `about.html`, `contact.html`, `privacy.html`, `terms.html`, `login.html`,
  `dashboard.html`.
- Shared public styling is in `assets/css/style.css`.
- Shared frontend state configuration is in `assets/js/core/states.js`.
- Main public behavior is in `assets/js/public/main.js`.
- Map behavior is in `assets/js/public/map.js`.
- Submission/correction modal helpers are in `assets/js/public/submit-location.js`.
- Festival data is in `assets/js/public/festivals-data.js`.
- Admin dashboard behavior is in `assets/js/admin/dashboard.js`.
- Public images, hero assets, and favicons live under `assets/images/`.
- Public temple listing data lives in `data/*.json`.
- Cloudflare Pages Functions live in `functions/api/*.js`.
- D1 schema and migrations live in `schema.sql` and `scripts/d1/*.sql`.
- D1 import tooling lives in `scripts/d1/import-json-to-d1.mjs`.
- D1-to-public JSON publishing: three paths — `scripts/split-d1-export-bundle.mjs`
  (dashboard export), `scripts/export-d1-to-json.mjs` (direct Wrangler),
  `.github/workflows/export-d1-json.yml` (automated GH Action).
- SSG build script is `scripts/build-static.mjs`; output goes to `dist/`.
- Cloudflare Pages serves from `dist/` with build command `node scripts/build-static.mjs`.

## Main Workflows

- Public temple browsing: `index.html` -> `assets/js/public/main.js` -> `data/*.json`.
- Public map: `map.html` -> `assets/js/public/map.js` -> `data/*.json` -> Leaflet markers.
- Community submission/correction: public UI -> `/api/submit-temple` ->
  `functions/api/submit-temple.js` -> D1 `temple_requests`.
- Admin D1 records: `dashboard.html` -> `/api/temples` ->
  `functions/api/temples.js` -> D1 `temples`.
- Admin D1 state discovery: `dashboard.html` -> `/api/temple-states` ->
  `functions/api/temple-states.js` -> D1 `temples`.
- Admin requests queue: `dashboard.html` -> `/api/temple-requests` ->
  `functions/api/temple-requests.js` -> D1 `temple_requests` and, on approval,
  D1 `temples`.
- Publish approved D1 data to public JSON: admin dashboard D1 all-state export ->
  `scripts/split-d1-export-bundle.mjs` -> `data/*.json`.

## Data Model Pointers

- `temples` is the canonical D1 table for imported and admin-managed temple records.
- `temple_requests` is the review queue for submissions, corrections, and deletion
  requests.
- Static JSON is still the fast public data source. D1 updates do not automatically
  rewrite `data/*.json`; use `scripts/split-d1-export-bundle.mjs` with a dashboard
  D1 export bundle when publishing approved D1 changes.
- Cloudflare D1 binding name expected by the code is `DB`.
- If `ADMIN_API_TOKEN` is configured, admin APIs require `x-admin-token` or `?token=`.

## Editing Guidance

- Keep changes scoped; this is a mostly static site without a build step.
- Keep page URLs at the repo root unless routing/redirects are updated and verified.
- Put new shared frontend assets under `assets/` instead of adding more root-level JS/CSS/images.
- Add or edit public state metadata in `assets/js/core/states.js`; homepage tabs,
  map links, and dashboard state lists read from that shared config.
- Preserve the existing plain HTML/CSS/vanilla JS style unless the user asks for a
  larger refactor.
- Do not hand-edit generated files in `tmp/d1-import-batches/`; regenerate them with
  `node scripts/d1/import-json-to-d1.mjs` when needed.
- `CLOUDFLARE-DEPLOY.md` contains some older naming examples. Prefer
  `ARCHITECTURE.md` and current source files when they disagree.
