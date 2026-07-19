# Agent & Developer Changelog

This file tracks **all meaningful changes** made to the TempleDiary project by either
AI agents (Antigravity, Codex, etc.) or human developers. Every entry must include the
actor, date, and a clear description of _what_ changed and _why_.

---

## Format

```
## [YYYY-MM-DD] – <Short title>
**Actor:** Human / Antigravity / Codex / etc.
**Files Changed:** list of files
**Why:** motivation / issue / request
**What:**
- bullet list of changes
```

---

## [2026-07-19] – All India Search Mode & Submit Form State Dropdown
**Actor:** Antigravity (AI Agent)
**Files Changed:**
- `scripts/generate-index.mjs` (created)
- `data/index.json` (generated)
- `assets/js/core/states.js` (added `all-india` state, made it default)
- `assets/js/public/main.js` (All India logic, submit modal `<select>`)

**Why:**
- The site previously loaded Kerala by default (2.3 MB), which was slow and forced a state on the user.
- Loading all states on landing would be 3.3+ MB.
- When submitting a temple from the "All India" view (or if someone didn't realize they were in a specific state tab), the form silently submitted under whatever `activeState` was currently selected, causing miscategorized data.

**What:**
- Built `generate-index.mjs` to distill 3,843 temples down to just `id, name, state, place, famous` in `data/index.json` (~400 KB uncompressed, ~80 KB gzipped).
- Set `all-india` as the default landing view.
- In All India mode, the directory grid and district filters are hidden. The user is presented with the hero search.
- Typing in hero search queries the lightweight `index.json`.
- Suggestions are formatted as **"Temple Name"** over **"Place · State"**.
- Clicking a suggestion navigates to that state's dataset and auto-opens the full temple modal with timings, description, etc.
- Added a mandatory `<select id="sf-state">` to the submit modal so users must explicitly choose which state they are submitting to, fixing the silent miscategorization bug.

## [2026-07-19] – Full documentation cleanup + PROJECT_HISTORY created
**Actor:** Antigravity (AI Agent)
**Files Changed:**
- `.agents/PROJECT_HISTORY.md` (created)
- `CLOUDFLARE-DEPLOY.md` (rewritten)
- `ARCHITECTURE.md` (cleaned up raw NOTES block → formatted SSG + publish sections)
- `PROJECT_MAP.md` (added SSG layer, dist/, GH Action, export-d1-to-json.mjs)
- `AGENTS.md` (updated read order: added PROJECT_HISTORY.md, SSG-CONTEXT.md, 3 publish paths)
- `CHANGELOG.md` (added missing SSG entry for 2026-06-22; added 2026-07-19 doc entry)

**Why:** Full audit revealed several docs were out of sync. `CLOUDFLARE-DEPLOY.md` had
the old project name "BharatDevasthanam", described KV as the storage model (now D1),
and said output dir is `/` (now `dist/`). `PROJECT_MAP.md` and `ARCHITECTURE.md` had
no mention of the SSG build layer added in June 2026. `New Document.txt` was an orphan
scratch file (already absent from disk). `CHANGELOG.md` had no entry for the SSG work.

**What:**
- Created `.agents/PROJECT_HISTORY.md` — comprehensive 10-phase evolution story from
  BharatDevasthanam prototype → KV submissions → D1 single table → D1 two-table model →
  SSG build + GH Action, with dates, reasoning for each decision, and field-level
  explanations for why D1 schema looks the way it does.
- Rewrote `CLOUDFLARE-DEPLOY.md` to be accurate: correct name, D1 bindings, `dist/`
  output dir, 3 publish paths, env vars table.
- Replaced raw `======NOTES======` block in `ARCHITECTURE.md` with formatted SSG section
  and all three D1-to-JSON publish option docs.
- Updated `PROJECT_MAP.md` flowchart with SSG subgraph, D1-publish subgraph, new file
  ownership rows, updated architecture summary.
- Updated `AGENTS.md` read order to include `PROJECT_HISTORY.md` (step 4) and
  `SSG-CONTEXT.md` (step 7); updated Project Shape to list all three publish paths and
  the SSG build/output.
- Added missing SSG Build entry (2026-06-22) and doc cleanup entry (2026-07-19) to
  public `CHANGELOG.md`.

---

## [2026-07-19] – Add .agents/ tracking layer and Developer Manual
**Actor:** Antigravity (AI Agent)
**Files Changed:**
- `.agents/CHANGELOG.md` (created)
- `.agents/DEVELOPER_MANUAL.md` (created)

**Why:** User requested a structured agent changelog and a developer manual to document
project routes, architecture decisions, and coding conventions for future humans and AI
agents working on this codebase.

**What:**
- Created `.agents/CHANGELOG.md` (this file) as the authoritative per-session change
  log for agent and developer actions, separate from the public-facing `CHANGELOG.md`.
- Created `.agents/DEVELOPER_MANUAL.md` with full route reference, project structure
  rationale, data-flow decisions, coding conventions, and common task playbooks.

---

<!-- Add new entries above this line, newest first -->
