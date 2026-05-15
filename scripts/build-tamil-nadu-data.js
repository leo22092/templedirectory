/**
 * Build tamil-nadu-data.js from existing data + tn-temples-raw.json
 * Run: node scripts/build-tamil-nadu-data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'tamil-nadu-data.js');
const RAW_FILE = path.join(__dirname, 'tn-temples-raw.json');

const DRESS_CODE =
  'Men: Dhoti or neat trousers. Women: Saree or churidar. Shorts and sleeveless not permitted.';
const PHOTOGRAPHY =
  'Permitted in outer prakarams. Restricted inside the main sanctum.';

const DISTRICT_RAIL = {
  Ariyalur: 'Ariyalur Railway Station',
  Chengalpattu: 'Chengalpattu Railway Station',
  Chennai: 'Chennai Central Railway Station',
  Coimbatore: 'Coimbatore Junction',
  Cuddalore: 'Cuddalore Junction',
  Dharmapuri: 'Dharmapuri Railway Station',
  Dindigul: 'Dindigul Junction',
  Erode: 'Erode Junction',
  Kallakurichi: 'Kallakurichi Railway Station',
  Kanchipuram: 'Kanchipuram Railway Station',
  Kanyakumari: 'Kanyakumari Railway Station',
  Karur: 'Karur Junction',
  Krishnagiri: 'Hosur Railway Station',
  Madurai: 'Madurai Junction',
  Mayiladuthurai: 'Mayiladuthurai Railway Station',
  Nagapattinam: 'Nagapattinam Junction',
  Namakkal: 'Namakkal Railway Station',
  Nilgiris: 'Mettupalayam Railway Station',
  Perambalur: 'Ariyalur Railway Station',
  Pudukkottai: 'Pudukkottai Railway Station',
  Ramanathapuram: 'Ramanathapuram Railway Station',
  Ranipet: 'Walajah Road Railway Station',
  Salem: 'Salem Junction',
  Sivaganga: 'Karaikudi Junction',
  Tenkasi: 'Tenkasi Railway Station',
  Thanjavur: 'Thanjavur Junction',
  Theni: 'Theni Railway Station',
  Thoothukudi: 'Thoothukudi Railway Station',
  Tiruchirappalli: 'Tiruchirapalli Junction',
  Tirunelveli: 'Tirunelveli Junction',
  Tirupattur: 'Jolarpettai Junction',
  Tiruppur: 'Tiruppur Railway Station',
  Tiruvallur: 'Tiruvallur Railway Station',
  Tiruvannamalai: 'Tiruvannamalai Railway Station',
  Thiruvarur: 'Thiruvarur Junction',
  Vellore: 'Katpadi Junction',
  Villupuram: 'Villupuram Junction',
  Virudhunagar: 'Virudhunagar Railway Station',
};

function normName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,()]/g, '')
    .replace(/\b(arulmigu|sri|shri)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlaceholderPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return false;
  const last4 = digits.slice(-4);
  return /^(0123|1234|2345|3456|4567|5678|6789|7890|8901|9012)$/.test(last4);
}

function loadExistingTemples() {
  const src = fs.readFileSync(DATA_FILE, 'utf8');
  const m = src.match(/const\s+TEMPLES_TN\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error('Could not parse TEMPLES_TN from tamil-nadu-data.js');
  return eval(m[1]);
}

function isDupEntry(t) {
  const n = normName(t.name);
  if (n.includes('chidambaram') && n.includes('nataraja')) return true;
  if (n.includes('tiruchendur') && n.includes('senthilandavar')) return true;
  return false;
}

function fixEntry(t) {
  const out = { ...t };
  if (normName(out.name).includes('swamimalai') && out.district === 'Kumbakonam') {
    out.district = 'Thanjavur';
    out.location = 'Swamimalai, Thanjavur';
    if (out.nearestRail && out.nearestRail.includes('Kumbakonam')) {
      out.nearestRail = 'Thanjavur Junction (35 km)';
    }
  }
  if (isPlaceholderPhone(out.phone)) out.phone = '';
  return out;
}

function rawToTemple(row, district, id) {
  const [name, deity, place, famous, tags, description] = row;
  return {
    id,
    name,
    deity,
    district,
    location: `${place}, ${district}`,
    lat: null,
    lng: null,
    timing: '',
    phone: '',
    description,
    famous: !!famous,
    tags: tags || [],
    dressCode: DRESS_CODE,
    photography: PHOTOGRAPHY,
    nearestBus: `Bus services to ${place}`,
    nearestRail: DISTRICT_RAIL[district] || `${district} Railway Station`,
  };
}

function deityColor(deity) {
  const d = deity.toLowerCase();
  if (d.includes('shiva') || d.includes('nataraja') || d.includes('thyagaraja') || d.includes('lingam'))
    return '#6A1B9A';
  if (d.includes('vishnu') || d.includes('venkates') || d.includes('perumal') || d.includes('krishna') || d.includes('narasimha') || d.includes('rama'))
    return '#1565C0';
  if (d.includes('murugan') || d.includes('subraman')) return '#BF360C';
  if (d.includes('ganesha') || d.includes('vinayag') || d.includes('pillayar')) return '#E65100';
  if (d.includes('parvati') || d.includes('meenakshi') || d.includes('kamakshi') || d.includes('amman') || d.includes('lakshmi') || d.includes('kali') || d.includes('andal') || d.includes('bhagavathi') || d.includes('goddess'))
    return '#880E4F';
  if (d.includes('hanuman') || d.includes('anjaney')) return '#F57F17';
  if (d.includes('ayyappa')) return '#00695C';
  return '#455A64';
}

function buildDeityColors(temples) {
  const colors = {};
  for (const t of temples) {
    if (!colors[t.deity]) colors[t.deity] = deityColor(t.deity);
  }
  return colors;
}

function serializeTemple(t) {
  const lines = [
    '  {',
    `    id: ${t.id},`,
    `    name: ${JSON.stringify(t.name)},`,
    `    deity: ${JSON.stringify(t.deity)},`,
    `    district: ${JSON.stringify(t.district)},`,
    `    location: ${JSON.stringify(t.location)},`,
    `    lat: ${t.lat === null ? 'null' : t.lat}, lng: ${t.lng === null ? 'null' : t.lng},`,
    `    timing: ${JSON.stringify(t.timing)},`,
    `    phone: ${JSON.stringify(t.phone)},`,
    `    description: ${JSON.stringify(t.description)},`,
    `    famous: ${t.famous},`,
    `    tags: ${JSON.stringify(t.tags)},`,
    `    dressCode: ${JSON.stringify(t.dressCode)},`,
    `    photography: ${JSON.stringify(t.photography)},`,
    `    nearestBus: ${JSON.stringify(t.nearestBus)},`,
    `    nearestRail: ${JSON.stringify(t.nearestRail)}`,
    '  }',
  ];
  return lines.join('\n');
}

function mergeRow(existing, row, district) {
  const [name, deity, place, famous, tags, description] = row;
  if (existing) {
    const hadCoords = existing.lat != null && existing.lng != null;
    return fixEntry({
      ...existing,
      name,
      deity,
      district,
      location: `${place}, ${district}`,
      famous: existing.famous || !!famous,
      tags: [...new Set([...(existing.tags || []), ...(tags || [])])],
      description,
      lat: hadCoords ? existing.lat : null,
      lng: hadCoords ? existing.lng : null,
      phone: isPlaceholderPhone(existing.phone) ? '' : (existing.phone || ''),
      timing: existing.timing || '',
      dressCode: existing.dressCode || DRESS_CODE,
      photography: existing.photography || PHOTOGRAPHY,
      nearestBus: existing.nearestBus && !existing.nearestBus.startsWith('Bus services to')
        ? existing.nearestBus
        : `Bus services to ${place}`,
      nearestRail: existing.nearestRail || DISTRICT_RAIL[district],
    });
  }
  return rawToTemple(row, district, 0);
}

function main() {
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const existingList = loadExistingTemples().map(fixEntry).filter((t) => !isDupEntry(t));
  const existingByKey = new Map();
  for (const t of existingList) {
    existingByKey.set(`${normName(t.name)}|${t.district}`, t);
  }

  const temples = [];
  let id = 1;
  for (const [district, rows] of Object.entries(raw)) {
    if (rows.length !== 15) {
      throw new Error(`${district}: expected 15 temples in raw, got ${rows.length}`);
    }
    for (const row of rows) {
      const key = `${normName(row[0])}|${district}`;
      const entry = mergeRow(existingByKey.get(key), row, district);
      entry.id = id++;
      temples.push(entry);
    }
  }

  const colors = buildDeityColors(temples);
  const colorLines = Object.entries(colors)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([deity, hex]) => `  ${JSON.stringify(deity)}: ${JSON.stringify(hex)},`)
    .join('\n');

  const body = temples.map(serializeTemple).join(',\n');
  const out = `/* ═══════════════════════════════════════════════════
   BharatDevasthanam — tamil-nadu-data.js
   Temple data for Tamil Nadu
   Each state has its own data file — edit independently.
   Generated/updated by scripts/build-tamil-nadu-data.js
═══════════════════════════════════════════════════ */

const TEMPLES_TN = [
${body}
];

/* ── Tamil Nadu Deity colour map for map markers ── */
const DEITY_COLORS_TN = {
${colorLines}
};

const TN_DISTRICTS = [...new Set(TEMPLES_TN.map(t => t.district))].sort();
const TN_DEITIES   = [...new Set(TEMPLES_TN.map(t => t.deity))].sort();
`;

  fs.writeFileSync(DATA_FILE, out);
  console.log('Wrote', DATA_FILE);
  console.log('Total temples:', temples.length);

  const perDistrict = {};
  for (const t of temples) {
    perDistrict[t.district] = (perDistrict[t.district] || 0) + 1;
  }
  console.log('Per district:', JSON.stringify(perDistrict, null, 2));

  const sample = temples.find((t) => t.district === 'Coimbatore');
  if (sample) console.log('Coimbatore sample:', JSON.stringify(sample, null, 2));
}

main();
