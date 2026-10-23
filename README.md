# PopPart Cloud

Personal static site for https://www.poppart.cloud — plain HTML/CSS/JS with no
build step and no dependencies.

## Local preview

Each page fetches `header.html` and `footer.html` at runtime, so the site must be
served over HTTP (opening the files directly via `file://` will not load the
shared header/footer). Any static file server works, for example:

```
python -m http.server 8000
```

then open http://localhost:8000.

## Structure

- `index.html` — home page with the "Start here" navigation chooser.
- `work.html`, `life.html`, `apps.html`, `contact.html` — section pages.
- `header.html`, `footer.html` — shared markup injected into each page by `main.js`.
- `styles.css` — all styling, including light/dark theme tokens.
- `main.js` — all client-side behavior: include loader, theme toggle, nav
  highlighting, tabs, the hero chooser, the contact mailto link, and the music
  browser on `life.html`.

Each page also has a small inline script in `<head>` that applies the saved
theme before first paint, so there is no flash of the wrong theme.

## Music data

The music browser on `life.html` calls a public OutSystems REST API
(`poppart.outsystemscloud.com`) for track metadata and receives audio as base64
data URIs. Everything else on the site is fully static.

## Deploy

Hosted on DigitalOcean App Platform as a static site: it pulls this repository
on push and serves the files as-is. No build command or output directory needs
to be configured.
