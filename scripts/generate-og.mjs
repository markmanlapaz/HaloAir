// =============================================================================
// generate-og.mjs — one-shot OG image generator for Halo Air.
//
// Produces public/og-image.jpg at 1200×630 (the size Facebook, X, LinkedIn
// and SMS previews expect). Reads the existing logo PNG, composites it on
// a brand-gradient background with the tagline text.
//
// Run with:  node scripts/generate-og.mjs
// Re-run any time the logo or tagline changes.
// =============================================================================
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LOGO_PATH = join(ROOT, 'public', 'images', 'logo.png');
const OUT_PATH = join(ROOT, 'public', 'og-image.jpg');
const W = 1200;
const H = 630;

// ---------------------------------------------------------------------------
// SVG layer for the background + brand atmosphere + right-side text.
// We composite the logo PNG on top of this in a second sharp step (PNGs
// inside SVGs via <image href="..."> can't be safely loaded by all sharp
// builds, so we use sharp.composite() for the raster).
// ---------------------------------------------------------------------------
const bgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0F1C"/>
      <stop offset="55%" stop-color="#03203F"/>
      <stop offset="100%" stop-color="#0A0F1C"/>
    </linearGradient>
    <radialGradient id="haloBlue" cx="25%" cy="40%" r="40%">
      <stop offset="0%" stop-color="#1E90FF" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#1E90FF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="haloOrange" cx="75%" cy="65%" r="40%">
      <stop offset="0%" stop-color="#FF5A1F" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#FF5A1F" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="airBlue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3FA9FF"/>
      <stop offset="100%" stop-color="#0A6FD8"/>
    </linearGradient>
  </defs>

  <!-- Background gradient + brand halos -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#haloBlue)"/>
  <rect width="${W}" height="${H}" fill="url(#haloOrange)"/>

  <!-- Right-side wordmark + tagline -->
  <g font-family="Inter, system-ui, sans-serif" text-rendering="geometricPrecision">
    <text x="560" y="265" font-weight="900" font-size="98" letter-spacing="-3" fill="#FFFFFF">HALO</text>
    <text x="560" y="370" font-weight="900" font-size="98" letter-spacing="-3" fill="url(#airBlue)">AIR</text>

    <!-- Rule + subtitle -->
    <line x1="560" y1="412" x2="620" y2="412" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2"/>
    <text x="635" y="418" font-weight="700" font-size="22" letter-spacing="6" fill="#FFFFFF" fill-opacity="0.85">HEATING &amp; COOLING</text>
    <line x1="1015" y1="412" x2="1075" y2="412" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2"/>

    <text x="560" y="478" font-weight="500" font-style="italic" font-size="28" fill="#FFFFFF" fill-opacity="0.78">Next-level Comfort.</text>

    <!-- Phone CTA -->
    <text x="560" y="540" font-weight="700" font-size="26" fill="#FF8A4A">📞 780-224-0024</text>

    <!-- Service area line -->
    <text x="560" y="582" font-weight="500" font-size="18" fill="#FFFFFF" fill-opacity="0.65">Edmonton · Sherwood Park · St. Albert · Spruce Grove · Leduc</text>
  </g>

  <!-- Bottom-left brand tag -->
  <g font-family="Inter, system-ui, sans-serif">
    <rect x="60" y="555" width="190" height="40" rx="20" fill="#FF5A1F"/>
    <text x="155" y="582" font-weight="800" font-size="16" letter-spacing="1.5" fill="#FFFFFF" text-anchor="middle">BOOK ONLINE →</text>
  </g>
</svg>
`;

// Build the gradient base first
const base = await sharp(Buffer.from(bgSvg)).png().toBuffer();

// Resize the logo to ~420px tall so it dominates the left half of the canvas
const logoBuffer = await sharp(readFileSync(LOGO_PATH))
  .resize({ height: 420, fit: 'inside' })
  .png()
  .toBuffer();

// Composite logo over background, output JPG (smaller than PNG for OG)
await sharp(base)
  .composite([
    {
      input: logoBuffer,
      // Logo lives in the left ~half, vertically centered. Tuned visually
      // so the halo arc reads cleanly without crowding the wordmark text.
      gravity: 'west',
      left: 80,
      top: Math.round((H - 420) / 2),
    },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(OUT_PATH);

const meta = await sharp(OUT_PATH).metadata();
console.log(`✔ Wrote ${OUT_PATH}`);
console.log(`  ${meta.width}×${meta.height}  ${Math.round((meta.size ?? 0) / 1024)} KB`);
