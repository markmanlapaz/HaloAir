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

for (const t of targets) {
  const out = join(root, 'public', 'images', `logo-horizontal.${t.fmt}`);
  const pipe = sharp(src).resize({ width: t.w, withoutEnlargement: true });
  if (t.fmt === 'webp') await pipe.webp({ quality: t.quality, alphaQuality: 90 }).toFile(out);
  else                  await pipe.png({ compressionLevel: 9, palette: false }).toFile(out);
  const { size } = await fs.stat(out);
  console.log(`logo-horizontal.${t.fmt}: ${(size / 1024).toFixed(1)} KB`);
}
