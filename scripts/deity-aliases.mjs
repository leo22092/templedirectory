/**
 * deity-aliases.mjs
 * Canonical deity name map for TempleDiary SSG.
 * Maps every raw string found in data/*.json → one canonical display name.
 * Lookup is always done via normalizeDeity() which lowercases + trims first.
 *
 * DO NOT edit data/*.json to fix spellings — fix them here instead.
 */

// key   = raw deity string lowercased + trimmed
// value = canonical display name (title-case, used in page headings & URLs)
export const DEITY_ALIASES = {

  // ── MURUGAN / KARTIKEYA / SUBRAMANYA ──────────────────────────────────────
  'lord murugan':                        'Lord Murugan',
  'lord subramanya':                     'Lord Murugan',
  'lord subramanya (karthikeya)':        'Lord Murugan',
  'lord shanmuga':                       'Lord Murugan',
  'lord muruga':                         'Lord Murugan',
  'muruga':                              'Lord Murugan',
  'lord kartikeya':                      'Lord Murugan',
  'kartikeya':                           'Lord Murugan',
  'subramanya':                          'Lord Murugan',

  // ── BHAGAVATHI / BHAGAVATHY ───────────────────────────────────────────────
  'goddess bhagavathi':                  'Goddess Bhagavathi',
  'goddess bhagavathy':                  'Goddess Bhagavathi',
  'goddess bhagavathy / vanadurga':      'Goddess Bhagavathi',
  'goddess bhagavati (lakshmi form)':    'Goddess Bhagavathi',
  'goddess kanyakumari (bhagavathi)':    'Goddess Bhagavathi',

  // ── LORD SHIVA (and all local forms) ─────────────────────────────────────
  'lord shiva':                          'Lord Shiva',
  'lord mahadev (shiva)':                'Lord Shiva',
  'lord damodar (shiva)':                'Lord Shiva',
  'lord chandreshwar (shiva / chandranath)': 'Lord Shiva',
  'lord mallikarjun (shiva)':            'Lord Shiva',
  'lord manguesh (shiva)':               'Lord Shiva',
  'lord naguesh (shiva)':                'Lord Shiva',
  'lord saptakoteshwar (shiva)':         'Lord Shiva',
  'lord veerabhadra (shiva)':            'Lord Shiva',
  'lord ramnath (shiva) with panchayatan deities': 'Lord Shiva',
  'lord shiva (amareswara)':             'Lord Shiva',
  'lord shiva (bhimeswara)':             'Lord Shiva',
  'lord shiva (chandrasekara)':          'Lord Shiva',
  'lord shiva (gangadhareshwara)':       'Lord Shiva',
  'lord shiva (hoysaleshwara)':          'Lord Shiva',
  'lord shiva (kapileswara)':            'Lord Shiva',
  'lord shiva (koteswara)':              'Lord Shiva',
  'lord shiva (kumara bhimeswara)':      'Lord Shiva',
  'lord shiva (mahalingeshwara)':        'Lord Shiva',
  'lord shiva (mahanandiswara)':         'Lord Shiva',
  'lord shiva (mallikarjuna) & goddess bhramaramba': 'Lord Shiva',
  'lord shiva (manjunatha)':             'Lord Shiva',
  'lord shiva (mukhalingeswara)':        'Lord Shiva',
  'lord shiva (nageswara)':              'Lord Shiva',
  'lord shiva (nanjundeshwara)':         'Lord Shiva',
  'lord shiva (nataraja)':               'Lord Shiva',
  'lord shiva (panchalingeshwara)':      'Lord Shiva',
  'lord shiva (parasurameswara)':        'Lord Shiva',
  'lord shiva (siddalingeshwara)':       'Lord Shiva',
  'lord shiva (someswarar)':             'Lord Shiva',
  'lord shiva (thyagaraja)':             'Lord Shiva',
  'lord shiva (trikoteswara)':           'Lord Shiva',
  'lord shiva (vayu lingam)':            'Lord Shiva',
  'lord shiva (veerabhadra) & kukkuteswara swamy': 'Lord Shiva',
  'lord shiva (virupaksha)':             'Lord Shiva',
  'lord shiva & goddess parvati (uma maheswarar)': 'Lord Shiva',
  'lord shiva & multi-faith':            'Lord Shiva',
  'lord shiva and char dham replicas':   'Lord Shiva',

  // ── LORD VISHNU (and all avatar/form names) ───────────────────────────────
  'lord vishnu':                         'Lord Vishnu',
  'lord vishnu (chennakesava)':          'Lord Vishnu',
  'lord vishnu (govindaraja)':           'Lord Vishnu',
  'lord vishnu (jaganmohini kesava)':    'Lord Vishnu',
  'lord vishnu (ranganatha)':            'Lord Vishnu',
  'lord vishnu (rangaswamy)':            'Lord Vishnu',
  'lord vishnu (sowmyanatha)':           'Lord Vishnu',
  'lord vishnu (venkataramana)':         'Lord Vishnu',
  'lord vishnu (venkateshwara)':         'Lord Vishnu',
  'mahavishnu':                          'Lord Vishnu',
  'lord ranganatha (vishnu)':            'Lord Vishnu',
  'lord satyanarayana (vishnu — trinity form)': 'Lord Vishnu',
  'lord kurma (vishnu — tortoise avatar)': 'Lord Vishnu',

  // ── VENKATESWARA (kept separate — major pilgrimage identity) ──────────────
  'lord venkateswara':                   'Lord Venkateswara',
  'lord venkateswara (vishnu)':          'Lord Venkateswara',

  // ── NARASIMHA ─────────────────────────────────────────────────────────────
  'lord narasimha (vishnu)':             'Lord Narasimha',
  'lord narasimha':                      'Lord Narasimha',

  // ── LORD KRISHNA ──────────────────────────────────────────────────────────
  'lord krishna':                        'Lord Krishna',
  'lord krishna (radha krishna)':        'Lord Krishna',
  'radha krishna':                       'Lord Krishna',

  // ── GODDESS MARIAMMAN ─────────────────────────────────────────────────────
  'goddess mariamman':                   'Goddess Mariamman',
  'goddess mariyamman':                  'Goddess Mariamman',

  // ── GODDESS DURGA ─────────────────────────────────────────────────────────
  'goddess durga':                       'Goddess Durga',
  'goddess durgaparameshwari':           'Goddess Durga',
  'goddess kanaka durga':                'Goddess Durga',
  'goddess chamundeshwari':              'Goddess Durga',
  'goddess chamundi':                    'Goddess Durga',
  'goddess chamunda':                    'Goddess Durga',

  // ── GODDESS KALI ──────────────────────────────────────────────────────────
  'goddess kali':                        'Goddess Kali',
  'goddess bhadrakali':                  'Goddess Kali',
  'goddess ugratara':                    'Goddess Kali',

  // ── GODDESS PARVATI ───────────────────────────────────────────────────────
  'goddess parvati':                     'Goddess Parvati',
  'goddess banashankari (parvati)':      'Goddess Parvati',
  'goddess lairai devi (parvati)':       'Goddess Parvati',

  // ── GODDESS LAKSHMI ───────────────────────────────────────────────────────
  'goddess lakshmi':                     'Goddess Lakshmi',
  'mahalakshmi':                         'Goddess Lakshmi',
  'goddess mahalakshmi':                 'Goddess Lakshmi',
  'goddess mahalaxmi':                   'Goddess Lakshmi',
  'goddess padmavathi (lakshmi)':        'Goddess Lakshmi',

  // ── GODDESS SARASWATI ─────────────────────────────────────────────────────
  'goddess saraswathi':                  'Goddess Saraswati',
  'goddess saraswati':                   'Goddess Saraswati',
  'goddess sharadamba (saraswati)':      'Goddess Saraswati',

  // ── LORD JAGANNATH ────────────────────────────────────────────────────────
  'lord jagannath':                      'Lord Jagannath',
  'lord jagannatha':                     'Lord Jagannath',

  // ── LORD MUTHAPPAN ────────────────────────────────────────────────────────
  'lord muthappan':                      'Lord Muthappan',
  'sree muthappan':                      'Lord Muthappan',
  '2 sree muthappan':                    'Lord Muthappan',

  // ── VETTAKKORUMAKAN ───────────────────────────────────────────────────────
  'vettakkorumakan':                     'Lord Vettakkorumakan',
  'lord vettakkorumakan':                'Lord Vettakkorumakan',

  // ── LORD SURYA ────────────────────────────────────────────────────────────
  'surya':                               'Lord Surya',
  'lord surya':                          'Lord Surya',
  'lord surya (sun god)':                'Lord Surya',

  // ── LORD HANUMAN ──────────────────────────────────────────────────────────
  'lord hanuman':                        'Lord Hanuman',

  // ── LORD GANESHA ──────────────────────────────────────────────────────────
  'lord ganesha':                        'Lord Ganesha',
  'lord ganesha (varasiddhi vinayaka)':  'Lord Ganesha',

  // ── LORD RAMA ─────────────────────────────────────────────────────────────
  'lord rama':                           'Lord Rama',

  // ── LORD AYYAPPA ──────────────────────────────────────────────────────────
  'lord ayyappa':                        'Lord Ayyappa',
};

/**
 * Normalize a raw deity string to its canonical display name.
 * Falls through to a title-cased version of the raw string if not in the map.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeDeity(raw) {
  if (!raw || !raw.trim()) return 'Unknown';
  const key = raw.trim().toLowerCase();
  return DEITY_ALIASES[key] || raw.trim();
}

/**
 * Convert a canonical deity name (or any string) to a URL-safe slug.
 * e.g. "Lord Murugan" → "lord-murugan"
 *      "Goddess Bhagavathi" → "goddess-bhagavathi"
 * @param {string} name
 * @returns {string}
 */
export function deityToSlug(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .trim()
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}

/**
 * Convert any string to a URL-safe slug.
 * Used for district names, temple names, etc.
 * @param {string} str
 * @returns {string}
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
