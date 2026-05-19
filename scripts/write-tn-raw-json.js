/** Generate scripts/tn-temples-raw.json from tn-temples-source.js */
const fs = require('fs');
const path = require('path');

const DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Thiruvarur', 'Vellore',
  'Villupuram', 'Virudhunagar',
];

const NON_HINDU_DEITIES = /^(Lord Jesus|Lord Mahavira|Lord Ayya)$/;

const BY_DISTRICT = require('./tn-temples-source');

const out = {};
for (const d of DISTRICTS) {
  if (!BY_DISTRICT[d] || BY_DISTRICT[d].length !== 15) {
    throw new Error(`${d}: expected 15 temples, got ${BY_DISTRICT[d]?.length ?? 0}`);
  }
  out[d] = BY_DISTRICT[d].filter(([, deity]) => !NON_HINDU_DEITIES.test(deity));
  if (out[d].length !== 15) {
    throw new Error(`${d}: after filter expected 15, got ${out[d].length}`);
  }
}

const target = path.join(__dirname, 'tn-temples-raw.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n');
console.log('Wrote', target, '—', Object.keys(out).length, 'districts,',
  Object.values(out).reduce((n, a) => n + a.length, 0), 'temples');
