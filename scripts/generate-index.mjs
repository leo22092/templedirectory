/**
 * generate-index.mjs
 * Reads all data/<state>.json files and writes data/index.json —
 * a lightweight index used by the All India search mode.
 *
 * Each record contains only: id, name, state, place, famous
 * (~25 KB gzipped for 3,800+ temples).
 *
 * Run: node scripts/generate-index.mjs
 * Re-run whenever data/*.json changes (or after a D1 publish).
 */

import fs from 'fs';
import path from 'path';

const ROOT  = new URL('..', import.meta.url).pathname;
const DATA  = path.join(ROOT, 'data');
const OUT   = path.join(DATA, 'index.json');

// States to skip (not real state data files)
const SKIP  = new Set(['index']);

const index = [];

const files = fs.readdirSync(DATA)
  .filter(f => f.endsWith('.json') && !SKIP.has(f.replace('.json', '')))
  .sort();

for (const file of files) {
  const stateKey = file.replace('.json', '');
  const raw = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const temples = Array.isArray(raw) ? raw : (raw.temples || []);

  for (const t of temples) {
    if (!t.name) continue;

    // place: use location field (free text address), trim to 80 chars
    const rawPlace = String(t.location || t.Location || '').trim();
    const place    = rawPlace.length > 80 ? rawPlace.slice(0, 77) + '…' : rawPlace;

    const record = {
      id:   t.id ?? t.source_json_id ?? null,
      name: String(t.name || t.Temple || '').trim(),
      state: stateKey,
      place,
    };

    if (t.famous) record.famous = true;

    index.push(record);
  }
}

// Sort: famous first, then alphabetical by name
index.sort((a, b) => {
  if (b.famous && !a.famous) return 1;
  if (a.famous && !b.famous) return -1;
  return (a.name || '').localeCompare(b.name || '');
});

fs.writeFileSync(OUT, JSON.stringify(index), 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✅  data/index.json written — ${index.length} temples, ${kb} KB`);
