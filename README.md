# Congresso do Chopp — Restaurant Web Experience

**Status:** restaurant-focused website; client relationship, approval to publish assets, and deployment status require confirmation.

## Goal

Present restaurant information, menu, events, and contact actions in a responsive static site designed for discoverability and practical use on mobile connections.

## Architecture

- Static HTML/CSS/JavaScript, without a client-side framework or runtime package dependencies
- `assets/` for styles, scripts, and imagery
- `audit-congresso.mjs` for browser-based checks using Playwright
- `.github/workflows/` for existing CI/deployment workflow definitions
- `scripts/` for generating and preparing images

## Local development

Requires Python 3 for the local server and Node.js 20+ for the audit scripts.

```bash
npm ci
npm run dev
# open http://127.0.0.1:8080
```

In a second terminal:

```bash
npm run audit:local
# or strict CI-style audit:
npm run audit:ci
```

These commands are documented but were not executed as part of this README preparation. No performance score or CI success is claimed without run evidence.

## Quality and accessibility checks

The audit script documents checks for metadata, heading structure, alt text, links, touch targets, overflow, contrast, console errors, and loading behavior. Results must be obtained from actual runs.

## Media and business-data limitations

Some media were prepared from publicly visible business profiles and others are illustrative. Permission to redistribute photos must be confirmed. Verify the business address, pricing, operating hours, contact channels, and customer-facing claims against the business's current information before production use.

## Deployment

The repository contains GitHub Pages deployment documentation and workflows. Its default branch currently uses a development-style branch name; verify the actual publishing configuration rather than assuming the site is live.

## License

The package metadata currently declares `UNLICENSED`; do not assume third-party reuse rights.
