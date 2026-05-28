#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

const STATE_FILES = [
  ['arunachal-pradesh', 'data/arunachal-pradesh.json'],
  ['bihar', 'data/bihar.json'],
  ['chhattisgarh', 'data/chhattisgarh.json'],
  ['haryana', 'data/haryana.json'],
  ['himachal-pradesh', 'data/himachal-pradesh.json'],
  ['jharkhand', 'data/jharkhand.json'],
  ['kerala', 'data/kerala.json'],
  ['karnataka', 'data/karnataka.json'],
  ['andhra-pradesh', 'data/andhra-pradesh.json'],
  ['tamil-nadu', 'data/tamil-nadu.json'],
  ['goa', 'data/goa.json'],
  ['rajasthan', 'data/rajasthan.json'],
  ['gujarat', 'data/gujarat.json'],
  ['assam', 'data/assam.json'],
  ['west-bengal', 'data/west-bengal.json'],
  ['madhya-pradesh', 'data/madhya-pradesh.json'],
  ['maharashtra', 'data/maharashtra.json'],
  ['manipur', 'data/manipur.json'],
  ['meghalaya', 'data/meghalaya.json'],
  ['mizoram', 'data/mizoram.json'],
  ['nagaland', 'data/nagaland.json'],
  ['jammu-kashmir', 'data/jammu-kashmir.json'],
  ['odisha', 'data/odisha.json'],
  ['punjab', 'data/punjab.json'],
  ['sikkim', 'data/sikkim.json'],
  ['telangana', 'data/telangana.json'],
  ['tripura', 'data/tripura.json'],
  ['uttar-pradesh', 'data/uttar-pradesh.json'],
  ['uttarakhand', 'data/uttarakhand.json'],
];

const outDir = process.argv[2] || 'tmp/d1-import-batches';
const requestedStates = process.argv.slice(3);
const status = process.env.TEMPLE_IMPORT_STATUS || 'unverified';
const batchSize = Number.parseInt(process.env.TEMPLE_IMPORT_BATCH_SIZE || '100', 10);
const stateFileMap = new Map(STATE_FILES);

if (requestedStates.length) {
  const unknownStates = requestedStates.filter((state) => !stateFileMap.has(state));
  if (unknownStates.length) {
    console.error(`Unknown state key(s): ${unknownStates.join(', ')}`);
    console.error(`Known state keys: ${STATE_FILES.map(([state]) => state).join(', ')}`);
    process.exit(1);
  }
}

const selectedStateFiles = requestedStates.length
  ? requestedStates.map((state) => [state, stateFileMap.get(state)])
  : STATE_FILES;

function sql(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function readTempleFile(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  const data = JSON.parse(readFileSync(fullPath, 'utf8'));
  const defaults = data._defaults || {};
  const temples = Array.isArray(data) ? data : data.temples || [];
  return temples.map((temple) => ({ ...defaults, ...temple }));
}

function insertStatement(state, temple) {
  const sourceJsonId = Number.isInteger(temple.id) ? temple.id : null;
  const tags = Array.isArray(temple.tags) ? temple.tags : [];
  const rawJson = JSON.stringify(temple);
  const sourceUrl = temple.sourceUrl || temple.source_url || null;

  const columns = [
    'state',
    'source_json_id',
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
    'tags',
    'admin_label',
    'status',
    'source_url',
    'raw_json',
  ];

  const values = [
    state,
    sourceJsonId,
    temple.name || '',
    temple.deity || '',
    temple.district || '',
    temple.location || '',
    temple.lat,
    temple.lng,
    temple.timing || '',
    temple.phone || '',
    temple.description || '',
    temple.famous ? 1 : 0,
    JSON.stringify(tags),
    temple.adminLabel || temple.admin_label || null,
    status,
    sourceUrl,
    rawJson,
  ];

  const duplicateCheck = sourceJsonId !== null
    ? `state = ${sql(state)} AND source_json_id = ${sql(sourceJsonId)}`
    : `state = ${sql(state)} AND name = ${sql(temple.name || '')} AND location = ${sql(temple.location || '')}`;

  return [
    `INSERT INTO temples (${columns.join(', ')})`,
    `SELECT ${values.map(sql).join(', ')}`,
    `WHERE NOT EXISTS (SELECT 1 FROM temples WHERE ${duplicateCheck});`,
  ].join('\n');
}

const batches = [];
let currentBatch = [];
let total = 0;

function pushStatement(statement) {
  currentBatch.push(statement);
  if (currentBatch.length >= batchSize) {
    batches.push(currentBatch);
    currentBatch = [];
  }
}

for (const [state, relativePath] of selectedStateFiles) {
  const temples = readTempleFile(relativePath);
  pushStatement(`-- ${state}: ${basename(relativePath)} (${temples.length} temples)`);
  for (const temple of temples) {
    if (!temple.name) continue;
    pushStatement(insertStatement(state, temple));
    total += 1;
  }
}

if (currentBatch.length) batches.push(currentBatch);

const outputDir = join(repoRoot, outDir);
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const manifest = [];
for (const [index, batch] of batches.entries()) {
  const fileName = `batch-${String(index + 1).padStart(3, '0')}.sql`;
  const relativePath = `${outDir}/${fileName}`;
  const outputPath = join(outputDir, fileName);
  const fileStatements = [
    '-- Generated by scripts/d1/import-json-to-d1.mjs',
    `-- TEMPLE_IMPORT_STATUS=${status}`,
    `-- batch ${index + 1} of ${batches.length}`,
    ...batch,
  ];
  writeFileSync(outputPath, fileStatements.join('\n\n') + '\n');
  manifest.push(relativePath);
}

writeFileSync(join(outputDir, 'manifest.txt'), manifest.join('\n') + '\n');

console.log(`Wrote ${total} temple inserts across ${batches.length} batch files in ${outDir}`);
console.log(`States: ${selectedStateFiles.map(([state]) => state).join(', ')}`);
console.log(`Import status: ${status}`);
console.log(`Batch size: ${batchSize}`);
console.log(`Manifest: ${outDir}/manifest.txt`);
