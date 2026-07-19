# TempleDiary — Full Project History & Decision Log

> This is the authoritative record of *how* this project evolved, *why* decisions were
> made, and *what* changed at each stage. Read this when you need to understand why
> something is the way it is, or why old names/bindings still appear in code.
>
> Newest sections are at the bottom. Each phase is dated from git commits.

---

## Phase 0 — Before This Repo (~pre May 2026)

**Name at that time:** BharatDevasthanam (or earlier prototype)

The project existed as a v10 codebase before being migrated into this repo. The old
README was deleted in the first commits here. What was migrated:

- Public HTML pages: home, about, contact, festivals, map, privacy, terms, login, dashboard
- Multi-state temple JSON datasets for: Kerala, Tamil Nadu, Karnataka, Andhra Pradesh, Goa, Rajasthan
- Map support via `map.html` + `map.js`
- Festival data and festival page
- Favicon / web manifest / state hero images
- `CLOUDFLARE-DEPLOY.md` — written during the BharatDevasthanam era, never renamed

**Key fact:** `CLOUDFLARE-DEPLOY.md` still has "BharatDevasthanam" in its title. It was
written at this phase and carried forward unchanged. That is the source of the stale name.

---

## Phase 1 — Initial Repo Setup (2026-05-19)

**Commits:** `c19f658`, `991f85d`, `d3b5a64`

- Migrated from v10 into this git repo as `dev_templediary`
- Added lazy loading and map cleanup
- Deleted old README, created `CHANGELOG.md`
- Kerala JSON sanity-checked and updated (`fa0b063`)

**Infrastructure:** Pure static site. No server-side anything. Data in `data/*.json`.
No D1. No KV. No Cloudflare Workers/Functions yet.

---

## Phase 2 — KV Submissions (2026-05-21)

**Commits:** `68c4afd`, `59bf6f3`

**What was built:**
- First server-side endpoint: `functions/api/submit-temple.js`
- Cloudflare Pages Functions automatically serve `functions/api/*.js` without any
  Wrangler config
- Submissions were stored in **Cloudflare KV** under binding name `TEMPLE_SUBMISSIONS`
  (or fallback `KV`)
- KV key format: `temple-submission/YYYY-MM-DD/<timestamp>-<uuid>`
- Fallback chain: Worker → KV store → FormSubmit AJAX → `mailto:` link

**Why KV, not D1:**
D1 was not yet part of the plan. KV is simpler — just a key-value store, no schema, no
SQL. It was the fastest way to persist form data without any setup cost.

**KV binding name:** `TEMPLE_SUBMISSIONS`
(Also accepts `KV` as a fallback — you can see this in the GET handler diagnostic at
line 35 of `submit-temple.js`: `env.TEMPLE_SUBMISSIONS ? 'TEMPLE_SUBMISSIONS' : (env.KV ? 'KV' : null)`)

**What this means today:** The KV path still exists as a fallback in `submit-temple.js`.
If `env.DB` is not bound (e.g. local dev without D1), and `env.TEMPLE_SUBMISSIONS` is
set, submissions fall back to KV storage. This is a safety net, not the live path.

**GPS / location capture added** (`59bf6f3`):
- `assets/js/public/submit-location.js` added
- Device GPS detection + reverse geocoding for "at-temple" submissions
- Three submission choices: at-temple (GPS), known temple correction, new temple

---

## Phase 3 — Deep Links (2026-05-22)

**Commit:** `eaf6ad4`

- Added `/add` redirect → `/?add=temple` in `_redirects`
- `?add=temple` query param opens submission modal directly
- Sitemap updated

**Why:** Allows external links (e.g. from About page, from social media) to directly open
the submission flow without navigating manually.

---

## Phase 4 — D1 First Connection (2026-05-23)

**Commit:** `0f17254`

**This is when D1 replaced KV as the primary storage.**

**What changed:**
- Created `schema.sql` with the initial `temples` table
- Created `scripts/d1/import-json-to-d1.mjs` to bulk-import `data/*.json` into D1
- Updated `submit-temple.js` to check `env.DB` first: if D1 is bound, temple requests
  go to D1; if not, fall back to KV

**D1 database name:** `temple_diary_db`
**D1 binding name:** `DB`
(Binding name is what the code uses — `env.DB`. Database name is what's configured in
Cloudflare Pages → Settings → Bindings.)

**Why switch from KV to D1:**
- KV is a dumb key-value store — no querying, no filtering, no listing by state/type
- As soon as "admin needs to review submissions" became a requirement, KV was not usable
- D1 (SQLite) lets you `SELECT * FROM temple_requests WHERE status='pending'` — exactly
  what the admin dashboard needs
- D1 also becomes the canonical record store for approved temples

**Initial `temples` table fields (from schema.sql):**

```
id                 INTEGER PK AUTOINCREMENT
state              TEXT
source_json_id     INTEGER  ← original ID from data/*.json
name               TEXT
deity, district, location, lat, lng
timing, phone, description
famous             INTEGER (0/1)
tags               TEXT
admin_label        TEXT
status             TEXT DEFAULT 'unverified'
submitted_by, submitted_at, approved_at, approved_by
source_url, raw_json
created_at, updated_at
```

**Why `source_json_id`:** When JSON data is imported from `data/*.json`, each temple
already has an `id` field. `source_json_id` preserves that original ID in D1 so that
corrections sent from the public site (which reference the JSON id) can be matched back
to the correct D1 row.

---

## Phase 5 — Two-Table D1 Model (2026-05-24)

**Commits:** `7304aca`, `5e3d0dd`, `98152a9`

**This is the major D1 architecture decision.**

**What changed:**
- Added `temple_requests` table alongside `temples`
- The `temples` table = canonical/verified records
- The `temple_requests` table = community submissions/corrections waiting for review
- Added `scripts/d1/add-request-workflow.sql` — one-time migration to add
  `admin_label` column to existing `temples` rows and create the `temple_requests` table
- Added three API endpoints: `/api/temples`, `/api/temple-states`, `/api/temple-requests`
- Admin dashboard expanded with D1 records view and request queue

**Why two tables instead of one:**
A single `temples` table was considered. The problem: if a community user submits a
correction to temple #4219 and it goes directly into the `temples` row, there is no way
to review it, edit it, or reject it. You'd be writing community input directly to live
canonical data.

The two-table model separates intent:
- `temples` = we trust this data
- `temple_requests` = someone asked for a change; admin hasn't decided yet

**`temple_requests` key fields:**

```
id                   UUID (TEXT PK)
request_type         submission | correction | deletion
status               pending | needs_review | approved | rejected
state                state key
temple_id            matched D1 temples.id (for corrections/deletions)
source_json_id       matched source JSON id (fallback)
payload_json         TEXT — the user's submitted data (editable by admin)
current_db_json      TEXT — snapshot of D1 record at time of request
current_public_json  TEXT — snapshot of public JSON shown to user
decided_by, decided_at, archived_at
```

**Why `payload_json` is TEXT, not columns:** The fields a user submits can vary —
corrections might only change one field, submissions might have all fields. Storing as
a JSON string lets admin edit any combination of fields in the dashboard without
needing an ALTER TABLE for every new field. The downside is you can't query
individual payload fields in SQL — but the admin dashboard doesn't need to do that.

**Why `current_db_json` and `current_public_json` are both stored:**
At approval time, admin sees a three-way comparison:
- What D1 currently has
- What the public website was showing the user
- What the user wants to change it to

These can all be different if D1 was updated after the JSON was last published, or if
the JSON has data D1 doesn't have yet. Storing snapshots at request time avoids having
to reconstruct "what was showing at the time of the request."

**All existing `temples` rows labeled:**
```sql
UPDATE temples SET admin_label = 'COMMUNITY' WHERE admin_label IS NULL OR admin_label = '';
```
This is in `add-request-workflow.sql`. It establishes the convention that all pre-D1
imported records carry the `COMMUNITY` label.

---

## Phase 6 — Dashboard Expansion & More States (2026-05-25 to 2026-05-29)

**Commits:** `47be155`, `93d70df`, `0ad35c7`, `a361947`, `6795a8e`, various `...` / `temp save`

**What changed:**
- Major admin dashboard restructure (multiple iterative commits)
- Added more Indian states to `data/*.json` and `assets/js/core/states.js`:
  Gujarat, Assam, West Bengal, Madhya Pradesh, Maharashtra, Jammu & Kashmir, Odisha
  (previously only Kerala, Tamil Nadu, Karnataka, Andhra Pradesh, Goa, Rajasthan)
- `backstory.txt` added (temple legends and backstories for content)
- Dashboard deleted and rebuilt (`9fcf09e`, then rebuilt in subsequent commits)
- Login page simplified (online token auth removed, client-side token approach kept)
- Bugs fixed: request correction before adding, admin behind Cloudflare

**Note on "temp save" commits:** The messy commit messages (`...`, `temp save`,
`bbc9a78 restructured`) reflect rapid iteration on the dashboard UI during this period.
The actual changes were substantial — the dashboard went through at least 3 structural
rewrites in a week.

---

## Phase 7 — D1 Export & JSON Publishing (2026-06-01)

**Commit:** `c186a51` ("tested pull d1 correct json and push")

**What changed:**
- Confirmed the D1-to-JSON publishing workflow works:
  1. Export D1 data from admin dashboard (all-state bundle)
  2. Run `scripts/split-d1-export-bundle.mjs <bundle.json> --write`
  3. Review `git diff data/`
  4. Commit and push

This established the pattern: **D1 is truth, JSON is the published snapshot**.

---

## Phase 8 — Misc Polish (2026-06-03 to 2026-06-15)

**Commits:** `ac1a62d`, `b1ca013`, `b8847a8`, `8877df2`, `7d34daf`, `ada8482`, `d692165`

- Submit temple button updated
- Weekly commit (regular data/code maintenance)
- Admin map section added (`8877df2`)
- Favicon changed
- Robots.txt and sitemap cleaned up, favicon paths corrected
- v2.50 milestone tagged internally

---

## Phase 9 — SSG Build (2026-06-22)

**Commits:** `a217111` ("feat: SSG build script + search dropdown fix"), `66f56bf`, `d6b39cc`

**This is the biggest architectural addition since D1.**

**Why it was built:**
The site was a SPA-like setup where temple content was rendered client-side from JSON.
Googlebots saw zero temples — just an empty HTML shell. SEO was essentially broken for
the temple listing pages.

**What was built:**
- `scripts/build-static.mjs` — Node.js SSG that reads all `data/*.json` and generates
  pre-rendered HTML pages in `dist/`
- `scripts/deity-aliases.mjs` — maps 208 raw deity name strings to ~80 canonical names
  (e.g. "Lord Subramanya", "Muruga", "Lord Shanmuga" → "Lord Murugan")

**`dist/` output structure:**

```
dist/
├── index.html, map.html, assets/, data/    ← copied unchanged from root
├── sitemap.xml                             ← AUTO-GENERATED (592 URLs)
├── _redirects                              ← AUTO-GENERATED (old ?state= → 301)
├── temples/
│   ├── index.html                          ← All-India directory
│   ├── kerala/index.html                   ← State listing page
│   ├── kerala/alappuzha/index.html         ← District page
│   └── kerala/deity/lord-shiva/index.html  ← State × Deity page
└── deity/
    └── lord-shiva/index.html               ← National deity page
```

**New URL routes introduced:**
```
/temples/                              All-India directory
/temples/{state}/                      State listing
/temples/{state}/{district}/           District listing
/temples/{state}/deity/{deity-slug}/   State × deity listing
/deity/{deity-slug}/                   All-India deity listing
```

**Build stats (as of 2026-06-22):**
- 3,843 temples across 29 states
- 585 HTML pages generated
- 592 sitemap URLs

**Cloudflare Pages deploy change:**
With SSG, the **output directory changed from `/` (root) to `dist/`**. This is what
`CLOUDFLARE-DEPLOY.md` has wrong — it still says `/`.

The build command is: `node scripts/build-static.mjs`

**Search dropdown fix** in the same commit: temple search suggestions now show
as "unverified" before user selects them, improving UX.

**Follow-up commit** `d6b39cc` ("SEO: ruined pages redirect") — some redirect rules
were needed after the SSG changed the URL structure.

---

## Phase 10 — Direct D1 Export Script + GH Action

**Scripts added (exact commit unclear, between Jun–Jul 2026):**
- `scripts/export-d1-to-json.mjs` — direct Wrangler D1 export to `data/*.json`
  (doesn't need the dashboard; runs locally with Wrangler configured)
- `.github/workflows/export-d1-json.yml` — GitHub Action that runs the export daily
  at 00:00 IST and on manual trigger

**Why this third publish path:**
`split-d1-export-bundle.mjs` requires manually downloading a bundle from the admin
dashboard. `export-d1-to-json.mjs` uses `wrangler d1 export` directly — no browser
required, scriptable, automatable.

The GitHub Action automates the whole thing: query D1 → write `data/*.json` → validate
JSON → commit if changed.

**Required GitHub secrets:**
```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

**Optional variable:**
```
TEMPLE_D1_DATABASE=temple_diary_db
```

---

## Current State (2026-07-19)

### Storage summary

| Store | Binding | Used for |
|---|---|---|
| D1 `temple_diary_db` | `DB` | Canonical temple records (`temples`), review queue (`temple_requests`) |
| Cloudflare KV | `TEMPLE_SUBMISSIONS` or `KV` | Fallback only — if D1 is not bound, contact/general form submissions go here |
| Static JSON `data/*.json` | n/a | Public visitor data source, published from D1 |

**The KV binding is NOT required for the site to work** — it only activates as a
fallback when `env.DB` is absent. In production, D1 is always bound. KV may not even
be set up in Cloudflare anymore.

### Three D1-to-JSON publish paths

| Path | When to use |
|---|---|
| Dashboard export → `split-d1-export-bundle.mjs` | No Wrangler locally; manual one-time publish |
| `export-d1-to-json.mjs --write` | Wrangler configured locally; developer machine |
| GitHub Action `export-d1-json.yml` | Automated daily; no manual steps needed |

### File name evolution

| Old name / reference | Current name | Where the old name still appears |
|---|---|---|
| BharatDevasthanam | TempleDiary | `CLOUDFLARE-DEPLOY.md` title |
| KV primary storage | D1 primary storage | `CLOUDFLARE-DEPLOY.md` (still describes KV) |
| Root `/` output dir | `dist/` output dir | `CLOUDFLARE-DEPLOY.md` (still says `/`) |
| `temple_verifications` table | Removed / never created | `ARCHITECTURE.md` mentions it was dropped |

---

## Document Health (as of 2026-07-19)

| File | Accurate? | Notes |
|---|---|---|
| `AGENTS.md` | ✅ | Updated 2026-07-19 |
| `.agents/CHANGELOG.md` | ✅ | Created 2026-07-19 |
| `.agents/DEVELOPER_MANUAL.md` | ⚠️ | Needs SSG + export-d1-to-json section |
| `.agents/PROJECT_HISTORY.md` | ✅ | This file |
| `PROJECT_MAP.md` | ⚠️ | Missing SSG layer, new scripts, GH Action |
| `ARCHITECTURE.md` | ⚠️ | Missing SSG, 3rd/4th publish paths; has raw NOTES block at bottom |
| `SSG-CONTEXT.md` | ✅ | Accurate; not referenced by main docs |
| `CLOUDFLARE-DEPLOY.md` | 🔴 | Wrong name, wrong storage model, wrong output dir |
| `CHANGELOG.md` | ⚠️ | Accurate up to 2026-05-25; missing SSG entry |
| `New Document.txt` | 🔴 | Orphan scratch file; should be deleted |

