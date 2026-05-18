# Halo Air — Marketing Site

Astro + Tailwind static site for **Halo Air Heating & Cooling** (Edmonton, AB).

Phase 1 of 2 — frontend marketing site with working booking & contact forms.
Phase 2 will swap the booking form's POST target to an Anthropic-powered AI
dispatcher that auto-books into Google Calendar.

## Stack

- **Astro 5** (static output — no SSR)
- **Tailwind CSS v3** via `@astrojs/tailwind`
- **TypeScript** (strict)
- **@astrojs/sitemap** for automatic `sitemap-index.xml`
- **Forms (Phase 1):** Web3Forms (free, no signup; access key in `.env`)

## Local development

```bash
cp .env.example .env
# Fill in PUBLIC_WEB3FORMS_KEY from https://web3forms.com
npm install
npm run dev          # http://localhost:4321
npm run build        # outputs to ./dist
npm run preview      # serve ./dist locally
```

## Project structure

```
src/
├── pages/              one .astro file per route
├── components/         reusable UI (Header, Footer, BookingForm, ...)
├── layouts/
│   └── BaseLayout.astro   <head>, SEO, JSON-LD, page chrome
├── data/
│   └── business-config.json   single source of truth for hours / services / areas
└── styles/
    └── global.css      Tailwind directives + component classes
```

## Updating business info

Everything that changes day-to-day (phone, hours, service areas, services
offered) lives in **`src/data/business-config.json`**. Edit there and it
propagates everywhere — Header, Footer, schema markup, dropdowns, all pages.

## Deployment (SiteGround)

1. `npm run build` produces a fully static `dist/` directory.
2. Upload the **contents of `dist/`** to SiteGround's public-facing folder
   (typically `public_html`), or connect Git deployment in Site Tools.
3. Before deploying, update:
   - `astro.config.mjs` → `site:` to the real production URL
   - `public/robots.txt` → sitemap URL
   - `.env` on the build environment → `PUBLIC_WEB3FORMS_KEY`

## Phase 2 swap process (AI dispatcher)

When the Phase 2 backend is ready, this is the entire frontend change:

1. Stand up the Node API endpoint that accepts the booking payload and
   returns `{ success: true }` (matching the Web3Forms shape).
2. Open **`src/components/BookingForm.astro`** — the only file that needs to
   change.
3. Edit the `BOOKING_ENDPOINT` constant (top of `<script>` block) to point at
   your new endpoint.
4. Delete the four hidden Web3Forms inputs (`access_key`, `subject`,
   `from_name`, `botcheck`) — your endpoint won't need them.
5. Populate the new server-side env vars: `ANTHROPIC_API_KEY`,
   `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`,
   `RESEND_API_KEY` (placeholders already exist in `.env.example`).

No other frontend file should need to change. All booking fields are already
named for what the AI dispatcher will consume (`urgency`, `service_type`,
`preferred_window`, `booking_id`, etc.).

## Key architectural decisions

- **`business-config.json` is the source of truth.** A trades business owner
  will want to change hours / phone / service areas without touching code.
  One file, one edit, propagates everywhere.
- **No `localStorage` / `sessionStorage`.** Per the brief. Booking ID is held
  in a hidden form input only, generated client-side at mount.
- **HVACBusiness schema in BaseLayout.** Every page reinforces the local-SEO
  signal — Google needs to see it consistently to populate the knowledge
  panel and "near me" results.
- **Form is a single isolated file.** Phase 2 should touch one file, not ten.
- **Skip-link, focus rings, `aria-live`, `prefers-reduced-motion`.** A11y is
  baked in, not bolted on.

## What's NOT built yet (next iteration)

Per the brief, this commit stops after the homepage so you can review the
direction. Remaining pages:

- `/about` `/services` (overview) `/services/[slug]` (5 service pages)
- `/service-areas` `/contact` `/privacy` `/terms`
- ContactForm component (mirrors BookingForm but lighter)
- OG share image at `public/og-image.jpg`
- Favicon at `public/favicon.svg`
