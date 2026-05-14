# Deploying BharatDevasthanam to Cloudflare Pages

## Folder structure expected by Cloudflare

```
/ (root — everything in one folder)
├── index.html
├── map.html
├── about.html
├── privacy.html
├── style.css
├── main.js
├── map.js
├── kerala-data.js
├── tamil-nadu-data.js
├── karnataka-data.js
├── _headers           ← Cloudflare security & cache headers
├── _redirects         ← Cloudflare URL redirects
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── sources/
│   ├── kerala-hero.jpg
│   ├── tamilnadu-hero.jpg
│   └── karnataka-hero.jpg
└── admin/
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

Each state data file must expose a specific global variable:

| File               | Variable name    |
|--------------------|-----------------|
| `kerala-data.js`   | `TEMPLES_KERALA` |
| `tamil-nadu-data.js`| `TEMPLES_TN`    |
| `karnataka-data.js`| `TEMPLES_KA`    |

Template for each file:
```js
// kerala-data.js
const TEMPLES_KERALA = [
  { id:1, name:"...", deity:"...", district:"...", state:"kerala", ... },
  ...
];
```

---

## Adding a new state (e.g. Andhra Pradesh)

1. Create `andhra-data.js` with `const TEMPLES_AP = [...]`
2. Add `<script src="andhra-data.js"></script>` in **both** `index.html` and `map.html`
3. In `main.js` → `STATE_REGISTRY` add:
   ```js
   'andhra': {
     label: 'Andhra Pradesh',
     eyebrow: '...',
     heroSub: '...',
     statTemples: '...',
     statDistricts: '26',
     mapLabel: 'Explore Andhra Pradesh',
     heroImage: 'sources/andhra-hero.jpg',
     getData: () => (typeof TEMPLES_AP !== 'undefined' ? TEMPLES_AP : []),
     bodyClass: 'state-andhra',
   },
   ```
4. In `map.js` → `STATE_DATA` and `STATE_VIEWS` add `'andhra'` entry
5. Add a tab button in `index.html` state-switcher bar
6. Add a link in `map.html` state bar
7. Add hero image to `sources/andhra-hero.jpg`

---

## Hero images (sources/ folder)

Place one landscape temple photo per state in the `sources/` folder:

| File                       | Used for            |
|----------------------------|---------------------|
| `sources/kerala-hero.jpg`  | Kerala map section  |
| `sources/tamilnadu-hero.jpg`| Tamil Nadu section |
| `sources/karnataka-hero.jpg`| Karnataka section  |

Recommended: 1920×900px, compressed to under 300KB each.
Free photos: [unsplash.com/s/photos/kerala-temple](https://unsplash.com/s/photos/kerala-temple)
Compress at: [squoosh.app](https://squoosh.app)

---

## Environment variables (if needed later)

For AdSense ID, Analytics ID etc., you can set these in:
Cloudflare Pages → Settings → Environment variables

Then access them in a build script. For now since this is pure static HTML,
just replace the placeholder IDs directly in `index.html`.
