#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const inputArg = args.find((arg) => !arg.startsWith('--'));
const write = args.includes('--write');
const outDir = readOption('--out') || 'data';
const onlyStates = readOption('--states')
  ?.split(',')
  .map((state) => cleanStateKey(state))
  .filter(Boolean);

if (!inputArg) {
  usage();
  process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);
const outputRoot = resolve(repoRoot, outDir);
const bundle = readJson(inputPath);
const entries = Object.entries(bundle);

if (!entries.length || Array.isArray(bundle)) {
  fail('Expected an all-state bundle object like { "kerala": { "_defaults": {}, "temples": [] } }.');
}

const selectedEntries = onlyStates?.length
  ? entries.filter(([state]) => onlyStates.includes(cleanStateKey(state)))
  : entries;

if (onlyStates?.length) {
  const available = new Set(entries.map(([state]) => cleanStateKey(state)));
  const missing = onlyStates.filter((state) => !available.has(state));
  if (missing.length) fail(`Requested state(s) not found in bundle: ${missing.join(', ')}`);
}

const outputs = selectedEntries.map(([state, value]) => {
  const key = cleanStateKey(state);
  if (!key) fail(`Invalid state key in bundle: ${state}`);

  const normalized = normalizeStateJson(value, key);
  return {
    key,
    path: join(outputRoot, `${key}.json`),
    json: JSON.stringify(normalized, null, 2) + '\n',
    count: normalized.temples.length,
  };
});

if (!write) {
  console.log(`Dry run: ${outputs.length} state file(s) would be written to ${relative(outputRoot)}`);
  outputs.forEach((out) => {
    console.log(`- ${relative(out.path)} (${out.count} temples)`);
  });
  console.log('\nRun again with --write to replace the files.');
  process.exit(0);
}

mkdirSync(outputRoot, { recursive: true });
outputs.forEach((out) => {
  writeFileSync(out.path, out.json);
  console.log(`Wrote ${relative(out.path)} (${out.count} temples)`);
});

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`Missing value for ${name}`);
  return value;
}

function readJson(path) {
  if (!existsSync(path)) fail(`Input file not found: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(`Invalid JSON in ${path}: ${err.message}`);
  }
}

function normalizeStateJson(value, state) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`State "${state}" must be an object with a temples array.`);
  }

  const temples = value.temples;
  if (!Array.isArray(temples)) {
    fail(`State "${state}" is missing a temples array.`);
  }

  return {
    _defaults: value._defaults && typeof value._defaults === 'object' && !Array.isArray(value._defaults)
      ? value._defaults
      : {},
    temples,
  };
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
  node scripts/split-d1-export-bundle.mjs <bundle.json> [--write] [--out data] [--states kerala,sikkim]

Examples:
  node scripts/split-d1-export-bundle.mjs templediary-d1-export-2026-05-28.json
  node scripts/split-d1-export-bundle.mjs templediary-d1-export-2026-05-28.json --write
  node scripts/split-d1-export-bundle.mjs bundle.json --write --states kerala,sikkim
`);
}
