# Cloudflare Deployment — TempleDiary

> **Note:** This document was originally written when the project was called
> "BharatDevasthanam" and used KV for submissions. Both of those are outdated.
> For accurate deployment information see:
>
> - `.agents/DEVELOPER_MANUAL.md` → Section 2 (Tech Stack) and Section 9 (Playbooks)
> - `.agents/PROJECT_HISTORY.md` → Full evolution and why decisions were made
> - `scripts/README.md` → D1-to-JSON publish options

---

## Current Deployment Model

| Setting | Value |
|---|---|
| Platform | Cloudflare Pages |
| GitHub repo → auto deploy on push to `main` |
| Build command | `node scripts/build-static.mjs` |
| Output directory | `dist` |
| Functions directory | `functions/` (auto-detected by Pages) |

**Do not use output directory `/` (root).** The SSG writes to `dist/`. Pages must
be configured to serve from `dist/`.

---

## Required Bindings (Cloudflare Pages → Settings → Bindings)

| Variable | Type | Name in Cloudflare | Notes |
|---|---|---|---|
| `DB` | D1 Database | `temple_diary_db` | Required — canonical temple records + request queue |
| `ADMIN_API_TOKEN` | Environment Variable | — | Optional — if set, admin APIs require this token |

**KV is not required.** It is a fallback only (see `PROJECT_HISTORY.md` Phase 2). In
production, D1 handles all submissions.

---

## Quick Deploy

```bash
git add .
git commit -m "describe your change"
git push origin main
```

Cloudflare Pages auto-deploys in ~30–60 seconds.

---

## Adding a New State

1. Add state metadata to `assets/js/core/states.js`
2. Add `data/<state-slug>.json`
3. Add hero image to `assets/images/` if available
4. Run `node scripts/d1/import-json-to-d1.mjs` → apply SQL batches to D1
5. Run `node scripts/build-static.mjs` (or let CI do it on push)
6. Commit and push

---

## Publishing D1 Data to Public JSON

See `scripts/README.md` for all three options:
- Dashboard export + `split-d1-export-bundle.mjs`
- Direct Wrangler export with `export-d1-to-json.mjs`
- GitHub Action (automated daily)

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `ADMIN_API_TOKEN` | Protects admin API endpoints | No (dev-only is fine without) |
| `RESEND_API_KEY` | Email notification on submission | No |
| `SUBMISSION_TO_EMAIL` | Destination inbox | No |
| `SUBMISSION_FROM_EMAIL` | Verified sender for Resend | No |
| `FORM_SUBMIT_EMAIL` | FormSubmit fallback | No |
