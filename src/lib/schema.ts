// =============================================================================
// schema.ts — typed JSON-LD factories
//
// Centralizes every schema.org payload the site emits so each page passes
// data, not hand-written JSON. All nodes are linked back to the global
// HVACBusiness node (id = `${site}/#business`) via `provider.@id` so Google's
// crawler stitches the knowledge graph together correctly.
// =============================================================================
import config from '~/data/business-config.json';

type Maybe<T> = T | undefined;

/**
 * Returns the canonical origin (no trailing slash). Astro injects `Astro.site`
 * from astro.config.mjs; callers pass it in so this file is pure (no Astro
 * globals — keeps the module testable and importable from anywhere).
 */
export function origin(site: URL | undefined): string {
  return (site?.toString().replace(/\/$/, '')) ?? 'https://example.com';
}

export function absoluteUrl(site: URL | undefined, path: string): string {
  return `${origin(site)}${path.startsWith('/') ? path : '/' + path}`;
}

// ---------------------------------------------------------------------------
// HVACBusiness — the canonical global node. Lives in BaseLayout on every
// page; everything else references it by @id.
// ---------------------------------------------------------------------------
export function hvacBusinessSchema(site: URL | undefined, ogImage: string) {
  const base = origin(site);
  const { business, serviceCategories, standaloneServices, serviceAreas } = config;

  // Flatten the nested category structure into a single OfferCatalog. Each
  // sub-service becomes an Offer whose URL points at /services/[category]/[slug].
  // Standalone services (after-hours) sit at /services/[slug].
  const offers: Record<string, unknown>[] = [];
  for (const [, cat] of Object.entries(serviceCategories)) {
    for (const [, s] of Object.entries(cat.services)) {
      offers.push({
        '@type': 'Offer',
        category: cat.label,
        itemOffered: {
          '@type': 'Service',
          name: s.label,
          url: `${base}/services/${cat.slug}/${s.slug}`,
          description: s.short,
        },
      });
    }
  }
  for (const [, s] of Object.entries(standaloneServices)) {
    offers.push({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: s.label,
        url: `${base}/services/${s.slug}`,
        description: s.short,
      },
    });
  }

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    '@id': `${base}/#business`,
    name: business.name,
    alternateName: business.shortName,
    description: `${business.shortName} — ${business.tagline}. Edmonton-based HVAC, plumbing and gas specialists serving the metro area.`,
    url: base,
    telephone: business.phoneE164,
    email: business.email,
    priceRange: '$$',
    image: ogImage,
    logo: `${base}/images/logo.png`,
    // Service-area-only business — owner runs out of a home office and the
    // street address is intentionally NEVER published (site, schema, anywhere).
    // We declare the addressRegion/addressCountry on the areaServed nodes
    // below; Google handles service-area home businesses via the GBP listing.
    areaServed: serviceAreas.map((city) => ({
      '@type': 'City',
      name: city,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Alberta, Canada' },
    })),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    paymentAccepted: 'Cash, Credit Card, Debit, e-Transfer',
    currenciesAccepted: 'CAD',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${business.shortName} services`,
      itemListElement: offers,
    },
    knowsAbout: [
      'AC repair',
      'Furnace installation',
      'Furnace repair',
      'Water heater installation',
      'Water heater repair',
      'HVAC maintenance',
      'Plumbing',
      'Gas line installation',
      'Refrigeration',
    ],
    sameAs: Object.values(business.social).filter((u) => u),
  };

  // Conditional AggregateRating — emitted ONLY when real rating data is present.
  // Embedding placeholder/fake counts violates Google's structured data policy.
  const rating = (business as { rating?: { value: number; count: number } | null }).rating;
  if (rating && rating.value && rating.count) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Founder is intentionally omitted — see project memory: owner name is not
  // to appear on the public site.

  return node;
}

// ---------------------------------------------------------------------------
// Service schema — used on each /services/[...] page.
//
// `slug` may include the category prefix, e.g. "cooling/ac-repair" — in which
// case the URL becomes /services/cooling/ac-repair. Pass `category` and
// `categoryUrl` for sub-services to surface the parent category in the
// schema graph (helps Google understand the topical cluster).
// ---------------------------------------------------------------------------
export interface ServiceSchemaInput {
  name: string;
  description: string;
  slug: string;
  serviceType?: string;
  category?: string;
  categoryUrl?: string;
}
export function serviceSchema(site: URL | undefined, input: ServiceSchemaInput) {
  const base = origin(site);
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${base}/services/${input.slug}#service`,
    name: input.name,
    description: input.description,
    serviceType: input.serviceType ?? input.name,
    url: `${base}/services/${input.slug}`,
    provider: { '@id': `${base}/#business` },
    areaServed: config.serviceAreas.map((city) => ({ '@type': 'City', name: city })),
  };
  if (input.category && input.categoryUrl) {
    node.category = input.category;
    node.isPartOf = {
      '@type': 'WebPage',
      name: input.category,
      url: `${base}${input.categoryUrl}`,
    };
  }
  return node;
}

// ---------------------------------------------------------------------------
// FAQPage schema — used on service, city, and FAQ-bearing blog pages
// ---------------------------------------------------------------------------
export interface FaqItem { q: string; a: string }
export function faqPageSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList — derived from a path string like "/services/ac-repair"
// ---------------------------------------------------------------------------
export interface BreadcrumbItem { name: string; href: string }
export function breadcrumbListSchema(site: URL | undefined, items: BreadcrumbItem[]) {
  const base = origin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.href.startsWith('/') ? item.href : '/' + item.href}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Article schema — used on each blog post
// ---------------------------------------------------------------------------
export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
}
export function articleSchema(site: URL | undefined, input: ArticleSchemaInput) {
  const base = origin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    image: input.image ?? `${base}/og-image.jpg`,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: { '@id': `${base}/#business` },
    publisher: { '@id': `${base}/#business` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}/blog/${input.slug}` },
  };
}

// ---------------------------------------------------------------------------
// City-scoped LocalBusiness — used on each /service-areas/[city] page.
// Subtle but powerful: tells Google "this business serves [City]" with a
// child node that references the parent business but narrows areaServed.
// ---------------------------------------------------------------------------
export function cityLocalBusinessSchema(site: URL | undefined, cityName: string, citySlug: string) {
  const base = origin(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    '@id': `${base}/service-areas/${citySlug}#business`,
    name: `${config.business.shortName} — ${cityName}`,
    parentOrganization: { '@id': `${base}/#business` },
    url: `${base}/service-areas/${citySlug}`,
    telephone: config.business.phoneE164,
    areaServed: { '@type': 'City', name: cityName, containedInPlace: { '@type': 'AdministrativeArea', name: 'Alberta, Canada' } },
    image: `${base}/og-image.jpg`,
  };
}
