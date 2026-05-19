// =============================================================================
// Content collections — services, cities, blog
// Mirrors the Peakview Fencing pattern: glob loader from src/content/<type>,
// Zod-validated frontmatter, shared faqItem schema.
// =============================================================================
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faqItem = z.object({
  q: z.string(),
  a: z.string(),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),            // 1-line summary for cards
    metaTitle: z.string(),         // <title> override
    metaDesc: z.string(),          // meta description + OG description
    h1: z.string(),                // visible page heading
    icon: z.enum(['snowflake', 'flame', 'thermo', 'tools', 'alert']),
    accent: z.enum(['blue', 'orange']).default('blue'),
    features: z.array(z.string()).default([]),
    faq: z.array(faqItem).default([]),
    order: z.number().default(100),
    // Optional hero background image. When set, the hero card uses this
    // photo as a background with the brand gradient overlaid at 50%
    // opacity. Provide the slug used by optimize-service-heroes.mjs
    // (e.g. "furnace-repair") — the template fills in /-800.webp,
    // /-1400.webp, /-800.jpg, /-1400.jpg.
    heroImage: z.string().optional(),
  }),
});

// Service category landing pages — Heating / Cooling / Water. Sit one layer
// above individual services in the URL hierarchy at /services/[category]/.
// Kept in their own collection so the `services` glob doesn't pick them up
// as sub-services (which would 404 on the [category]/[slug] route).
const serviceCategories = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/service-categories' }),
  schema: z.object({
    label: z.string(),             // "Heating"
    short: z.string(),             // 1-line summary for nav/cards
    metaTitle: z.string(),
    metaDesc: z.string(),
    h1: z.string(),
    icon: z.enum(['snowflake', 'flame', 'thermo', 'tools', 'alert']),
    accent: z.enum(['blue', 'orange']).default('blue'),
    intro: z.string(),             // category-page hero paragraph
    faq: z.array(faqItem).default([]),
    order: z.number().default(100),
  }),
});

const cities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cities' }),
  schema: z.object({
    name: z.string(),
    metaTitle: z.string(),
    metaDesc: z.string(),
    intro: z.string(),
    permitNote: z.string(),
    neighborhoods: z.array(z.string()).default([]),
    population: z.number().optional(),
    faq: z.array(faqItem).default([]),
    order: z.number().default(100),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDesc: z.string(),
    excerpt: z.string(),
    publishedAt: z.string(),       // ISO date
    updatedAt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    faq: z.array(faqItem).default([]),
  }),
});

export const collections = { services, serviceCategories, cities, blog };
