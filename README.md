# BharatDevasthanam — Complete Site Guide

> A free directory of Hindu temples across Kerala, India.
> **25% of all income earned from this site is pledged to elderly temple workers and pauraniks.**

---

## 📁 File Structure

```
kerala-temples/
│
├── index.html            ← Homepage (directory, search, filters, pledge)
├── about.html            ← About page with mission, roadmap, pledge
├── privacy.html          ← Privacy policy (required for AdSense approval)
├── map.html              ← Interactive map page (build separately — see below)
│
├── style.css             ← All styles for every page
├── main.js               ← All JS: search, filter, modals, submit form
├── temples-data.js       ← ★ THE TEMPLE DATABASE — edit this to add temples
│
├── admin/
│   ├── login.html        ← Admin login page
│   └── dashboard.html    ← Admin dashboard (add / edit / delete temples)
│
├── hero-bg.jpg           ← ★ Background photo — download from Unsplash (see below)
├── og-image.jpg          ← Social preview image (1200×630px)
├── favicon.svg           ← Browser tab icon
├── apple-touch-icon.png  ← iOS home screen icon
├── site.webmanifest      ← PWA manifest
│
├── robots.txt            ← Tells Google what to crawl
├── sitemap.xml           ← Submit this to Google Search Console
└── README.md             ← This file
```

---

## 🛕 Adding Temples (`temples-data.js`)

Every temple is one object in the `TEMPLES` array. Copy this template and fill it in:

```js
{
  id: 99,                         // Unique number — increment from last entry
  name: "Temple Full Name",
  deity: "Lord Shiva",            // Use consistent names (check existing entries)
  district: "Thrissur",          // Must match exactly one of the 14 Kerala districts
  location: "Village, Town, District",
  lat: 10.5234,                   // GPS latitude  — right-click on Google Maps → copy coords
  lng: 76.2145,                   // GPS longitude
  timing: "6:00 AM – 12:00 PM, 5:00 PM – 8:00 PM",
  phone: "+91-XXX-XXXXXXX",
  description: "2-3 sentences about history and significance.",
  famous: false,                  // Set true to show ⭐ Famous badge on the card
  tags: ["shiva", "heritage"],
  dressCode: "Men: Dhoti. Women: Saree or churidar.",
  photography: "Not permitted inside.",
  nearestBus: "Bus Stand Name (X km)",
  nearestRail: "Railway Station Name (X km)",
},
```

**Best sources for temple data:**
- Devaswom Board websites (Travancore, Cochin, Malabar)
- Temple's own Facebook page / Google Maps listing
- Wikipedia for history and description
- Local devotees and community contacts

---

## 💰 Google AdSense — Step by Step

### Step 1: Build content first
Google requires original, useful content before approving AdSense.
- Aim for **50+ fully filled temple entries** before applying
- `privacy.html` is already linked in the footer ✅
- Your site must be live on a real domain (not localhost)

### Step 2: Buy a domain
Purchase `bharatdevasthanam.in` (or `.com`) from GoDaddy, Namecheap, or BigRock (~₹800–1200/year).

### Step 3: Host the site (free options)
| Option | Cost | Best for |
|--------|------|----------|
| **GitHub Pages** | Free | Static sites, custom domain supported |
| **Netlify** | Free | Drag-and-drop deploy, fast CDN |
| **Vercel** | Free | Good for future dynamic features |

### Step 4: Apply for AdSense
1. Go to [adsense.google.com](https://adsense.google.com)
2. Sign in → enter your website URL
3. Wait for review (1–14 days)
4. Once approved you get: `ca-pub-XXXXXXXXXXXXXXXX`

### Step 5: Activate ads in `index.html`

Find this block in `<head>` and **uncomment it + replace the ID**:
```html
<!-- FIND THIS: -->
<!--
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
-->

<!-- REPLACE WITH: -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_REAL_ID" crossorigin="anonymous"></script>
```

### Step 6: Replace ad placeholder divs

In `index.html`, find every `<div class="ad-placeholder">` and replace with your ad unit:
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```
Create ad units at: **AdSense Dashboard → Ads → By ad unit → Display ads**

**Ad slot locations in `index.html`:**
| Class | Size | Position |
|-------|------|----------|
| `.ad-top` | 728×90 leaderboard | Below hero |
| `.ad-sidebar` | 300×250 rectangle | Filter sidebar |
| `.ad-mid` | 728×90 banner | Below directory |

### Step 7: Activate Google Analytics

Find this block in `index.html` `<head>`, uncomment and add your ID:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YOUR_REAL_ID');
</script>
```
Get your Measurement ID at [analytics.google.com](https://analytics.google.com) → Create property → Web.

---

## 📮 Temple Submission Form

The submit form (opened via "Suggest an Edit" button on any temple card) currently uses `mailto:` to draft an email. To receive submissions properly:

**Upgrade to Formspree (free, no coding needed):**
1. Go to [formspree.io](https://formspree.io) → create free account → new form
2. Copy your endpoint: `https://formspree.io/f/xabcdefg`
3. In `main.js`, find `handleSubmit()` → replace the `mailto:` block with:
```js
fetch('https://formspree.io/f/xabcdefg', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(r => {
  if (r.ok) showMsg(msg, 'success', '✅ Submitted! We will review it within 2–3 days.');
  else      showMsg(msg, 'error',   'Something went wrong. Please try again.');
})
.catch(() => showMsg(msg, 'error', 'Submission failed. Check your connection.'));
```
Also replace `submit@bharatdevasthanam.in` in `main.js` with your real email.

---

## 🔑 Admin Panel

**URL:** `admin/login.html`

**Default credentials — CHANGE IMMEDIATELY:**
- Username: `admin`
- Password: `kerala2025`

The admin dashboard lets you:
- ➕ Add new temple entries
- ✏️ Edit existing entries
- 🗑️ Delete entries
- 💾 Export the temple list as a JSON file you paste into `temples-data.js`

> ⚠️ The admin panel uses browser `localStorage`. This is fine for one editor.
> For a team, replace with Firebase Firestore or Supabase (both have free tiers).

**To change the password**, open `admin/login.html` and edit this line:
```js
const ADMIN_PASSWORD = 'kerala2025'; // ← change this
```
For better security, move credentials to a backend API.

---

## 🗺️ Building `map.html`

The map uses Leaflet.js (CDN already in `index.html`). To build the map page:

1. Copy the `<header>`, `<footer>`, and cookie banner from `index.html`
2. Add inside `<main>`:
```html
<div id="map" style="height: 80vh; width: 100%;"></div>
```
3. Add this script (after `temples-data.js`):
```js
const map = L.map('map').setView([10.0, 76.5], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

TEMPLES.forEach(t => {
  if (!t.lat || !t.lng) return;
  L.marker([t.lat, t.lng])
   .addTo(map)
   .bindPopup(`<strong>${t.name}</strong><br>${t.deity}<br>${t.location}<br><a href="tel:${t.phone}">${t.phone}</a>`);
});
```

---

## 🖼️ Hero Background Photo

Files that use `hero-bg.jpg`: map section on `index.html`, hero on `about.html`.

**Download a free temple photo:**
- [unsplash.com/s/photos/kerala-temple](https://unsplash.com/s/photos/kerala-temple)
- [pexels.com/search/kerala%20temple](https://www.pexels.com/search/kerala%20temple/)

Recommended: 1920×900px, compressed under 300KB at [squoosh.app](https://squoosh.app). Save as `hero-bg.jpg` in the root folder.

---

## 🔍 SEO Checklist Before Going Live

- [ ] Submit `sitemap.xml` to [Google Search Console](https://search.google.com/search-console)
- [ ] Submit `sitemap.xml` to [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Add Search Console verification `<meta>` tag to all page `<head>` sections
- [ ] Create `og-image.jpg` (1200×630px) for WhatsApp / Facebook previews
- [ ] Add real `favicon.svg` (lamp or temple icon)
- [ ] Replace `submit@bharatdevasthanam.in` with your real email in `main.js`
- [ ] Change admin password in `admin/login.html`
- [ ] Activate Google Analytics (see Step 7 above)
- [ ] Activate AdSense after approval (see Step 5–6 above)
- [ ] Test on mobile: Chrome → F12 → Toggle device toolbar
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/) — aim for 90+ on mobile

---

## 🙏 The 25% Pledge

**25% of all income this site earns goes to elderly temple workers.**

This covers archakas, pauraniks, nadhaswaram players, melam artists, and other lifelong sevaks who spent decades serving Kerala's temples — often with no pension, savings, or formal employment benefits.

**How to honour this pledge as the site grows:**
1. Keep a public `giving.html` page showing income received and donations made
2. Partner with a registered trust or NGO for transparent disbursement
3. Identify recipients through Devaswom Boards and local temple committees
4. Honour recipients by name (with their consent) on the site

This is not a footnote. It is the reason this site exists.

---

## 📞 Contact Details to Set Up

Replace these placeholders in all files once you have a domain:

| Purpose | Placeholder | Replace with |
|---------|-------------|--------------|
| General | `contact@bharatdevasthanam.in` | Your real email |
| Submissions | `submit@bharatdevasthanam.in` | Your real email |
| Privacy | `privacy@bharatdevasthanam.in` | Your real email |
| Site URL | `https://www.bharatdevasthanam.in/` | Your real domain |
| AdSense ID | `ca-pub-XXXXXXXXXXXXXXXX` | Your publisher ID |
| Analytics ID | `G-XXXXXXXXXX` | Your GA4 measurement ID |
