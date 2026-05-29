# Deploying BharatDevasthanam to Cloudflare Pages

## Folder structure expected by Cloudflare

```
/ (root — everything in one folder)
├── index.html
├── map.html
├── about.html
├── privacy.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── core/
│   │   │   └── states.js
│   │   ├── public/
│   │   │   ├── main.js
│   │   │   ├── map.js
│   │   │   ├── submit-location.js
│   │   │   └── festivals-data.js
│   │   └── admin/
│   │       └── dashboard.js
│   └── images/
│       ├── hero-bg.jpg
│       ├── favicon/
│       └── sources/
├── data/
│   ├── kerala.json
│   ├── tamil-nadu.json
│   └── karnataka.json
├── _headers           ← Cloudflare security & cache headers
├── _redirects         ← Cloudflare URL redirects
├── robots.txt
├── sitemap.xml
├── login.html
└── dashboard.html
```

---

## Step-by-step deployment

### 1. Create a GitHub repository
1. Go to github.com → New repository
2. Name it `bharatdevasthanam` (or any name)
3. Set to **Public** (required for Cloudflare Pages free tier)
4. Upload all your files (drag and drop in the GitHub web UI, or use GitHub Desktop)

### 2. Connect to Cloudflare Pages
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Left sidebar → **Pages** → **Create a project**
3. Click **Connect to Git** → authorize GitHub
4. Select your repository
5. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave blank)
   - **Build output directory:** `/` (just a slash — root folder)
6. Click **Save and Deploy**

### 3. First deploy takes ~30 seconds
Cloudflare gives you a free URL like:
`https://bharatdevasthanam.pages.dev`

Test it works before connecting your domain.

### 4. Connect your custom domain
1. In Cloudflare Pages → your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `bharatdevasthanam.in` (or `.com`)
4. If domain is registered at another registrar, update nameservers to Cloudflare's
5. If domain is already in Cloudflare DNS, it auto-configures

### 5. Automatic deploys (no manual upload needed)
Every time you push changes to GitHub, Cloudflare rebuilds and redeploys automatically in ~30 seconds.

---

## Data file naming rules

Each state data file is static JSON loaded on demand from `data/<state>.json`.

| File | Loaded by |
| --- | --- |
| `data/kerala.json` | `assets/js/public/main.js`, `assets/js/public/map.js` |
| `data/tamil-nadu.json` | `assets/js/public/main.js`, `assets/js/public/map.js` |
| `data/karnataka.json` | `assets/js/public/main.js`, `assets/js/public/map.js` |

Template for each file:
```json
{
  "_defaults": {
    "dressCode": "...",
    "photography": "..."
  },
  "temples": [
    { "id": 1, "name": "...", "deity": "...", "district": "...", "state": "kerala" }
  ]
}
```

---

## Adding a new state (e.g. Andhra Pradesh)

1. Create `data/andhra-pradesh.json`.
2. In `assets/js/core/states.js` add:
   ```js
   'andhra-pradesh': {
     label: 'Andhra Pradesh',
     eyebrow: '...',
     heroSub: '...',
     statTemples: '...',
     statDistricts: '26',
     mapLabel: 'Explore Andhra Pradesh',
     heroImage: 'assets/images/sources/andhra_hero.jpeg',
     dataFile: 'data/andhra-pradesh.json',
     bodyClass: 'state-andhra-pradesh',
   },
   ```
3. Add hero image to `assets/images/sources/andhra_hero.jpeg` if available.

Homepage tabs, map state links, and dashboard state options are rendered from
`assets/js/core/states.js`.

---

## Hero images

Place one landscape temple photo per state in `assets/images/sources/`:

| File                       | Used for            |
|----------------------------|---------------------|
| `assets/images/sources/kerala_hero.jpeg` | Kerala map section |
| `assets/images/sources/tamilnadu_hero.jpeg` | Tamil Nadu section |
| `assets/images/sources/karnataka_hero.jpeg` | Karnataka section |

Recommended: 1920×900px, compressed to under 300KB each.
Free photos: [unsplash.com/s/photos/kerala-temple](https://unsplash.com/s/photos/kerala-temple)
Compress at: [squoosh.app](https://squoosh.app)

---

## Publishing D1 export back to JSON

Script details live in `scripts/README.md`.

### Option A: direct Wrangler export

If Wrangler is configured locally, export D1 straight into `data/*.json`:

```bash
node scripts/export-d1-to-json.mjs --write
```

The script shows a summary and asks for confirmation before writing unless
`--yes` is passed.

### Option B: dashboard bundle split

The dashboard's D1 all-state bundle is valid JSON, but it is a single object keyed
by state. The public site expects one file per state in `data/`.

Dry-run the split first:

```bash
node scripts/split-d1-export-bundle.mjs templediary-d1-export-YYYY-MM-DD.json
```

Write the split files into `data/`:

```bash
node scripts/split-d1-export-bundle.mjs templediary-d1-export-YYYY-MM-DD.json --write
```

Then review and publish:

```bash
git diff -- data
git add data/*.json
git commit -m "Publish D1 temple data"
git push
```

To update only selected states:

```bash
node scripts/split-d1-export-bundle.mjs templediary-d1-export-YYYY-MM-DD.json --write --states kerala,sikkim
```

---

## Temple submission Worker

The contact form and temple submission modal post to `/api/submit-temple` first. Cloudflare Pages serves this from:

```
functions/api/submit-temple.js
```

For now, submissions are saved in Cloudflare KV. Create a KV namespace in Cloudflare:

1. Cloudflare Dashboard → Workers & Pages → KV
2. Create namespace: `temple_submissions`
3. Go to Pages → your project → Settings → Bindings
4. Add a binding:
   - Variable name: `TEMPLE_SUBMISSIONS`
   - KV namespace: `temple_submissions`

The Pages Function also accepts Cloudflare's common example binding name `KV`, but `TEMPLE_SUBMISSIONS` is clearer for this project.

After this, every successful form submission is saved under a key like:

```
temple-submission/2026-05-21/1779360000000-uuid
```

Later, you can add email delivery with these environment variables:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Preferred Worker mail provider. Sends through Resend. |
| `SUBMISSION_TO_EMAIL` | Destination inbox for Worker submissions. Defaults to `mymail2837@gmail.com`. |
| `SUBMISSION_FROM_EMAIL` | Verified sender for Resend. Defaults to `TempleDiary <submissions@templediary.in>`. |
| `FORM_SUBMIT_EMAIL` | Optional Worker-side FormSubmit fallback if Resend is not configured. |

Browser fallback order is:

1. `/api/submit-temple` Worker, saved to KV
2. FormSubmit AJAX
3. User email client via `mailto:`

## Environment variables (if needed later)

For AdSense ID, Analytics ID etc., you can set these in:
Cloudflare Pages → Settings → Environment variables

Then access them in a build script. For now since this is pure static HTML,
just replace the placeholder IDs directly in `index.html`.
