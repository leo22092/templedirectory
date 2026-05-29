# TempleDiary Scripts

## Publish D1 Directly To `data/*.json`

Use this when Wrangler is configured locally and you want D1 to be the source of
truth for public JSON publishing.

Dry run first:

```bash
node scripts/export-d1-to-json.mjs
```

Dry run selected states:

```bash
node scripts/export-d1-to-json.mjs --states kerala,sikkim
```

Write changed files after confirmation:

```bash
node scripts/export-d1-to-json.mjs --write
```

Write selected states after confirmation:

```bash
node scripts/export-d1-to-json.mjs --write --states kerala,sikkim
```

Skip the confirmation prompt only when you are sure:

```bash
node scripts/export-d1-to-json.mjs --write --yes
```

Useful options:

```bash
node scripts/export-d1-to-json.mjs --database temple_diary_db
node scripts/export-d1-to-json.mjs --local
node scripts/export-d1-to-json.mjs --remote
node scripts/export-d1-to-json.mjs --out data
```

After writing:

```bash
git diff -- data
git add data/*.json
git commit -m "Publish D1 temple data"
git push
```

The script exports only `verified`, `unverified`, and `needs_review` temples.
Rows with `status = 'removed'` are excluded.

## Split Dashboard D1 Bundle

Use this when you downloaded the all-state bundle from the admin dashboard.

Dry run:

```bash
node scripts/split-d1-export-bundle.mjs templediary-d1-export-YYYY-MM-DD.json
```

Write files:

```bash
node scripts/split-d1-export-bundle.mjs templediary-d1-export-YYYY-MM-DD.json --write
```

Write selected states:

```bash
node scripts/split-d1-export-bundle.mjs templediary-d1-export-YYYY-MM-DD.json --write --states kerala,sikkim
```

Then review and publish:

```bash
git diff -- data
git add data/*.json
git commit -m "Publish D1 temple data"
git push
```
