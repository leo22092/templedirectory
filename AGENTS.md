# Agent Context

This repo is a static TempleDiary site with Cloudflare Pages Functions and D1.
It is not a Python `uv` project; there is no `pyproject.toml` or `uv.lock`.

## Token-Efficient Read Order

Start here before opening broad files:

1. `AGENTS.md` - current agent instructions and file ownership.
2. `PROJECT_MAP.md` - compact project graph and common workflows.
3. `ARCHITECTURE.md` - deeper system notes, D1 tables, and API flows.
4. Only then open the specific HTML/JS/API/data file needed for the task.

Avoid reading all `data/*.json`, all HTML pages, or all generated SQL batches unless
the task explicitly needs them.

## Project Shape

- Static public pages live at repo root: `index.html`, `map.html`, `festivals.html`,
  `about.html`, `contact.html`, `privacy.html`, `terms.html`, `login.html`,
  `dashboard.html`.
- Shared public styling is in `style.css`.
- Main public behavior is in `main.js`.
- Map behavior is in `map.js`.
- Submission/correction modal helpers are in `submit-location.js`.
- Festival data is in `festivals-data.js`.
- Public temple listing data lives in `data/*.json`.
- Cloudflare Pages Functions live in `functions/api/*.js`.
- D1 schema and migrations live in `schema.sql` and `scripts/d1/*.sql`.
- D1 import tooling lives in `scripts/d1/import-json-to-d1.mjs`.

## Main Workflows

- Public temple browsing: `index.html` -> `main.js` -> `data/*.json`.
- Public map: `map.html` -> `map.js` -> `data/*.json` -> Leaflet markers.
- Community submission/correction: public UI -> `/api/submit-temple` ->
  `functions/api/submit-temple.js` -> D1 `temple_requests`.
- Admin D1 records: `dashboard.html` -> `/api/temples` ->
  `functions/api/temples.js` -> D1 `temples`.
- Admin requests queue: `dashboard.html` -> `/api/temple-requests` ->
  `functions/api/temple-requests.js` -> D1 `temple_requests`.

## Data Model Pointers

- `temples` is the canonical D1 table for imported and admin-managed temple records.
- `temple_requests` is the review queue for submissions, corrections, and deletion
  requests.
- Static JSON is still the fast public data source. D1 updates do not automatically
  rewrite `data/*.json`.
- Cloudflare D1 binding name expected by the code is `DB`.
- If `ADMIN_API_TOKEN` is configured, admin APIs require `x-admin-token` or `?token=`.

## Editing Guidance

- Keep changes scoped; this is a mostly static site without a build step.
- Preserve the existing plain HTML/CSS/vanilla JS style unless the user asks for a
  larger refactor.
- Do not hand-edit generated files in `tmp/d1-import-batches/`; regenerate them with
  `node scripts/d1/import-json-to-d1.mjs` when needed.
- `CLOUDFLARE-DEPLOY.md` contains some older naming examples. Prefer
  `ARCHITECTURE.md` and current source files when they disagree.

