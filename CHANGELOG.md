# TempleDiary Changelog

All notable project changes are summarized here from the Git history.

## Unreleased - 2026-05-25

- Changed the home page flow so search, district chips, filters, and temple cards appear before the map and submit sections.
- Added a hero search suggestion dropdown; selecting a temple opens its detail card directly.
- Fixed hero search clearing so erasing the query immediately restores the full result list without pressing Search again.
- Removed the redundant broad correction button from the submit section; corrections remain available from temple detail cards.
- Fixed About page "Submit a temple" links to open the existing form flow via `index.html?add=temple`.
- Standardized favicon and web manifest links across secondary pages.
- Updated the map page title branding.

## v14 / Admin + D1 Completion - 2026-05-24

- Added `ARCHITECTURE.md` documenting the public listing, submission, correction, D1, and admin workflows.
- Expanded the admin dashboard for D1-backed request and temple management.
- Added the `/api/temple-requests` workflow for reviewing pending submissions, corrections, and deletion requests.
- Extended `main.js` correction handling so public detail cards can submit structured correction/deletion requests.
- Minor follow-up edit to the `/api/temples` endpoint.

Commits: `98152a9`, `5e3d0dd`

## v13 / Request Workflow Tables - 2026-05-24

- Added two-table D1 workflow for canonical temple data and community requests.
- Added `temples` and `temple_requests` API endpoints.
- Extended `/api/submit-temple` to save structured submission and correction payloads.
- Added dashboard views for request review.
- Added SQL migration support in `schema.sql` and `scripts/d1/add-request-workflow.sql`.
- Updated the D1 import script for the request workflow.

Commit: `7304aca`

## v14-D1-first - 2026-05-23

- Added first D1 database connection support.
- Created `schema.sql` and the D1 JSON import script.
- Updated `/api/submit-temple` to work with D1-backed persistence.
- Updated public submission flow to include D1-related metadata.
- Added `.gitignore`.

Commit: `0f17254`

## v13-before-D1 / Data Cleanup - 2026-05-23

- Added Malabar Devaswom data into `data/kerala.json`.
- Removed older root-level and script-generated state data files that had been superseded by `data/*.json`.
- Cleaned up obsolete Tamil Nadu data-building scripts.

Commit: `d7fc1e1`

## Add Deep Link - 2026-05-22

- Added `/add` redirect support.
- Added submit-form deep-link handling so `/add` or `?add=temple` opens the at-temple submission flow.
- Updated sitemap with the add route.
- Improved GPS submit helper integration.

Commit: `eaf6ad4`

## v12 / Location Taker - 2026-05-21

- Added three submit choices for temple contribution flows.
- Added device GPS detection support for at-temple submissions.
- Added `submit-location.js` for location capture and reverse geocoding.
- Updated submit modal styling and interaction.

Commit: `59bf6f3`

## v11 / Workers - 2026-05-21

- Added Cloudflare Worker submission endpoint at `/api/submit-temple`.
- Added Worker-first form handling with FormSubmit and email fallback.
- Updated contact and temple submission flows to use the Worker path.
- Expanded Cloudflare deployment notes.

Commit: `68c4afd`

## Kerala Data Sanity Check - 2026-05-19

- Updated Kerala temple data after sanity checking.
- Adjusted `main.js` to match the revised Kerala data structure.

Commit: `fa0b063`

## Docs Cleanup - 2026-05-19

- Removed the old README.
- Created the initial changelog for v10.

Commits: `d3b5a64`, `991f85d`

## v10 / Lazyload & Map Update - 2026-05-19

- Migrated the initial TempleDiary setup.
- Added public pages: home, about, contact, festivals, map, privacy, terms, login, and dashboard.
- Added multi-state temple JSON datasets for Kerala, Tamil Nadu, Karnataka, Andhra Pradesh, Goa, and Rajasthan.
- Added map support through `map.html` and `map.js`.
- Added festival data and festival page.
- Added favicon/web manifest assets and state hero images.
- Added Cloudflare deployment documentation, robots file, sitemap, and base styling.
- Added lazy loading and map cleanup as part of the v10 baseline.
- Included Rajasthan temple coverage in the initial migrated data.

Commit: `c19f658`
