#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const database = readOption('--database') || process.env.TEMPLE_D1_DATABASE || 'temple_diary_db';
const outDir = readOption('--out') || 'data';
const write = args.includes('--write');
const yes = args.includes('--yes');
const local = args.includes('--local');
const remote = args.includes('--remote') || !local;
const onlyStates = readOption('--states')
  ?.split(',')
  .map(cleanStateKey)
  .filter(Boolean);

const FIELD_ORDER = [
  'id',
  'name',
  'deity',
  'district',
  'location',
  'lat',
  'lng',
  'timing',
  'phone',
  'description',
  'famous',
  'status',
  'adminLabel',
  'tags',
  'dressCode',
  'photography',
  'nearestBus',
  'nearestRail',
  'famousFor',
  'sourceUrl',
];

if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const outputRoot = resolve(repoRoot, outDir);
const sql = `
  SELECT
    id,
    source_json_id,
    state,
    name,
    deity,
    district,
    location,
    lat,
    lng,
    timing,
    phone,
    description,
    famous,
    tags,
    admin_label,
    status,
    source_url,
    raw_json
  FROM temples
  WHERE status IN ('verified', 'unverified', 'needs_review')
    ${onlyStates?.length ? `AND state IN (${onlyStates.map(sqlString).join(', ')})` : ''}
  ORDER BY state COLLATE NOCASE ASC, district COLLATE NOCASE ASC, name COLLATE NOCASE ASC
`;

const rows = await queryD1(sql);
const grouped = groupByState(rows);
const outputs = Object.entries(grouped).map(([state, temples]) => {
  const normalized = {
    _defaults: readExistingDefaults(state),
    temples: temples.map(d1RowToPublicJson),
  };
  const json = JSON.stringify(normalized, null, 2) + '\n';
  const path = join(outputRoot, `${state}.json`);
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : '';
  return {
    state,
    path,
    json,
    count: normalized.temples.length,
    changed: previous !== json,
    exists: Boolean(previous),
  };
});

if (!outputs.length) {
  console.log('No matching D1 temples found for export.');
  process.exit(0);
}

const changed = outputs.filter((out) => out.changed);
console.log(`D1 export from ${remote ? 'remote' : 'local'} database "${database}"`);
console.log(`${outputs.length} state file(s), ${changed.length} changed.`);
outputs.forEach((out) => {
  const marker = out.changed ? (out.exists ? 'changed' : 'new') : 'unchanged';
  console.log(`- ${relative(out.path)} (${out.count} temples, ${marker})`);
});

if (!write) {
  console.log('\nDry run only. Run again with --write to update data files.');
  process.exit(0);
}

if (!changed.length) {
  console.log('\nNo data files need updating.');
  process.exit(0);
}

if (!yes) {
  const rl = createInterface({ input, output });
  const answer = await rl.question(`\nWrite ${changed.length} changed file(s) to ${relative(outputRoot)}? Type "yes" to continue: `);
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('No files written.');
    process.exit(0);
  }
}

mkdirSync(outputRoot, { recursive: true });
changed.forEach((out) => {
  writeFileSync(out.path, out.json);
  console.log(`Wrote ${relative(out.path)} (${out.count} temples)`);
});

async function queryD1(command) {
  const wranglerArgs = [
    'wrangler',
    'd1',
    'execute',
    database,
    remote ? '--remote' : '--local',
    '--json',
    '--command',
    command,
  ];

  let stdout;
  try {
    ({ stdout } = await execFileAsync('npx', wranglerArgs, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 50,
    }));
  } catch (err) {
    const details = err.stderr || err.stdout || err.message;
    throw new Error(`Wrangler D1 query failed:\n${details}`);
  }

  const parsed = JSON.parse(stdout);
  const result = Array.isArray(parsed) ? parsed[0] : parsed.result?.[0] || parsed;
  if (result.success === false) {
    throw new Error(result.error || 'Wrangler D1 query failed.');
  }
  return result.results || [];
}

function groupByState(rows) {
  const grouped = {};
  rows.forEach((row) => {
    const state = cleanStateKey(row.state);
    if (!state) return;
    if (!grouped[state]) grouped[state] = [];
    grouped[state].push(row);
  });
  return grouped;
}

function d1RowToPublicJson(row) {
  const raw = parseJson(row.raw_json, {});
  const tags = parseJson(row.tags, []);
  return orderedRecord({
    ...raw,
    id: row.source_json_id || row.id,
    name: row.name || raw.name || '',
    deity: row.deity || raw.deity || '',
    district: row.district || raw.district || '',
    location: row.location || raw.location || '',
    lat: row.lat,
    lng: row.lng,
    timing: row.timing || raw.timing || '',
    phone: row.phone || raw.phone || '',
    description: row.description || raw.description || '',
    famous: Boolean(row.famous),
    status: row.status,
    adminLabel: row.admin_label || raw.adminLabel || '',
    tags: Array.isArray(tags) ? tags : [],
    dressCode: raw.dressCode,
    photography: raw.photography,
    nearestBus: raw.nearestBus,
    nearestRail: raw.nearestRail,
    famousFor: raw.famousFor,
    sourceUrl: row.source_url || raw.sourceUrl || '',
  });
}

function orderedRecord(record) {
  const out = {};
  FIELD_ORDER.forEach((key) => {
    if (record[key] !== undefined && record[key] !== '') out[key] = record[key];
  });
  Object.keys(record).forEach((key) => {
    if (!FIELD_ORDER.includes(key) && record[key] !== undefined && record[key] !== '') out[key] = record[key];
  });
  return out;
}

function readExistingDefaults(state) {
  const path = join(outputRoot, `${state}.json`);
  if (!existsSync(path)) return {};
  try {
    const json = JSON.parse(readFileSync(path, 'utf8'));
    return json._defaults && typeof json._defaults === 'object' && !Array.isArray(json._defaults)
      ? json._defaults
      : {};
  } catch {
    return {};
  }
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`Missing value for ${name}`);
  return value;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function cleanStateKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function relative(path) {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.error(`
Usage:
  node scripts/export-d1-to-json.mjs [--write] [--yes] [--database temple_diary_db] [--remote|--local] [--out data] [--states kerala,sikkim]

Examples:
  node scripts/export-d1-to-json.mjs
  node scripts/export-d1-to-json.mjs --write
  node scripts/export-d1-to-json.mjs --write --yes --states kerala,sikkim
`);
}
