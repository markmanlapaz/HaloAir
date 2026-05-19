// Optimize the horizontal HALO AIR logo (transparent PNG) for the nav.
// Generates two variants: PNG (fallback) + WebP (modern browsers), both
// at ~2x display density so the nav can render up to ~80px tall crisply.
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'source-assets', 'logo-horizontal.png');

const targets = [
  { fmt: 'webp', w: 600, quality: 88 },
  { fmt: 'png',  w: 600 }, // PNG keeps full alpha; quality knob is N/A
];

// The source export has ~400px of transparent padding below the mark and
// ~200px on each side, which makes the logo float top-left in any flex
// container. Trim the transparent border first so the rendered bounding
// box matches the actual artwork.
for (const t of targets) {
  const out = join(root, 'public', 'images', `logo-horizontal.${t.fmt}`);
  const pipe = sharp(src).trim({ threshold: 5 }).resize({ width: t.w, withoutEnlargement: true });
  if (t.fmt === 'webp') await pipe.webp({ quality: t.quality, alphaQuality: 90 }).toFile(out);
  else                  await pipe.png({ compressionLevel: 9, palette: false }).toFile(out);
  const { size, width, height } = await sharp(out).metadata();
  console.log(`logo-horizontal.${t.fmt}: ${width}×${height}, ${((await fs.stat(out)).size / 1024).toFixed(1)} KB`);
}
