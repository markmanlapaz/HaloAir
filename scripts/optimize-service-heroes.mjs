import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const sources = [
  { name: 'furnace-repair',             src: 'furnace-repair.png' },
  { name: 'furnace-installation',       src: 'furnace-installation.png' },
  { name: 'furnace-maintenance',        src: 'furnace-maintenance.png' },
  { name: 'ac-installation',            src: 'ac-installation.png' },
  { name: 'ac-service',                 src: 'ac-service.png' },
  { name: 'water-heater-installation',  src: 'water-heater-installation.png' },
  { name: 'tankless-water-heater',      src: 'tankless-water-heater.png' },
];

const variants = [
  { w: 800,  fmt: 'webp', quality: 70 },
  { w: 800,  fmt: 'jpg',  quality: 76 },
  { w: 1400, fmt: 'webp', quality: 68 },
  { w: 1400, fmt: 'jpg',  quality: 74 },
];

await fs.mkdir(join(root, 'public', 'images'), { recursive: true });

for (const s of sources) {
  const src = join(root, 'source-assets', s.src);
  for (const v of variants) {
    const out = join(root, 'public', 'images', `${s.name}-${v.w}.${v.fmt}`);
    const pipe = sharp(src).resize({ width: v.w, withoutEnlargement: true });
    if (v.fmt === 'webp') await pipe.webp({ quality: v.quality }).toFile(out);
    else                  await pipe.jpeg({ quality: v.quality, mozjpeg: true }).toFile(out);
    const { size } = await fs.stat(out);
    console.log(`${s.name}-${v.w}.${v.fmt}: ${(size / 1024).toFixed(1)} KB`);
  }
}
