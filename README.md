# Poppart Cloud

Personal static site for https://www.poppart.cloud — plain HTML/CSS/JS with no
build step and no dependencies.

## Local preview

Any static file server works, for example:

```
python -m http.server 8000
```

then open http://localhost:8000. The pages also work opened directly, but the
music browser on `life.html` needs an HTTP origin for its API calls.

## Structure

- `index.html` — home page with the "Start here" navigation menu.
- `work.html`, `life.html`, `apps.html`, `contact.html` — section pages.
- `404.html` — not-found page served for unknown paths.
- `styles.css` — all styling, including light/dark theme tokens.
- `theme.js` — synchronous pre-paint script that applies the saved theme so
  there is no flash of the wrong theme.
- `main.js` — all client-side behavior: theme toggle, nav highlighting, tabs,
  the hero chooser, the contact mailto link, and the music browser on
  `life.html`.
- `favicon.svg`, `og-image.png`, `robots.txt`, `sitemap.xml` — site assets and
  crawler metadata.

The shared header/footer markup is inlined in each page (marked with
`Shared header` / `Shared footer` comments) — keep the copies in sync when
editing. Each page also sets a strict Content-Security-Policy via `<meta>`;
update the `connect-src`/`media-src` directives there if new external sources
are added.

## Music data

The music browser on `life.html` calls a public OutSystems REST API
(`poppart.outsystemscloud.com`) for track metadata and receives audio as base64
data URIs. Everything else on the site is fully static.

## Deploy

Hosted on DigitalOcean App Platform as a static site: it pulls this repository
on push and serves the files as-is. No build command or output directory needs
to be configured. `404.html` is served automatically for unmatched paths.
