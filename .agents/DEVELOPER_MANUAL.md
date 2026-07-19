# TempleDiary – Developer Manual

> **Audience:** Human developers and AI agents making changes to this project.
> Read `.agents/CHANGELOG.md` first to see what has recently changed, then use this
> manual to understand _why_ the project is shaped the way it is.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Tech Stack & Hosting](#2-tech-stack--hosting)
3. [Directory Structure](#3-directory-structure)
4. [Route Reference (all URLs)](#4-route-reference-all-urls)
5. [API Endpoint Reference](#5-api-endpoint-reference)
6. [Data Architecture & Decision Log](#6-data-architecture--decision-log)
7. [Database Schema Decisions](#7-database-schema-decisions)
8. [Frontend Conventions](#8-frontend-conventions)
9. [Common Task Playbooks](#9-common-task-playbooks)
10. [Agent Working Rules](#10-agent-working-rules)
11. [Open Questions / Future Work](#11-open-questions--future-work)

---

## 1. Project Identity

**TempleDiary** is a community-maintained Hindu temple directory for India. Its goals are:

- Let anyone browse temples by state via a fast static listing and map.
- Let community members submit new temples, suggest corrections, or flag removals.
- Let admin(s) review, edit, and approve community requests before they become canonical.
- Serve at near-zero cost using Cloudflare Pages static hosting + D1 (SQLite) for admin
  state.

The site is **not** a full-stack SPA. It is intentionally a _static-first_ site with a
thin serverless backend (Cloudflare Pages Functions) for the dynamic parts.

---

## 2. Tech Stack & Hosting

| Layer | Technology | Why |
|---|---|---|
| Hosting | Cloudflare Pages | Free tier, global CDN, zero cold-starts for static, tight D1 integration |
| Database | Cloudflare D1 (SQLite) | Serverless SQLite, binding name `DB`, no separate DB infra to manage |
| API | Cloudflare Pages Functions (`functions/api/*.js`) | Co-deployed with Pages, auto-routed, no Wrangler config needed for basic use |
| Public data | Static JSON (`data/*.json`) | Cheap, CDN-cacheable, no DB hit for public visitors |
| Map | Leaflet.js (CDN) | Lightweight, open-source, no API key required |
| Styling | Vanilla CSS (`assets/css/style.css`) | No build step, no framework lock-in |
| Frontend JS | Vanilla JS modules | No bundler, no framework — pages load as plain HTML + scripts |
| Auth | `ADMIN_API_TOKEN` env var checked by Functions | Simple enough for a one-admin project; JWT can replace later |

### Why no React / Next.js / Vite?

The site started as a plain HTML prototype. Given that it serves static temple listings,
a full JS framework would add build complexity for no real benefit. If the public frontend
ever needs client-side routing or component reuse at scale, migration to Vite + Vue or
React could be considered — but not until then.

---

## 3. Directory Structure

```
/                              ← repo root = Cloudflare Pages publish dir
├── index.html                 ← Homepage (temple listing)
├── map.html                   ← Interactive map
├── festivals.html             ← Festivals calendar
├── about.html                 ← About page
├── contact.html               ← Contact / feedback
├── dashboard.html             ← Admin dashboard (behind token)
├── login.html                 ← Admin login (UI only, token sent client-side)
├── privacy.html               ← Privacy policy
├── terms.html                 ← Terms of service
│
├── assets/
│   ├── css/
│   │   └── style.css          ← ALL shared styling; one file by design
│   ├── js/
│   │   ├── core/
│   │   │   └── states.js      ← Shared state config (tabs, hero images, map views)
│   │   ├── public/
│   │   │   ├── main.js        ← Homepage logic (cards, search, filters, modals)
│   │   │   ├── map.js         ← Map logic (Leaflet, markers, filter)
│   │   │   ├── submit-location.js  ← GPS + submission helper
│   │   │   └── festivals-data.js   ← Festival data
│   │   └── admin/
│   │       └── dashboard.js   ← Admin dashboard logic
│   └── images/                ← Hero images, favicons, icons
│
├── data/
│   └── *.json                 ← One file per state, e.g. kerala.json
│                                 Shape: { temples: [...], lastUpdated: "..." }
│
├── functions/
│   └── api/
│       ├── submit-temple.js   ← POST /api/submit-temple (public submissions)
│       ├── temples.js         ← GET/POST /api/temples (admin D1 records)
│       ├── temple-states.js   ← GET /api/temple-states (state discovery)
│       ├── temple-requests.js ← GET/POST /api/temple-requests (admin queue)
│       └── public-submissions.js ← (supplementary public endpoint)
│
├── scripts/
│   ├── d1/
│   │   ├── import-json-to-d1.mjs        ← Generates SQL batches from data/*.json
│   │   └── add-request-workflow.sql     ← One-time D1 migration for temple_requests
│   └── split-d1-export-bundle.mjs       ← Splits D1 export bundle → data/*.json
│
├── schema.sql                 ← D1 table definitions (source of truth for schema)
├── _redirects                 ← Cloudflare Pages redirect rules
├── robots.txt                 ← Search engine directives
├── AGENTS.md                  ← Agent reading order & project shape
├── PROJECT_MAP.md             ← Compact flowcharts for AI sessions
├── ARCHITECTURE.md            ← Deep system notes, D1 tables, API flows
├── CHANGELOG.md               ← Public-facing project changelog
└── .agents/
    ├── CHANGELOG.md           ← This agent/dev change log (you are here)
    └── DEVELOPER_MANUAL.md    ← This file
```

### Why one `style.css`?

All public pages share the same visual language. Splitting into per-page CSS would create
drift. If the codebase grows to 20+ pages, consider CSS custom properties / layers, but
keep the single-file discipline for now.

### Why `assets/js/core/` vs `public/` vs `admin/`?

| Folder | Contains | Loaded by |
|---|---|---|
| `core/` | Shared config only (no DOM manipulation) | Both public pages and dashboard |
| `public/` | Public visitor UI code | `index.html`, `map.html`, etc. |
| `admin/` | Admin-only UI code | `dashboard.html` only |

This keeps admin logic out of public bundles and shared config out of page-specific files.

---

## 4. Route Reference (all URLs)

### Public Pages

| URL | File | Purpose |
|---|---|---|
| `/` | `index.html` | Temple listing by state, search, filters, cards, modals |
| `/map` | `map.html` | Leaflet map with all temples as markers |
| `/festivals` | `festivals.html` | Hindu festival calendar |
| `/about` | `about.html` | Project description |
| `/contact` | `contact.html` | Feedback / contact form |
| `/privacy` | `privacy.html` | Privacy policy |
| `/terms` | `terms.html` | Terms of service |

### Auth / Admin Pages

| URL | File | Purpose |
|---|---|---|
| `/login` | `login.html` | Admin login (client-side token entry) |
| `/dashboard` | `dashboard.html` | Full admin dashboard |

### Deep Links / Query Params

| URL pattern | Behavior |
|---|---|
| `/?add=temple` | Opens the "submit a temple" modal directly |
| `/add` | Redirected to `/?add=temple` via `_redirects` |

---

## 5. API Endpoint Reference

All endpoints live under `/api/` and are served by `functions/api/*.js` via Cloudflare
Pages Functions. The D1 binding name is `DB`.

### Auth model

If the environment variable `ADMIN_API_TOKEN` is set, write endpoints and admin read
endpoints require one of:
- HTTP header: `x-admin-token: <token>`
- Query param: `?token=<token>`

Public read endpoints (e.g. listing templates for public visitors) do **not** require auth.

---

### `GET /api/temples`

Returns D1 temple records for a state.

**Query params:**

| Param | Values | Default | Notes |
|---|---|---|---|
| `state` | `kerala`, `tamil-nadu`, etc. | — | Required |
| `include` | `public` \| `all` | `public` | `public` = verified+unverified; `all` = + needs_review+removed |

**Response:** `{ temples: [...] }`

**File:** `functions/api/temples.js`

---

### `POST /api/temples`

Update an existing temple record in D1. Admin auth required.

**Body fields:** `id`, and any field to update (`name`, `deity`, `status`, `admin_label`, etc.)

**File:** `functions/api/temples.js`

---

### `GET /api/temple-states`

Returns list of states present in D1 `temples` table with record counts.

**Response:** `{ states: [{ state, count }] }`

**File:** `functions/api/temple-states.js`

**Why this exists:** The admin dashboard needs to know which states have D1 data. Rather
than hardcoding the state list, it queries D1 dynamically and merges with the static
display metadata from `assets/js/core/states.js`.

---

### `POST /api/submit-temple`

Accepts public community submissions, corrections, and deletion requests.

**Body fields (form-encoded or JSON):**

| Field | Required | Notes |
|---|---|---|
| `kind` | Yes | `temple-submission` \| `temple-correction` \| `temple-deletion` |
| `State` | Yes | State key (e.g. `kerala`) |
| `Temple` | Yes | Temple name |
| `Submitted By` | Yes | Submitter name |
| `Submitter Email` | No | Optional contact |
| `Source JSON ID` | Correction/Deletion | ID of the temple in `data/*.json` |
| `Current Public JSON` | Correction | JSON snapshot of the temple as shown to user |

**File:** `functions/api/submit-temple.js`

**Why it stores snapshots:** When a correction arrives, the function looks up the matching
D1 record and stores three versions: `payload_json` (what user submitted),
`current_db_json` (current D1 record), and `current_public_json` (what was shown to user).
This gives admin a three-way diff view without having to re-query.

---

### `GET /api/temple-requests`

Returns community request queue rows for admin review.

**Query params:**

| Param | Values |
|---|---|
| `state` | state key |
| `type` | `submission` \| `correction` \| `deletion` |
| `status` | `pending` \| `needs_review` \| `approved` \| `rejected` |
| `limit` | integer (default 100) |

**File:** `functions/api/temple-requests.js`

---

### `POST /api/temple-requests`

Performs admin actions on request queue rows. Admin auth required.

**Actions:**

| Action | Effect |
|---|---|
| `update` | Save edited `payload_json` / `admin_label` without deciding |
| `approve` | For submissions: INSERT into `temples`. For corrections: UPDATE `temples`. For deletions: SET `status='removed'` on `temples`. |
| `needs_review` | Flag request for later |
| `reject` | Archive as rejected |

**File:** `functions/api/temple-requests.js`

---

## 6. Data Architecture & Decision Log

### Decision: Static JSON as primary public data source

**Context:** Public visitors browse temples. We want this to be fast and cheap.

**Decision:** Serve temple listings from `data/<state>.json` static files cached on
Cloudflare's CDN. Do **not** hit D1 for every public page view.

**Trade-off:** D1 changes are not automatically reflected on the public site. A publish
step is required:
```
Dashboard export → split-d1-export-bundle.mjs → data/*.json → git commit → deploy
```

**Alternative considered:** Serve public data from `/api/temples` with edge caching. This
would eliminate the publish step but adds latency and function invocation cost. Revisit
if the publish workflow becomes too painful.

---

### Decision: D1 for admin and canonical data

**Context:** We need a place to store community requests before review, and canonical
records after admin verification.

**Decision:** Use Cloudflare D1 (SQLite) via the `DB` binding. It is free for small usage,
co-located with the Pages deployment, and no separate database service is needed.

---

### Decision: Two-table D1 model (`temples` + `temple_requests`)

**Context:** Community requests need to be reviewed before becoming canonical. Admins need
to be able to edit the submitted data before approving.

**Decision:**
- `temples` = canonical records (imported + admin-verified + approved community submissions)
- `temple_requests` = review queue (pending submissions, corrections, deletions)

Approval copies/merges from `temple_requests` into `temples`. Rejected requests stay in
`temple_requests` for audit.

---

### Decision: Admin-only token auth (no user accounts)

**Context:** The site has one or a few admins. A full user auth system is overkill.

**Decision:** A single `ADMIN_API_TOKEN` env var. The dashboard sends it in headers. If
the token is not set, admin endpoints are still accessible (useful for local dev).

**Trade-off:** Anyone who knows the token can perform admin actions. This is acceptable
for a single-admin project. If multiple admins with different roles are needed, migrate
to JWT or Cloudflare Access.

---

### Decision: No build step

**Context:** The site is plain HTML + vanilla JS. Adding a bundler (Webpack, Vite, etc.)
would require a `package.json`, build commands, and a more complex deployment.

**Decision:** Skip the build step entirely. Pages are HTML files at repo root. Scripts are
`<script src="...">` tags. CSS is one file.

**Trade-off:** No tree-shaking, no TypeScript, no module bundling. If the codebase grows
significantly, revisit.

---

## 7. Database Schema Decisions

See `schema.sql` for the authoritative schema. Key decisions:

### `temples.source_json_id`
Stores the original ID from `data/*.json`. Allows the correction workflow to match an
incoming correction to its D1 record even before a D1-native `id` was assigned.

### `temples.admin_label`
A free-text label typed by admin. Not an enum, because admin may want custom labels.
Standard values are documented in `ARCHITECTURE.md` but not enforced by the DB.

### `temples.status` enum
`verified | unverified | removed | needs_review` — enforced by application logic, not
by a DB constraint, since D1/SQLite doesn't support enum types. Be careful when adding
new statuses.

### `temple_requests.payload_json`
Stored as a JSON string (TEXT column). This allows the admin to edit the payload in the
dashboard before approving, without needing extra columns per field.

### No hard deletes
Deletion requests result in `status='removed'`, not `DELETE FROM temples`. This preserves
audit history. The only exception would be a GDPR erasure request from a submitter.

---

## 8. Frontend Conventions

### State config is the single source of truth

`assets/js/core/states.js` exports the list of states with display name, slug, data file
path, hero image, map center, and other metadata. **All** of the following read from it:
- Homepage state tabs
- Map state selector
- Dashboard state list
- Import/export scripts

If you add a new state, update `states.js` first, then add `data/<state>.json`.

### No inline styles

All styling goes in `assets/css/style.css`. No `style=""` attributes on elements unless
absolutely required for dynamic values (e.g. map marker positioning).

### Event delegation over per-element listeners

For dynamically rendered cards and list items (e.g. temple cards), use event delegation
(attach listener to a parent container, check `event.target` inside) to avoid memory
leaks from removing/re-adding many listeners on filter changes.

### Error handling in Functions

All `functions/api/*.js` files should:
1. Wrap handler body in try/catch
2. Return JSON error responses with appropriate HTTP status codes
3. Never expose stack traces to the client

---

## 9. Common Task Playbooks

### Add a new Indian state

1. Add state metadata to `assets/js/core/states.js` (slug, display name, data file, hero image, map center).
2. Create `data/<state-slug>.json` with the temple array: `{ "temples": [...], "lastUpdated": "YYYY-MM-DD" }`.
3. Add a hero image to `assets/images/` if needed.
4. Run `node scripts/d1/import-json-to-d1.mjs` to generate D1 import SQL batches.
5. Apply the SQL batches to D1 via Wrangler or the Cloudflare dashboard.
6. Commit and push → auto-deploy.

### Approve a community submission

1. Go to `/dashboard` → Requests tab.
2. Filter by `type=submission`, `status=pending`.
3. Review the submission. Edit `payload_json` if needed.
4. Click Approve → inserts a new `temples` row with `admin_label='COMMUNITY SUBMITTED'`.
5. To publish: export D1 all-state bundle from dashboard, run `node scripts/split-d1-export-bundle.mjs <bundle.json> --write`, review `git diff data/`, commit and push.

### Merge a correction

1. Go to `/dashboard` → Requests tab.
2. Filter by `type=correction`, `status=pending`.
3. Review the three-way diff (Current DB | Public JSON | Submitted Correction).
4. Edit `payload_json` if needed.
5. Click Merge → updates the matching `temples` row.
6. Publish (same flow as above).

### Run the D1 import from scratch (re-import all JSON data)

```bash
node scripts/d1/import-json-to-d1.mjs
# generates tmp/d1-import-batches/*.sql

# Apply each batch via wrangler:
wrangler d1 execute temple_diary_db --file=tmp/d1-import-batches/kerala.sql
# ... repeat for each state
```

### Publish D1 export to public JSON

```bash
# In dashboard: Export → Download all-state bundle
node scripts/split-d1-export-bundle.mjs <downloaded-bundle.json> --write
git diff data/
git add data/
git commit -m "Publish D1 export to public JSON [date]"
git push origin main
```

---

## 10. Agent Working Rules

These rules apply to any AI agent (Antigravity, Codex, or future agents) making changes.

1. **Read before writing.** Read `AGENTS.md`, `PROJECT_MAP.md`, then the specific file you need. Do not scan all files.
2. **Log every session.** Before ending any session where you made file changes, add an entry to `.agents/CHANGELOG.md` with actor, date, files changed, motivation, and bullet list of changes.
3. **Stay scoped.** Only touch files needed for the task. This is a static site — no build step means no side effects to check.
4. **Prefer `assets/js/` over root-level JS.** New scripts go under `assets/js/public/`, `assets/js/admin/`, or `assets/js/core/` per the conventions above.
5. **Preserve `states.js` as single source of truth.** Don't hardcode state lists anywhere else.
6. **Don't hand-edit `tmp/d1-import-batches/`.** Regenerate with the script.
7. **Don't hard-delete D1 rows.** Use `status='removed'`.
8. **Don't add a build step without explicit user request.** The no-build-step decision is intentional.
9. **Update this manual when conventions change.** If you establish a new convention, document it here.
10. **Test locally when possible.** Use `wrangler pages dev .` to test Functions locally before committing.

---

## 11. Open Questions / Future Work

| Topic | Status | Notes |
|---|---|---|
| Switch public data source from JSON to `/api/temples` | Future option | Would eliminate publish step; adds function cost |
| Multi-admin support with roles | Not planned | Current single-token auth is sufficient |
| Full-text search | Not implemented | Browser-side filter on loaded JSON currently covers basic search |
| Pagination for large states | Not implemented | Kerala JSON is large; consider virtual scroll or server-side pagination |
| SEO / SSG | Partial | Static HTML pages have meta tags; temple detail pages are not individually indexed |
| Email notifications for submissions | Not implemented | Could use Cloudflare Email Workers |
| Rate limiting on `/api/submit-temple` | Not implemented | Could use Cloudflare Rate Limiting rules |
| Automated D1→JSON publish CI | Not implemented | A GitHub Action could run the split script after approved requests pass a threshold |

---

_Last updated: 2026-07-19 by Antigravity_
