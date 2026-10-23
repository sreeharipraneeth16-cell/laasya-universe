# Laasya — a universe, just for you ✨

A single-page, self-contained cinematic proposal site made for **Laasya**.

**Live site:** https://sreeharipraneeth16-cell.github.io/laasya-universe/

## What's inside

- A WebGL nebula that drifts and reacts to the pointer
- A particle heart orbiting her photo, with a canvas starfield and shooting stars
- Seven clickable constellation stars — seven reasons
- Pinned horizontal "moments" on desktop, a swipeable-feeling stack on mobile
- A sealed letter that opens into a full page
- The question, a runaway "no" button, confetti, and a takeover celebration
- A downloadable "Certificate of Us" rendered in canvas
- Generative ambient sound (off by default)
- Everything in one `index.html`: CSS, JavaScript, and the photo embedded

## Editing

The editable sources live in `source/`:

| File | Purpose |
| --- | --- |
| `source/index.html` | Markup and copy |
| `source/styles.css` | All styles |
| `source/script.js` | Nebula, particles, constellation, letter, confetti, certificate, sound |
| `source/build.js` | Inlines CSS/JS and embeds the photo |

Rebuild the single file with:

```bash
node source/build.js
```

The source photo is `assets/best-moment.jpg` and gets embedded twice (hero orb + letter) in the built `index.html`.

---

Made with a whole sky. 💗
