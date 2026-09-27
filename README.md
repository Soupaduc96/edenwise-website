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

The site is available in **English, Français and Kreyòl ayisyen**. Visitors switch with the EN · FR · KR control, and the site remembers their choice.

## Files

```
index.html   page structure and English text
styles.css   design system, layout, animations
app.js       routing, transitions, booking, forms, language switching
i18n.js      French and Kreyòl translations
```

## Setup before launch

### 1. Connect the forms
Counseling requests, newsletter sign-ups, prayer requests and circle join requests are sent by email through [Formspree](https://formspree.io):

1. Create a free Formspree account and a new form.
2. Copy its URL, for example `https://formspree.io/f/abcdwxyz`.
3. Paste it into `CONFIG.formEndpoint` at the top of `app.js`.

Until you do this, nothing is sent. Visitors are asked to email `hello@edenwise.org` instead, and what they typed is kept.

### 2. Review before going live
- [ ] **Prices** on the membership tiers ($0 / $19 / $39) are placeholders.
- [ ] **Founder quote**, program week-by-week outlines, and courses credited to "EdenWise Faculty" are draft copy.
- [ ] **Community figures** (prayers, circles, scriptures) and sample prayer requests are for the preview.
- [ ] **Translations**: have a native speaker review both languages. French verses are Louis Segond 1910 (public domain). **Kreyòl verses are working translations**, so replace them with the Bible version your church uses.
- [ ] **Social links, Privacy, Terms and Give** currently show "coming soon". Add the real links in `index.html`.
- [ ] **Photos** are from [Unsplash](https://unsplash.com) (free to use). Swap in ministry photography when available.

### Editing text
- **English:** edit `index.html`, or the data arrays in `app.js` (programs, courses, circles).
- **French and Kreyòl:** edit `i18n.js`. Each line maps the English text to its translation. If you change English text, update its key in `i18n.js` too. Run `EW_missing()` in the browser console to list anything untranslated.

## Publishing with GitHub Pages
In the repository, go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then select `main` and `/ (root)`. The site goes live at `https://<username>.github.io/<repo>/`. On a free account, the repository must be public for this.

## Accessibility and performance
- Respects **reduced motion**: animations switch off for visitors who ask for that.
- Visible keyboard focus, a skip link, labelled controls and `lang` attributes for each language.
- Content never depends on animation timing, so pages still show if a browser pauses background work.
- Photos sit on gradient artwork, so slow connections still look finished.
