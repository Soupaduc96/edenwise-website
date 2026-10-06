# EdenWise — Christ-Centered Counseling

Website for **EdenWise Ministry**: biblically rooted, clinically informed counseling and formation for singles, engaged couples, marriages and families, with a special heart for the Haitian community.

It's a static site with no build step and no dependencies. Open `index.html` or host the folder anywhere (GitHub Pages, Netlify, Vercel).

## Pages

| Page | What it does |
|---|---|
| Home | Cinematic hero, care pathways, the EdenWise Method, journey, Scripture, Relationship Check-in, care team |
| About | Mission, vision, values, founder's word, five ways we serve |
| Counseling | 7-step session request: who, focus, counselor, format, date and time, intake, review |
| Programs | Premarital, Marriage Enrichment, Singles, Healing & Restoration |
| Academy | Searchable, filterable course catalog |
| EdenSeed | Daily devotional with reflection questions, guided breath prayer and journal |
| Covenant Circle | Fellowship circles, Scripture exchange, prayer wall, membership tiers, FAQ |

The site is available in **English, Français, Kreyòl ayisyen and Español**. Visitors switch with the EN · FR · KR · ES control, and the site remembers their choice.

## Files

```
index.html   page structure and English text
styles.css   design system, layout, animations
app.js       routing, transitions, booking, forms, language switching
i18n.js      French, Kreyòl and Spanish translations
serve.js     tiny local preview server (node serve.js)
```

## Preview on your computer

Double-click `Open-EdenWise.cmd`. It starts the preview server and opens http://localhost:5792. Keep that window open while you browse, and close it to stop the server. If Node.js is not installed, it opens `index.html` directly instead.

## Setup before launch

### 1. Connect the forms
Counseling requests, newsletter sign-ups, prayer requests and circle join requests are sent by email through [Formspree](https://formspree.io):

1. Create a free Formspree account and a new form.
2. Copy its URL, for example `https://formspree.io/f/abcdwxyz`.
3. Paste it into `CONFIG.formEndpoint` at the top of `app.js`.

Until you do this, nothing is sent. Visitors are asked to message EdenWise on Instagram (@_edenwise_) instead, and what they typed is kept.

### 2. Review before going live
- [ ] **Prices** on the membership tiers ($0 / $19 / $39) are placeholders.
- [ ] **Founder quote**, program week-by-week outlines, and courses credited to "EdenWise Faculty" are draft copy.
- [ ] **Community figures** (prayers, circles, scriptures) and sample prayer requests are for the preview.
- [ ] **Translations**: have a native speaker review each language. French verses are Louis Segond 1910 and Spanish verses are Reina-Valera 1909 (both public domain). **Kreyòl verses are working translations**, so replace them with the Bible version your church uses.
- [ ] **Privacy, Terms and Give** currently show "coming soon". Add the real pages or links in `index.html`.
- [ ] **Photos** are from [Unsplash](https://unsplash.com) (free to use). Swap in ministry photography when available.

### Contact & social
- Instagram: https://www.instagram.com/_edenwise_/
- TikTok: https://www.tiktok.com/@edenwise08
- WhatsApp channel: https://whatsapp.com/channel/0029Vb7ESIr7tkj52xn7pX1n

A WhatsApp **channel** is one-way (broadcast). If visitors should be able to message EdenWise directly on WhatsApp, add a `https://wa.me/<number>` link.

### Editing text
- **English:** edit `index.html`, or the data arrays in `app.js` (programs, courses, circles).
- **French, Kreyòl and Spanish:** edit `i18n.js`. Each line maps the English text to its translation. If you change English text, update its key in `i18n.js` too. Run `EW_missing()` in the browser console to list anything untranslated.

## Publishing with GitHub Pages
In the repository, go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then select `main` and `/ (root)`. The site goes live at `https://<username>.github.io/<repo>/`. On a free account, the repository must be public for this.

## Accessibility and performance
- Respects **reduced motion**: animations switch off for visitors who ask for that.
- Visible keyboard focus, a skip link, labelled controls and `lang` attributes for each language.
- Content never depends on animation timing, so pages still show if a browser pauses background work.
- Photos sit on gradient artwork, so slow connections still look finished.
