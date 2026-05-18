import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Source asset lives outside public/ so the original 2.3MB JPG is never
// served. Generated variants land in public/images/.
const src = join(root, 'source-assets', 'handshake.jpg');

const variants = [
  { w: 500, fmt: 'webp', quality: 72 },
  { w: 500, fmt: 'jpg',  quality: 78 },
  { w: 900, fmt: 'webp', quality: 70 },
  { w: 900, fmt: 'jpg',  quality: 76 },
];

for (const v of variants) {
  const out = join(root, 'public', 'images', `handshake-${v.w}.${v.fmt}`);
  const pipe = sharp(src).resize({ width: v.w, withoutEnlargement: true });
  if (v.fmt === 'webp') await pipe.webp({ quality: v.quality }).toFile(out);
  else await pipe.jpeg({ quality: v.quality, mozjpeg: true }).toFile(out);
  const { size } = await sharp(out).metadata().then(async () => ({ size: (await import('node:fs/promises')).then(fs => fs.stat(out)) })).catch(() => ({ size: null }));
}

// Report sizes
const fs = await import('node:fs/promises');
for (const v of variants) {
  const out = join(root, 'public', 'images', `handshake-${v.w}.${v.fmt}`);
  const s = await fs.stat(out);
  console.log(`handshake-${v.w}.${v.fmt}: ${(s.size / 1024).toFixed(1)} KB`);
}
