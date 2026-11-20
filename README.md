# UniCre8 (UC8) — website

One-page site for **UniCre8**, a digital marketing, content and web studio.
Plain HTML, CSS and JavaScript — no build step.

## Run locally

```bash
python -m http.server 8765
```

Then open <http://localhost:8765>. Any static server works.

## Deploy

Upload the folder as-is to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

## Structure

```
index.html            home page: intro, hero, about, work, process, services, contact
team.html             "Meet the team" page (founders + co-founders), opened from Team in the top bar
site.webmanifest      app name and icons
css/styles.css        all styling (colour and font tokens at the top)
js/segments.js        seven-segment UC8 logo (intro, nav, footer)
js/lens.js            camera-lens renderer used by the intro
js/intro.js           "Lens to Logo" intro: power-on, flight into the nav, skip, replay
js/hero-hub.js        hero animation: glass hub, 3D orbiting icons, circuit lines, notifications
js/background.js      moving line-ribbon background
js/data.js            CONTENT — projects, services, client logos  ← edit here
js/main.js            scrolling and motion (Lenis + GSAP), work table, filters, form
assets/               favicons, app icons, team photos (assets/team)
```

## Editing content

| What | Where |
|---|---|
| Projects / case studies | `js/data.js` → `UC8_PROJECTS` (filter tabs appear automatically for new categories) |
| Services | `js/data.js` → `UC8_SERVICES` |
| Client logos (section hidden for now) | add `{ name, img }` to `UC8_CLIENTS` in `js/data.js`, then un-comment the CLIENTS block in `index.html` |
| Team | `team.html`; photos in `assets/team/` (square `.webp`, 720 × 720) |
| Contact form delivery | `js/main.js` → `FORM_ENDPOINT` (e.g. a Formspree URL). Until set, the form opens the visitor's email app addressed to unicreate9999@gmail.com |

After changing CSS or JS, bump the `?v=` number on the file links in `index.html` so browsers load the new version.

## Notes

- The intro plays on every visit and when the UC8 logo in the nav is clicked. Links from the team page to a home section (e.g. Work) go straight to that section without the intro. Click, Esc, Enter, Space or "Skip intro" skips it. Sound is opt-in.
- Animations pause off-screen and respect the visitor's "reduce motion" setting.
- Tested in Chrome, Firefox and Safari (WebKit) from 320 px phones to 1920 px desktops.
