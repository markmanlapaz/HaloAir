import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Canonical origin used by @astrojs/sitemap and every <link rel="canonical"> tag.
// Must match what visitors actually see in the address bar for SEO/canonicals
// to work — keep in sync with the SiteGround-served domain.
export default defineConfig({
  site: 'https://haloairhvac.com',
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
