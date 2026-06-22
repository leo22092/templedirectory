# TempleDiary — SSG Context (for AI sessions)

## What Was Built
Static Site Generator that pre-renders temple pages so Googlebot sees content immediately.
**Problem solved:** Site was SPA — bots saw 0 temples. Now HTML is pre-rendered.

## Files Added (DO NOT DELETE)
```
scripts/deity-aliases.mjs   — Deity normalization map (208 raw strings → ~80 canonical)
scripts/build-static.mjs    — Main SSG build script (reads data/*.json, writes dist/)
SSG-CONTEXT.md              — This file
```

## Files NOT touched
```
data/*.json         — Read-only. Build script never modifies these.
functions/api/*.js  — Cloudflare Functions untouched. Admin/submit/corrections unaffected.
assets/             — Untouched source. Copied to dist/ during build.
index.html etc.     — Untouched source. Copied to dist/ during build.
```

## Build Output (`dist/` folder)
```
dist/
├── index.html, map.html, assets/, data/  ← copied unchanged from root
├── sitemap.xml                           ← AUTO-GENERATED (592 URLs)
├── _redirects                            ← AUTO-GENERATED (old ?state= → 301 redirects)
├── temples/
│   ├── index.html                        ← All-India directory
│   ├── kerala/index.html                 ← State page
│   ├── kerala/alappuzha/index.html       ← District page
│   └── kerala/deity/lord-shiva/index.html ← State×Deity page
└── deity/
    └── lord-shiva/index.html             ← National deity page
```

## Build Stats (as of 2026-06-22)
- **3,843 temples** across 29 states
- **585 HTML pages** generated
- **592 sitemap URLs**
- 29 state pages, 208 district pages, 224 state×deity pages, 123 national deity pages

## Run the Build
```bash
node scripts/build-static.mjs
```
Deploy the `dist/` folder to Cloudflare Pages.

## Cloudflare Pages Settings (TODO — update in CF dashboard)
```
Build command:    node scripts/build-static.mjs
Output directory: dist
```

## URL Structure
```
/temples/                              ← All-India index
/temples/{state}/                      ← e.g. /temples/kerala/
/temples/{state}/{district}/           ← e.g. /temples/kerala/alappuzha/
/temples/{state}/deity/{deity-slug}/   ← e.g. /temples/kerala/deity/lord-shiva/
/deity/{deity-slug}/                   ← e.g. /deity/lord-murugan/  (all India)
```

## Key Deity Aliases (important ones)
- `Lord Subramanya` + `Lord Murugan` + `Muruga` + `Lord Shanmuga` → **`Lord Murugan`** (174 temples)
- `Goddess Bhagavathy` + `Goddess Bhagavathi` → **`Goddess Bhagavathi`** (484 temples)
- `Lord Shiva` + 30 local forms → **`Lord Shiva`** (712+ temples)
- `Lord Vishnu` + avatar names (except Venkateswara, Narasimha kept separate)

## Phase 2 — Individual Temple Pages (NOT YET BUILT)
- Only generate for temples with `description` field (88% = ~3,405 temples)
- Skip thin community stubs (no description) — they appear on listing pages only
- URL: `/temples/{state}/{district}/{temple-slug}/`
- Content: description, timing, phone, dress code, map embed, nearby temples (Haversine)
- Schema.org: `TouristAttraction` with geo coordinates

## Data Quality Notes
- District field: some records use `district` (lowercase), some `District` — build script handles both
- 208 unique raw deity strings in data → normalized via `deity-aliases.mjs`
- `famous: true` on 491 temples (12%) — good starting set for Phase 2

## Sitemap / Search Console
- Old `sitemap.xml` at root was manually maintained — NOW replaced by auto-generated one in `dist/`
- Submit `https://www.templediary.in/sitemap.xml` to Google Search Console
- Make sure Search Console property is `https://www.templediary.in` (with www)
