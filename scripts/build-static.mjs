import fs from 'fs';
import path from 'path';
import { normalizeDeity, deityToSlug, toSlug } from './deity-aliases.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const BASE_URL = 'https://www.templediary.in';
const MIN_TEMPLES = 5;   // min temples required to generate a listing page
const MIN_SCORE = 8;   // min richness score for an individual temple page
// A temple ALSO needs a real description (≥80 chars) as a hard requirement.

/** Richness score — gates individual temple page generation.
 *  Description (≥80 chars) is a HARD requirement checked separately.
 *  A temple needs score >= MIN_SCORE AND a real description to get its own page.
 */
function templeScore(t) {
  let s = 0;
  if (t.description && t.description.length > 80) s += 2; // backstory required
  if (t.timing) s += 2;
  if (t.phone) s += 1;
  if (t.dressCode) s += 1;
  if (t.photography) s += 1;
  if (t.nearestBus) s += 1;
  if (t.nearestRail) s += 1;
  if (t.famousFor) s += 2;
  if (t.famous) s += 1;
  if (t.tags && t.tags.length > 1) s += 1;
  return s;
}

/** Returns true only if temple qualifies for its own page */
function hasOwnPage(t) {
  return templeScore(t) >= MIN_SCORE
    && t.description && t.description.length > 80  // hard: must have real backstory
    && t.phone                                      // hard: must have phone number
    && t._district && t._districtSlug;
}

function mkdirp(d) { fs.mkdirSync(d, { recursive: true }); }
function write(file, html) { mkdirp(path.dirname(file)); fs.writeFileSync(file, html, 'utf8'); }
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function getDistrict(t) { return (t.district || t.District || '').trim(); }
function getDeity(t) { return normalizeDeity(t.deity || t.Deity || ''); }

// Load STATE_CONFIGS from states.js
const stateSrc = fs.readFileSync(path.join(ROOT, 'assets/js/core/states.js'), 'utf8');
const STATE_CONFIGS = {};
const re = /'([a-z-]+)':\s*\{([^}]+)\}/g; let m;
while ((m = re.exec(stateSrc)) !== null) {
  const lM = /label:\s*['"]([^'"]+)['"]/.exec(m[2]);
  const iM = /icon:\s*['"]([^'"]+)['"]/.exec(m[2]);
  const eM = /eyebrow:\s*['"]([^'"]+)['"]/.exec(m[2]);
  if (lM) STATE_CONFIGS[m[1]] = { label: lM[1], icon: iM ? iM[1] : '🛕', eyebrow: eM ? eM[1] : '' };
}

// Build indexes
const stateMap = {}, districtMap = {}, deityMap = {}, globalDeity = {};
for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.json'))) {
  const sk = file.replace('.json', '');
  const temples = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8')).temples || [];
  stateMap[sk] = []; districtMap[sk] = {};
  for (const t of temples) {
    const dist = getDistrict(t), deity = getDeity(t);
    const dSlug = toSlug(dist), dySlug = deityToSlug(deity);
    const e = { ...t, _state: sk, _district: dist, _districtSlug: dSlug, _deity: deity, _deitySlug: dySlug };
    stateMap[sk].push(e);
    if (dist && dSlug) { if (!districtMap[sk][dSlug]) districtMap[sk][dSlug] = { name: dist, temples: [] }; districtMap[sk][dSlug].temples.push(e); }
    if (deity && dySlug) {
      if (!deityMap[dySlug]) deityMap[dySlug] = { name: deity, byState: {} };
      if (!deityMap[dySlug].byState[sk]) deityMap[dySlug].byState[sk] = [];
      deityMap[dySlug].byState[sk].push(e);
      if (!globalDeity[dySlug]) globalDeity[dySlug] = { name: deity, temples: [] };
      globalDeity[dySlug].temples.push(e);
    }
  }
}

const CSS = `<style>
.td-s{max-width:1200px;margin:0 auto;padding:0 16px}
.td-bc{font-size:.85rem;color:#7b5c3a;padding:12px 0 4px}.td-bc a{color:#7b1c1c;text-decoration:none}
.td-hero{background:linear-gradient(160deg,rgba(74,13,26,.92) 0%,rgba(28,16,8,.88) 55%,rgba(45,90,39,.85) 100%),url('/assets/images/hero-bg.jpg') center/cover no-repeat;color:#fff;padding:48px 16px 40px;text-align:center}
.td-hero h1{font-size:clamp(1.6rem,4vw,2.6rem);margin:0 0 10px;font-family:Georgia,serif}
.td-hero p{margin:0;opacity:.85}
.td-sh{display:flex;align-items:center;gap:8px;margin:24px 0 12px}.td-sh h2{font-size:1.2rem;margin:0;color:#3d1a0a}
.td-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.td-chip{padding:6px 14px;border-radius:999px;background:#fdf0e0;border:1px solid #e2c07a;color:#6b3f0e;text-decoration:none;font-size:.85rem}
.td-chip:hover{background:#7b1c1c;border-color:#7b1c1c;color:#fff}
.td-chip-c{opacity:.7;font-size:.78rem}
.td-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:32px}
.td-card{background:#fff;border:1px solid #ead7a8;border-radius:12px;padding:16px;transition:box-shadow .15s,transform .15s}
.td-card:hover{box-shadow:0 4px 18px rgba(123,28,28,.12);transform:translateY(-2px)}
.td-card h3{font-size:.97rem;margin:0 0 6px;color:#3d1a0a;font-family:Georgia,serif}
.td-meta{font-size:.8rem;color:#7b5c3a;display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px}
.td-fam{display:inline-block;background:#fff3cd;border:1px solid #f0c040;border-radius:4px;padding:1px 7px;font-size:.72rem;color:#7a5300;font-weight:700;margin-bottom:6px}
.td-desc{font-size:.82rem;color:#5a4030;margin:6px 0 0;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.td-rel{background:#fff8ee;border:1px solid #ead7a8;border-radius:12px;padding:20px;margin:28px 0}
.td-rel h2{margin:0 0 12px;font-size:1.1rem;color:#3d1a0a}
.td-rel ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px}
.td-rel li a{padding:5px 13px;border-radius:999px;background:#fdf0e0;border:1px solid #e2c07a;color:#6b3f0e;font-size:.83rem;text-decoration:none}
.td-rel li a:hover{background:#7b1c1c;color:#fff;border-color:#7b1c1c}
@media(max-width:600px){.td-grid{grid-template-columns:1fr}}
</style>`;

const NAV = `<header>
<nav class="nav-inner">
<a href="/" class="logo"><img class="logo-mark" src="/assets/images/favicon/favicon-96x96.png" alt="" width="36" height="36"/>
<span class="logo-text"><span class="logo-main">TempleDiary</span><span class="logo-sub">India Temple Directory</span></span></a>
<button class="nav-toggle" id="nt" aria-expanded="false" aria-controls="nm"><span></span><span></span><span></span></button>
<ul class="nav-links" id="nm" role="list">
<li><a href="/">Home</a></li><li><a href="/map.html">Map</a></li>
<li><a href="/temples/">Directory</a></li><li><a href="/festivals.html">Festivals</a></li>
<li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li>
</ul></nav></header>`;

const FOOT = `<footer><div class="container footer-inner">
<div class="footer-brand"><p class="footer-logo">TempleDiary</p><p class="footer-tagline">Temples of Incredible India</p>
<p class="footer-pledge-note">🪔 25% of future revenue supports Pauranik welfare</p></div>
<nav class="footer-links"><div class="footer-col"><h3>States</h3><ul role="list">
<li><a href="/temples/kerala/">Kerala</a></li><li><a href="/temples/tamil-nadu/">Tamil Nadu</a></li>
<li><a href="/temples/karnataka/">Karnataka</a></li><li><a href="/temples/">All States</a></li></ul></div>
<div class="footer-col"><h3>Deities</h3><ul role="list">
<li><a href="/deity/lord-shiva/">Lord Shiva</a></li><li><a href="/deity/lord-murugan/">Lord Murugan</a></li>
<li><a href="/deity/lord-vishnu/">Lord Vishnu</a></li><li><a href="/deity/lord-krishna/">Lord Krishna</a></li></ul></div>
<div class="footer-col"><h3>Site</h3><ul role="list">
<li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li>
<li><a href="/privacy.html">Privacy</a></li><li><a href="/sitemap.xml">Sitemap</a></li></ul></div>
</nav></div>
<div class="footer-bottom"><p>&copy; ${new Date().getFullYear()} TempleDiary. All rights reserved.</p></div>
</footer><script>document.getElementById('nt').addEventListener('click',function(){const o=this.getAttribute('aria-expanded')==='true';this.setAttribute('aria-expanded',String(!o));document.getElementById('nm').classList.toggle('open',!o);});</script>`;

function page({ title, desc, canonical, bc, h1, body, schema, spaLink }) {
  const bcHtml = bc.map((b, i) => i < bc.length - 1 ? `<a href="${b.url}">${esc(b.label)}</a>` : `<span>${esc(b.label)}</span>`).join(' › ');
  const sd = schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : '';
  
  const interactiveBanner = spaLink ? `
  <div style="background:#fffcf2;border:1px solid #e2c07a;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <div style="flex:1;min-width:240px;">
      <h3 style="margin:0 0 4px;font-size:1.1rem;color:#7b1c1c;">Unlock the Full Experience</h3>
      <p style="margin:0;font-size:0.9rem;color:#6b5b4b;">You are viewing the text-only directory. Switch to the interactive app for the map, advanced filters, and to submit temples.</p>
    </div>
    <a href="${spaLink}" style="background:#7b1c1c;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:700;font-size:0.95rem;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
      ✨ Open Interactive Map
    </a>
  </div>` : '';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/>
<meta name="robots" content="index,follow"/><link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/>
<meta property="og:url" content="${canonical}"/><meta property="og:site_name" content="TempleDiary"/>
<link rel="icon" href="/assets/images/favicon/favicon.ico"/>
<link rel="stylesheet" href="/assets/css/style.css"/>${CSS}${sd}
</head><body>${NAV}
<div class="td-s"><div class="td-bc">${bcHtml}</div></div>
<div class="td-hero"><div class="td-s"><h1>${h1}</h1><p>${esc(desc)}</p></div></div>
<div class="td-s">${interactiveBanner}${body}</div>
${FOOT}</body></html>`;
}

/** Temple slug: name-slug + id suffix to guarantee uniqueness */
function templeSlug(t) {
  const base = toSlug(t.name || t.Temple || 'temple').slice(0, 60);
  return `${base}-${t.id || Math.abs((t.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 9999)}`;
}

function cards(temples) {
  if (!temples.length) return '<p style="color:#888">No temples found.</p>';
  return `<div class="td-grid">${temples.map(t => {
    const name = t.name || t.Temple || 'Unknown';
    const hasPage = hasOwnPage(t);
    const slug = templeSlug(t);
    
    // SEO link for rich temples, fallback SPA link for thin temples
    const href = hasPage ? `/temples/${t._state}/${t._districtSlug}/${slug}/` : `/?state=${t._state}&temple=${slug}`;
    
    // Humans click: always go to SPA
    const onclick = `window.location.href='/?state=${t._state}&temple=${slug}'; return false;`;

    return `<div class="td-card">
${t.famous ? '<span class="td-fam">⭐ Famous</span>' : ''}
<h3><a href="${href}" onclick="${onclick}">${esc(name)}</a></h3>
<div class="td-meta">
${t._deity ? `<span>🙏 ${esc(t._deity)}</span>` : ''}
${t._district ? `<span>📍 ${esc(t._district)}</span>` : ''}
${t.timing ? `<span>⏰ ${esc(t.timing)}</span>` : ''}
${t.phone ? `<span>📞 ${esc(t.phone)}</span>` : ''}
</div>
${t.description ? `<p class="td-desc">${esc(t.description)}</p>` : ''}
</div>`;
  }).join('')}</div>`;
}

// ── Copy static assets ─────────────────────────────────────────────────────
function copyDir(src, dst) {
  mkdirp(dst);
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
mkdirp(DIST);
for (const f of ['index.html', 'map.html', 'about.html', 'contact.html', 'festivals.html', 'login.html', 'dashboard.html', 'privacy.html', 'terms.html', 'robots.txt']) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, f));
}
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(ROOT, 'data'), path.join(DIST, 'data'));
console.log('✓ Static assets copied');

// ── Directory index ────────────────────────────────────────────────────────
const totalTemples = Object.values(stateMap).reduce((s, t) => s + t.length, 0);
const stateChips = Object.entries(stateMap).sort((a, b) => b[1].length - a[1].length)
  .map(([sk, t]) => { const c = STATE_CONFIGS[sk] || {}; return `<a class="td-chip" href="/temples/${sk}/">${c.icon || '🛕'} ${esc(c.label || sk)} <span class="td-chip-c">${t.length}</span></a>`; }).join('');
const dtyChips = Object.entries(globalDeity).sort((a, b) => b[1].temples.length - a[1].temples.length).slice(0, 30)
  .map(([s, d]) => `<a class="td-chip" href="/deity/${s}/">${esc(d.name)} <span class="td-chip-c">${d.temples.length}</span></a>`).join('');

write(`${DIST}/temples/index.html`, page({
  title: 'India Temple Directory | TempleDiary',
  desc: `Explore ${totalTemples} Hindu temples across all states of India. Browse by state or deity.`,
  canonical: `${BASE_URL}/temples/`,
  bc: [{ label: 'Home', url: '/' }, { label: 'Temples', url: '/temples/' }],
  h1: '🛕 India Temple Directory',
  body: `<div class="td-sh"><h2>Browse by State</h2></div><div class="td-chips">${stateChips}</div>
<div class="td-sh"><h2>Browse by Deity</h2></div><div class="td-chips">${dtyChips}</div>`,
  schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'India Temple Directory', url: `${BASE_URL}/temples/`, numberOfItems: totalTemples },
}));
console.log('✓ /temples/ index');

// ── State pages ────────────────────────────────────────────────────────────
for (const [sk, temples] of Object.entries(stateMap)) {
  const cfg = STATE_CONFIGS[sk] || { label: sk, icon: '🛕' };
  const dists = districtMap[sk] || {};
  const distChips = Object.entries(dists).sort((a, b) => b[1].temples.length - a[1].temples.length)
    .map(([s, d]) => `<a class="td-chip" href="/temples/${sk}/${s}/">${esc(d.name)} <span class="td-chip-c">${d.temples.length}</span></a>`).join('');
  const dyCounts = {};
  for (const t of temples) { if (!t._deitySlug) continue; dyCounts[t._deitySlug] = dyCounts[t._deitySlug] || { name: t._deity, count: 0 }; dyCounts[t._deitySlug].count++; }
  const dyC = Object.entries(dyCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 20)
    .map(([s, d]) => `<a class="td-chip" href="/temples/${sk}/deity/${s}/">${esc(d.name)} <span class="td-chip-c">${d.count}</span></a>`).join('');
  write(`${DIST}/temples/${sk}/index.html`, page({
    title: `Temples in ${cfg.label} | TempleDiary`,
    desc: `Explore ${temples.length} Hindu temples in ${cfg.label}. Browse by district or deity with timings and contact info.`,
    canonical: `${BASE_URL}/temples/${sk}/`,
    spaLink: `/?state=${sk}`,
    bc: [{ label: 'Home', url: '/' }, { label: 'Temples', url: '/temples/' }, { label: cfg.label, url: `/temples/${sk}/` }],
    h1: `${cfg.icon} Temples in ${cfg.label}`,
    body: `<div class="td-sh"><h2>Browse by District</h2></div><div class="td-chips">${distChips || '<p>Coming soon</p>'}</div>
<div class="td-sh"><h2>Browse by Deity</h2></div><div class="td-chips">${dyC}</div>
<div class="td-sh"><h2>All Temples (${temples.length})</h2></div>${cards(temples)}
<div class="td-rel"><h2>Explore More</h2><ul><li><a href="/temples/">All States</a></li><li><a href="/map.html?state=${sk}">Map View</a></li></ul></div>`,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Temples in ${cfg.label}`, url: `${BASE_URL}/temples/${sk}/`, numberOfItems: temples.length },
  }));
}
console.log(`✓ ${Object.keys(stateMap).length} state pages`);

// ── District pages (MIN_TEMPLES threshold applied) ────────────────────────
let dCount = 0;
for (const [sk, dists] of Object.entries(districtMap)) {
  const stLabel = STATE_CONFIGS[sk]?.label || sk;
  for (const [ds, { name: dn, temples }] of Object.entries(dists)) {
    if (temples.length < MIN_TEMPLES) continue; // skip thin districts
    const dyCounts = {};
    for (const t of temples) { if (!t._deitySlug) continue; dyCounts[t._deitySlug] = dyCounts[t._deitySlug] || { name: t._deity, count: 0 }; dyCounts[t._deitySlug].count++; }
    const dyC = Object.entries(dyCounts).sort((a, b) => b[1].count - a[1].count)
      .map(([s, d]) => `<a class="td-chip" href="/temples/${sk}/deity/${s}/">${esc(d.name)} <span class="td-chip-c">${d.count}</span></a>`).join('');
    write(`${DIST}/temples/${sk}/${ds}/index.html`, page({
      title: `Temples in ${dn}, ${stLabel} | TempleDiary`,
      desc: `Find ${temples.length} Hindu temples in ${dn} district, ${stLabel}.`,
      canonical: `${BASE_URL}/temples/${sk}/${ds}/`,
      spaLink: `/?state=${sk}&q=${encodeURIComponent(dn)}`,
      bc: [{ label: 'Home', url: '/' }, { label: stLabel, url: `/temples/${sk}/` }, { label: dn, url: `/temples/${sk}/${ds}/` }],
      h1: `Temples in ${dn}`,
      body: `${dyC ? `<div class="td-sh"><h2>Filter by Deity</h2></div><div class="td-chips">${dyC}</div>` : ''}
<div class="td-sh"><h2>All Temples (${temples.length})</h2></div>${cards(temples)}
<div class="td-rel"><h2>Explore More</h2><ul><li><a href="/temples/${sk}/">All ${esc(stLabel)} Temples</a></li><li><a href="/temples/">All States</a></li></ul></div>`,
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Temples in ${dn}, ${stLabel}`, url: `${BASE_URL}/temples/${sk}/${ds}/`, numberOfItems: temples.length },
    })); dCount++;
  }
}
console.log(`✓ ${dCount} district pages`);

// ── State × Deity pages (MIN_TEMPLES threshold applied) ──────────────────
let sdCount = 0;
for (const [dySlug, { name: dyName, byState }] of Object.entries(deityMap)) {
  for (const [sk, temples] of Object.entries(byState)) {
    if (temples.length < MIN_TEMPLES) continue; // skip thin deity×state combos
    const stLabel = STATE_CONFIGS[sk]?.label || sk;
    write(`${DIST}/temples/${sk}/deity/${dySlug}/index.html`, page({
      title: `${dyName} Temples in ${stLabel} | TempleDiary`,
      desc: `Find all ${temples.length} ${dyName} temples in ${stLabel} with timings and travel info.`,
      canonical: `${BASE_URL}/temples/${sk}/deity/${dySlug}/`,
      spaLink: `/?state=${sk}&q=${encodeURIComponent(dyName)}`,
      bc: [{ label: 'Home', url: '/' }, { label: stLabel, url: `/temples/${sk}/` }, { label: `${dyName} Temples`, url: `/temples/${sk}/deity/${dySlug}/` }],
      h1: `${dyName} Temples in ${stLabel}`,
      body: `<div class="td-sh"><h2>All ${esc(dyName)} Temples (${temples.length})</h2></div>${cards(temples)}
<div class="td-rel"><h2>Explore More</h2><ul>
<li><a href="/deity/${dySlug}/">${esc(dyName)} Temples — All India</a></li>
<li><a href="/temples/${sk}/">All ${esc(stLabel)} Temples</a></li>
</ul></div>`,
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${dyName} Temples in ${stLabel}`, url: `${BASE_URL}/temples/${sk}/deity/${dySlug}/`, numberOfItems: temples.length },
    })); sdCount++;
  }
}
console.log(`✓ ${sdCount} state×deity pages`);

// ── National Deity pages (MIN_TEMPLES threshold applied) ─────────────────
for (const [dySlug, { name: dyName, temples }] of Object.entries(globalDeity)) {
  if (temples.length < MIN_TEMPLES) continue; // skip deities with very few temples
  const bySt = {};
  for (const t of temples) { bySt[t._state] = (bySt[t._state] || 0) + 1; }
  const stChips = Object.entries(bySt).sort((a, b) => b[1] - a[1])
    .map(([sk, cnt]) => { const l = STATE_CONFIGS[sk]?.label || sk; return `<a class="td-chip" href="/temples/${sk}/deity/${dySlug}/">${esc(l)} <span class="td-chip-c">${cnt}</span></a>`; }).join('');
  write(`${DIST}/deity/${dySlug}/index.html`, page({
    title: `${dyName} Temples in India | TempleDiary`,
    desc: `Complete list of ${temples.length} ${dyName} temples across India. Browse by state.`,
    canonical: `${BASE_URL}/deity/${dySlug}/`,
    spaLink: `/?q=${encodeURIComponent(dyName)}`,
    bc: [{ label: 'Home', url: '/' }, { label: 'Temples', url: '/temples/' }, { label: `${dyName} Temples`, url: `/deity/${dySlug}/` }],
    h1: `🙏 ${dyName} Temples in India`,
    body: `<div class="td-sh"><h2>Browse by State</h2></div><div class="td-chips">${stChips}</div>
<div class="td-sh"><h2>All ${esc(dyName)} Temples (${temples.length})</h2></div>${cards(temples)}`,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${dyName} Temples in India`, url: `${BASE_URL}/deity/${dySlug}/`, numberOfItems: temples.length },
  }));
}
console.log(`✓ ${Object.keys(globalDeity).length} national deity pages`);

// ── Individual Temple Pages (score >= MIN_SCORE) ─────────────────────────
let tpCount = 0;
const TEMPLE_CSS = `<style>
.td-info-table{width:100%;border-collapse:collapse;margin:16px 0 24px}
.td-info-table th,.td-info-table td{padding:10px 14px;border:1px solid #ead7a8;text-align:left;font-size:.9rem}
.td-info-table th{background:#fff8ee;color:#3d1a0a;font-weight:700;width:38%}
.td-info-table td{color:#5a4030;background:#fff}
.td-about{background:#fff8ee;border-left:4px solid #c8860a;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px}
.td-about p{margin:0;color:#4a2f0d;line-height:1.7;font-size:.97rem}
.td-map-link{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#7b1c1c;color:#fff;border-radius:999px;text-decoration:none;font-size:.9rem;margin:8px 0 24px}
.td-map-link:hover{background:#5f1515}
.td-nearby h2{font-size:1.1rem;margin:0 0 12px;color:#3d1a0a}
</style>`;

const allRichTemples = Object.values(stateMap).flat().filter(t => hasOwnPage(t));
for (const t of allRichTemples) {
  const name = t.name || t.Temple || 'Unknown Temple';
  const sk = t._state;
  const ds = t._districtSlug;
  const dn = t._district;
  const stLabel = STATE_CONFIGS[sk]?.label || sk;
  const slug = templeSlug(t);
  const url = `${BASE_URL}/temples/${sk}/${ds}/${slug}/`;

  // Nearby temples in same district (up to 5, exclude self)
  const nearby = (districtMap[sk]?.[ds]?.temples || [])
    .filter(n => n !== t && (n.name || n.Temple))
    .slice(0, 5);
  const nearbyHtml = nearby.length ? `<div class="td-nearby td-rel">
<h2>More Temples in ${esc(dn)}</h2><ul>${nearby.map(n => {
    const nName = n.name || n.Temple || '';
    const nSlug = templeScore(n) >= MIN_SCORE ? `/temples/${sk}/${ds}/${templeSlug(n)}/` : null;
    return `<li>${nSlug ? `<a href="${nSlug}">${esc(nName)}</a>` : esc(nName)}</li>`;
  }).join('')
    }</ul></div>` : '';

  const rows = [
    t.timing ? `<tr><th>⏰ Timing</th><td>${esc(t.timing)}</td></tr>` : '',
    t.location ? `<tr><th>📍 Location</th><td>${esc(t.location)}</td></tr>` : '',
    t.phone ? `<tr><th>📞 Phone</th><td>${esc(t.phone)}</td></tr>` : '',
    t.dressCode ? `<tr><th>👗 Dress Code</th><td>${esc(t.dressCode)}</td></tr>` : '',
    t.photography ? `<tr><th>📷 Photography</th><td>${esc(t.photography)}</td></tr>` : '',
    t.nearestBus ? `<tr><th>🚌 Nearest Bus</th><td>${esc(t.nearestBus)}</td></tr>` : '',
    t.nearestRail ? `<tr><th>🚂 Nearest Rail</th><td>${esc(t.nearestRail)}</td></tr>` : '',
  ].filter(Boolean).join('');

  const mapLink = (t.lat && t.lng)
    ? `<a class="td-map-link" href="https://www.openstreetmap.org/?mlat=${t.lat}&mlon=${t.lng}&zoom=16" target="_blank" rel="noopener">🗺️ View on Map</a>`
    : '';

  const body = `
${t.famous ? '<p><span class="td-fam" style="font-size:.9rem;padding:4px 12px">⭐ Famous Temple</span></p>' : ''}
${rows ? `<table class="td-info-table"><tbody>${rows}</tbody></table>` : ''}
${t.description ? `<div class="td-about"><p>${esc(t.description)}</p></div>` : ''}
${t.famousFor ? `<div class="td-about"><p><strong>Famous for:</strong> ${esc(t.famousFor)}</p></div>` : ''}
${mapLink}
${nearbyHtml}
<div class="td-rel"><h2>Explore More</h2><ul>
<li><a href="/temples/${sk}/${ds}/">All Temples in ${esc(dn)}</a></li>
<li><a href="/temples/${sk}/">All ${esc(stLabel)} Temples</a></li>
${t._deitySlug ? `<li><a href="/deity/${t._deitySlug}/">${esc(t._deity)} Temples in India</a></li>` : ''}
</ul></div>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    description: t.description || '',
    url,
    address: { '@type': 'PostalAddress', addressLocality: dn, addressRegion: stLabel, addressCountry: 'IN' },
    ...(t.lat && t.lng ? { geo: { '@type': 'GeoCoordinates', latitude: t.lat, longitude: t.lng } } : {}),
    ...(t.phone ? { telephone: t.phone } : {}),
  };

  write(`${DIST}/temples/${sk}/${ds}/${slug}/index.html`,
    page({
      title: `${name} — ${dn}, ${stLabel} | TempleDiary`,
      desc: `${name} is a ${t._deity || 'Hindu'} temple in ${dn}, ${stLabel}.${t.description ? ' ' + t.description.slice(0, 100) + '…' : ''}`,
      canonical: url,
      bc: [{ label: 'Home', url: '/' }, { label: stLabel, url: `/temples/${sk}/` }, { label: dn, url: `/temples/${sk}/${ds}/` }, { label: name, url }],
      h1: name,
      body: TEMPLE_CSS + body,
      schema,
    })
  );
  tpCount++;
}
console.log(`✓ ${tpCount} individual temple pages (score ≥ ${MIN_SCORE})`);

// ── Sitemap ────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const urls = [
  `<url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`,
  `<url><loc>${BASE_URL}/temples/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
];
for (const sk of Object.keys(stateMap)) {
  urls.push(`<url><loc>${BASE_URL}/temples/${sk}/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`);
  for (const [ds, { temples: dt }] of Object.entries(districtMap[sk] || {}))
    if (dt.length >= MIN_TEMPLES) urls.push(`<url><loc>${BASE_URL}/temples/${sk}/${ds}/</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`);
  for (const dySlug of Object.keys(deityMap))
    if ((deityMap[dySlug]?.byState?.[sk] || []).length >= MIN_TEMPLES)
      urls.push(`<url><loc>${BASE_URL}/temples/${sk}/deity/${dySlug}/</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`);
}
for (const [dySlug, { temples: dt }] of Object.entries(globalDeity))
  if (dt.length >= MIN_TEMPLES) urls.push(`<url><loc>${BASE_URL}/deity/${dySlug}/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`);
// Individual temple pages in sitemap
for (const t of allRichTemples)
  urls.push(`<url><loc>${BASE_URL}/temples/${t._state}/${t._districtSlug}/${templeSlug(t)}/</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>`);
for (const pg of ['map.html', 'festivals.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html'])
  urls.push(`<url><loc>${BASE_URL}/${pg}</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>`);
write(`${DIST}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
console.log(`✓ sitemap.xml (${urls.length} URLs)`);

// ── _redirects ────────────────────────────────────────────────────────────
// Explicit pass-throughs FIRST so static files are never intercepted,
// then SPA fallback for unmatched HTML routes.
write(`${DIST}/_redirects`,
`/assets/*  /assets/:splat  200
/data/*     /data/:splat    200
/api/*      /api/:splat     200
/*          /index.html     200
`);
console.log('✓ _redirects');

console.log(`\n🎉 Build complete → dist/ (${urls.length} sitemap URLs)`);
