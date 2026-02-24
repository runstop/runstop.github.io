# artisthegame.com

Public Astro website source for `artisthegame.com`, deployed with GitHub Pages.

## What this repo contains

- Only public website source and assets (`src/`, `public/`)
- No private server scripts or non-web project files
- Localized legal-page translation data in `translations/` (for `/[locale]/terms` and `/[locale]/privacy`)

## Deploy flow

- Push to `main`
- GitHub Actions runs `.github/workflows/deploy.yml`
- Workflow builds Astro (`npm ci && npm run build`)
- Pages deploys `dist/`
- Custom domain comes from `public/CNAME`

## DNS setup

Set apex `A` records for `artisthegame.com`:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Set `www` CNAME:

- `runstop.github.io`

## Legal page URLs

- Default English:
  - `https://artisthegame.com/terms`
  - `https://artisthegame.com/privacy`
- Locale-specific:
  - `https://artisthegame.com/en-US/terms`
  - `https://artisthegame.com/fr-FR/privacy`
  - `https://artisthegame.com/de-DE/terms`
