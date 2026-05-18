import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// TODO: Replace 'https://example.com' with the production domain before deploying to SiteGround.
// This value is the canonical origin used by @astrojs/sitemap and every <link rel="canonical"> tag.
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
