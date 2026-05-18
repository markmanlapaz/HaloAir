// One-off: generate responsive, compressed variants of the hero photo.
// Run with: node scripts/optimize-hero.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';

const SRC = 'public/images/hero-image.jpg';
const targets = [
  { width: 1200, suffix: '-1200' },
  { width: 2400, suffix: '-2400' },
];

const buf = readFileSync(SRC);
const meta = await sharp(buf).metadata();
console.log(`source: ${meta.width}x${meta.height}  ${(buf.length / 1024).toFixed(0)} KB`);

for (const { width, suffix } of targets) {
  const jpegPath = `public/images/hero-image${suffix}.jpg`;
  const webpPath = `public/images/hero-image${suffix}.webp`;

  await sharp(buf)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(jpegPath);

  await sharp(buf)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(webpPath);

  console.log(
    `  ${width}w  jpg=${(statSync(jpegPath).size / 1024).toFixed(0)} KB` +
      `  webp=${(statSync(webpPath).size / 1024).toFixed(0)} KB`,
  );
}
