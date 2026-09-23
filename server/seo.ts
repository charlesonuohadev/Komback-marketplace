import fs from 'fs';
import path from 'path';
import { prisma } from './db';

/**
 * Server-rendered SEO + GEO layer.
 *
 * The storefront is a single-page app, so without this every URL would return the
 * same `<title>` and no structured data. Here the server resolves the route from
 * PostgreSQL and injects route-specific meta tags and JSON-LD into the HTML shell,
 * so classic crawlers AND AI answer engines get complete, accurate markup.
 */

const SITE_NAME = 'Komback';
const DEFAULT_TITLE = `Komback — Nigeria's Marketplace for Everything | Buy & Sell Safely`;
const DEFAULT_DESCRIPTION =
  "Komback is Nigeria's multi-vendor marketplace. Buy and sell phones, vehicles, electronics, fashion, real estate and groceries from verified sellers with escrow-protected payments and nationwide waybill delivery.";
const DEFAULT_KEYWORDS =
  'Nigeria marketplace, buy and sell in Nigeria, verified sellers Nigeria, Lagos marketplace, escrow payments Nigeria, online shopping Nigeria, Komback';

const DEFAULT_OG_IMAGE = '/images/logo.png';

export interface SeoPayload {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  robots: string;
  ogType: string;
  ogImage: string;
  jsonLd: unknown[];
}

function siteUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function absolute(url: string): string {
  if (!url) return `${siteUrl()}${DEFAULT_OG_IMAGE}`;
  if (url.startsWith('http')) return url;
  return `${siteUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

function truncate(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// Short-lived metadata cache
// ---------------------------------------------------------------------------

/**
 * Crawlers and AI agents tend to request the same URLs repeatedly. Caching the
 * resolved metadata for a minute keeps those requests off PostgreSQL while
 * staying fresh enough that price and stock edits surface quickly.
 */
const META_TTL_MS = 60_000;
const META_MAX_ENTRIES = 500;
const metaCache = new Map<string, { at: number; payload: SeoPayload }>();

async function resolveSeo(pathname: string, search: string): Promise<SeoPayload> {
  const key = `${pathname}${search || ''}`;
  const hit = metaCache.get(key);
  if (hit && Date.now() - hit.at < META_TTL_MS) return hit.payload;

  const payload = await resolveSeoUncached(pathname, search);

  if (metaCache.size >= META_MAX_ENTRIES) {
    const oldest = metaCache.keys().next().value;
    if (oldest) metaCache.delete(oldest);
  }
  metaCache.set(key, { at: Date.now(), payload });
  return payload;
}

export { resolveSeo };

// ---------------------------------------------------------------------------
// Structured data builders
// ---------------------------------------------------------------------------

function organisationNode() {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl()}/#organization`,
    name: SITE_NAME,
    url: siteUrl(),
    logo: absolute(DEFAULT_OG_IMAGE),
    description: DEFAULT_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'Nigeria' },
    address: { '@type': 'PostalAddress', addressCountry: 'NG', addressRegion: 'Lagos' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@komback.com',
        availableLanguage: ['en'],
        areaServed: 'NG',
      },
    ],
  };
}

function websiteNode(stats?: { listings: number }) {
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl()}/#website`,
    url: siteUrl(),
    name: SITE_NAME,
    inLanguage: 'en-NG',
    publisher: { '@id': `${siteUrl()}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl()}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    ...(stats ? { numberOfItems: stats.listings } : {}),
  };
}

function breadcrumbNode(trail: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl()}${item.url}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Route resolution
// ---------------------------------------------------------------------------

async function platformStats() {
  try {
    const [listings, stores, categories] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE', isHidden: false } }),
      prisma.store.count({ where: { isActive: true, isSuspended: false } }),
      prisma.category.count({ where: { isActive: true } }),
    ]);
    return { listings, stores, categories };
  } catch {
    return { listings: 0, stores: 0, categories: 0 };
  }
}

/**
 * Each database lookup is isolated so a single failing query can never strip the
 * page of its metadata — the worst case is falling back to the route defaults.
 */
async function safe<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

function findProduct(slug: string) {
  return safe(() =>
    prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }, { uniqueId: slug }] },
      include: { store: true, category: true },
    })
  );
}

function findPost(key: string) {
  return safe(() => prisma.blogPost.findFirst({ where: { OR: [{ id: key }, { slug: key }] } }));
}

function findStore(key: string) {
  return safe(() =>
    prisma.store.findFirst({
      where: { OR: [{ id: key }, { slug: key }, { name: key }] },
      include: { category: true, _count: { select: { products: true } } },
    })
  );
}

function findCategory(key: string) {
  return safe(() => prisma.category.findFirst({ where: { OR: [{ slug: key }, { id: key }] } }));
}

function topCategories() {
  return safe(() =>
    prisma.category.findMany({ where: { isActive: true }, take: 12, orderBy: { sortOrder: 'asc' } })
  );
}

/** Resolves SEO metadata for any storefront path. Never throws. */
export async function resolveSeoUncached(pathname: string, search: string): Promise<SeoPayload> {
  const canonical = `${siteUrl()}${pathname === '/' ? '' : pathname}${search || ''}`;

  const base: SeoPayload = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    canonical,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: absolute(DEFAULT_OG_IMAGE),
    jsonLd: [],
  };

  // The admin console is never indexed.
  if (pathname.startsWith('/admin-cp')) {
    return { ...base, robots: 'noindex, nofollow', title: 'Super Admin — Komback' };
  }

  const privatePaths = ['/account', '/cart', '/wishlist', '/track-order'];
  if (privatePaths.some((prefix) => pathname.startsWith(prefix))) {
    return { ...base, robots: 'noindex, follow' };
  }

  try {
    const stats = await platformStats();

    // ---- Product permalink: /<product-slug> --------------------------------
    const slug = pathname.replace(/^\//, '');
    if (slug && !slug.includes('/') && slug.length > 3) {
      const product = await findProduct(slug);

      if (product) {
        const availability = product.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock';
        const priceValidUntil = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0];

        return {
          ...base,
          title: truncate(`${product.title} — ₦${product.price.toLocaleString('en-NG')} on ${SITE_NAME}`, 110),
          description: truncate(
            `${product.title} for ₦${product.price.toLocaleString('en-NG')} from ${product.store.name} in ${product.state}. ${product.description}`
          ),
          keywords: [
            product.title,
            product.category.name,
            `${product.category.name} Nigeria`,
            `buy ${product.category.name} ${product.state}`,
            product.store.name,
          ].join(', '),
          ogType: 'product',
          ogImage: absolute(product.images[0] ?? DEFAULT_OG_IMAGE),
          jsonLd: [
            {
              '@type': 'Product',
              '@id': `${canonical}#product`,
              name: product.title,
              description: truncate(product.description, 400),
              image: product.images.map(absolute),
              sku: product.uniqueId,
              category: product.category.name,
              brand: { '@type': 'Brand', name: product.store.name },
              offers: {
                '@type': 'Offer',
                url: canonical,
                priceCurrency: 'NGN',
                price: product.price,
                priceValidUntil,
                availability,
                itemCondition: 'https://schema.org/NewCondition',
                seller: { '@type': 'Organization', name: product.store.name },
                areaServed: { '@type': 'Country', name: 'Nigeria' },
              },
              ...(product.reviewsCount > 0
                ? {
                    aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: product.rating,
                      reviewCount: product.reviewsCount,
                      bestRating: 5,
                      worstRating: 1,
                    },
                  }
                : {}),
            },
            breadcrumbNode([
              { name: 'Home', url: '/' },
              { name: product.category.name, url: `/category/${product.category.slug}` },
              { name: product.title, url: `/${product.slug}` },
            ]),
          ],
        };
      }
    }

    // ---- Blog article: /blog/<id> -----------------------------------------
    if (pathname.startsWith('/blog/')) {
      const key = pathname.replace('/blog/', '');
      const post = await findPost(key);
      if (post) {
        return {
          ...base,
          title: truncate(`${post.title} | Komback Blog`, 110),
          description: truncate(post.excerpt),
          keywords: post.tags.join(', '),
          ogType: 'article',
          ogImage: absolute(post.image || DEFAULT_OG_IMAGE),
          jsonLd: [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.excerpt,
              image: absolute(post.image || DEFAULT_OG_IMAGE),
              datePublished: post.publishedAt.toISOString(),
              dateModified: post.updatedAt.toISOString(),
              inLanguage: 'en-NG',
              author: { '@type': 'Person', name: post.authorName },
              publisher: { '@id': `${siteUrl()}/#organization` },
              mainEntityOfPage: canonical,
            },
            breadcrumbNode([
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: post.title, url: `/blog/${post.slug}` },
            ]),
          ],
        };
      }
    }

    // ---- Store: /store/<id> ------------------------------------------------
    if (pathname.startsWith('/store/')) {
      const key = pathname.replace('/store/', '');
      const store = await findStore(key);
      if (store) {
        const storeCategory = store.category?.name ?? 'Komback';
        return {
          ...base,
          title: truncate(`${store.name} — verified ${storeCategory} merchant in ${store.state}`, 110),
          description: truncate(`${store.tagline}. ${store.description}`),
          keywords: `${store.name}, ${storeCategory}, verified seller ${store.state}, Komback store`,
          ogImage: absolute(store.coverImage || store.avatar || DEFAULT_OG_IMAGE),
          jsonLd: [
            {
              '@type': 'OnlineStore',
              name: store.name,
              description: store.description,
              url: canonical,
              image: absolute(store.coverImage || store.avatar || DEFAULT_OG_IMAGE),
              telephone: store.phone,
              address: {
                '@type': 'PostalAddress',
                addressLocality: store.location,
                addressRegion: store.state,
                addressCountry: 'NG',
              },
              ...(store.reviewsCount > 0
                ? {
                    aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: store.rating,
                      reviewCount: store.reviewsCount,
                    },
                  }
                : {}),
              numberOfItems: store._count.products,
            },
            breadcrumbNode([
              { name: 'Home', url: '/' },
              { name: 'Stores', url: '/stores' },
              { name: store.name, url: `/store/${store.id}` },
            ]),
          ],
        };
      }
    }

    // ---- Category: /category/<slug> ---------------------------------------
    if (pathname.startsWith('/category/')) {
      const key = pathname.replace('/category/', '');
      const category = await findCategory(key);
      if (category) {
        return {
          ...base,
          title: truncate(`${category.name} in Nigeria — Buy & Sell on ${SITE_NAME}`, 110),
          description: truncate(
            `${category.description} Browse ${category.name} listings from verified Nigerian sellers on Komback with escrow-protected payments.`
          ),
          keywords: `${category.name} Nigeria, buy ${category.name}, ${category.popularSubcategories.join(', ')}`,
          ogImage: absolute(category.image || DEFAULT_OG_IMAGE),
          jsonLd: [
            {
              '@type': 'CollectionPage',
              name: `${category.name} in Nigeria`,
              description: category.description,
              url: canonical,
              inLanguage: 'en-NG',
            },
            breadcrumbNode([
              { name: 'Home', url: '/' },
              { name: category.name, url: `/category/${category.slug}` },
            ]),
          ],
        };
      }
    }

    // ---- Static routes ----------------------------------------------------
    const staticRoutes: Record<string, { title: string; description: string; keywords: string }> = {
      '/products': {
        title: `Browse all listings — ${stats.listings.toLocaleString('en-NG')} items on ${SITE_NAME}`,
        description:
          'Search every listing on Komback: phones, vehicles, electronics, fashion, real estate, groceries and services from verified Nigerian merchants.',
        keywords: 'browse listings Nigeria, marketplace listings, buy online Nigeria',
      },
      '/stores': {
        title: `Verified Nigerian stores — ${stats.stores.toLocaleString('en-NG')} merchants on ${SITE_NAME}`,
        description:
          'Discover verified Nigerian merchants on Komback. Compare ratings, response rates and storefront policies before you buy.',
        keywords: 'verified sellers Nigeria, online stores Nigeria, merchant directory',
      },
      '/deals': {
        title: `Today's deals & discounts in Nigeria | ${SITE_NAME}`,
        description:
          "The best daily deals across Nigeria — discounted phones, electronics, fashion and more, all escrow protected.",
        keywords: "Nigeria deals, discounts Nigeria, cheap phones Nigeria, daily deals",
      },
      '/blog': {
        title: `Komback Blog — buying guides, safety tips and Nigerian market insights`,
        description:
          'Practical guides on buying safely online in Nigeria, pricing trends, side hustles and marketplace growth for merchants.',
        keywords: 'Nigeria ecommerce blog, buying guides, online safety Nigeria',
      },
      '/sell': {
        title: `Sell online in Nigeria — open a free storefront | ${SITE_NAME}`,
        description:
          'List your products on Komback for free, reach buyers nationwide, and get paid through escrow-protected settlements.',
        keywords: 'sell online Nigeria, open online store Nigeria, free storefront',
      },
      '/about-us': {
        title: `About ${SITE_NAME} — Nigeria's escrow-protected marketplace`,
        description:
          'Komback connects Nigerian buyers and verified merchants with escrow-protected payments, waybill logistics and transparent reviews.',
        keywords: 'about Komback, Nigeria marketplace company',
      },
      '/safety': {
        title: `Shopping safety & anti-scam guide | ${SITE_NAME}`,
        description:
          'How Komback protects buyers and sellers: escrow payments, verified merchants, inspection PINs and dispute resolution.',
        keywords: 'online shopping safety Nigeria, avoid scam Nigeria, escrow protection',
      },
      '/track-order': {
        title: `Track your order & waybill | ${SITE_NAME}`,
        description:
          'Follow your Komback order in real time — courier handover, waybill status and escrow release after inspection.',
        keywords: 'track order Nigeria, waybill tracking, GIG logistics tracking',
      },
    };

    const staticMatch = staticRoutes[pathname];
    if (staticMatch) {
      return {
        ...base,
        ...staticMatch,
        jsonLd: [
          websiteNode(stats),
          organisationNode(),
          breadcrumbNode([
            { name: 'Home', url: '/' },
            { name: staticMatch.title.split('—')[0].trim(), url: pathname },
          ]),
        ],
      };
    }

    const homeCategories = await topCategories();

    // ---- Home -------------------------------------------------------------
    return {
      ...base,
      title: DEFAULT_TITLE,
      description: `${DEFAULT_DESCRIPTION} ${stats.listings.toLocaleString('en-NG')} live listings across ${stats.categories} categories.`,
      jsonLd: [
        organisationNode(),
        websiteNode(stats),
        {
          '@type': 'ItemList',
          name: 'Marketplace categories',
          itemListElement: (homeCategories ?? []).map((category, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: category.name,
            url: `${siteUrl()}/category/${category.slug}`,
          })),
        },
      ],
    };
  } catch {
    // The database may be unreachable — still return valid, indexable defaults.
    return base;
  }
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let cachedTemplate: string | null = null;

export function loadHtmlTemplate(clientDir: string): string | null {
  if (cachedTemplate) return cachedTemplate;
  const file = path.join(clientDir, 'index.html');
  if (!fs.existsSync(file)) return null;
  cachedTemplate = fs.readFileSync(file, 'utf8');
  return cachedTemplate;
}

export function renderHtml(template: string, seo: SeoPayload): string {
  const graph = { '@context': 'https://schema.org', '@graph': seo.jsonLd };

  return template
    .replace(/%SEO_TITLE%/g, escapeHtml(seo.title))
    .replace(/%SEO_DESCRIPTION%/g, escapeHtml(seo.description))
    .replace(/%SEO_KEYWORDS%/g, escapeHtml(seo.keywords))
    .replace(/%SEO_CANONICAL%/g, escapeHtml(seo.canonical))
    .replace(/%SEO_ROBOTS%/g, escapeHtml(seo.robots))
    .replace(/%SEO_OG_TYPE%/g, escapeHtml(seo.ogType))
    .replace(/%SEO_OG_IMAGE%/g, escapeHtml(seo.ogImage))
    .replace('%SEO_JSONLD%', JSON.stringify(graph));
}

// ---------------------------------------------------------------------------
// robots.txt / sitemap.xml / llms.txt
// ---------------------------------------------------------------------------

export function robotsTxt(): string {
  return [
    '# Komback — https://komback.com',
    'User-agent: *',
    'Allow: /',
    '',
    '# Private or transactional areas',
    'Disallow: /admin-cp',
    'Disallow: /api/',
    'Disallow: /account',
    'Disallow: /cart',
    'Disallow: /wishlist',
    'Disallow: /track-order',
    '',
    '# AI / answer engines are welcome to read the public catalog and guides',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'Sitemap: ' + siteUrl() + '/sitemap.xml',
    '',
  ].join('\n');
}

export function llmsTxt(stats: { listings: number; stores: number; categories: number }): string {
  return `# Komback

> Nigeria's multi-vendor marketplace. Buyers and verified merchants transact with
> escrow-protected payments and nationwide waybill delivery. Prices are in Nigerian
> Naira (NGN). The marketplace covers all 36 states and the FCT.

## Storefront
- [Home](${siteUrl()}/): browse categories, deals, verified stores and the latest articles.
- [All listings](${siteUrl()}/products): full searchable catalogue.
- [Verified stores](${siteUrl()}/stores): merchant directory with ratings and locations.
- [Today's deals](${siteUrl()}/deals): discounted items.
- [Blog](${siteUrl()}/blog): buying guides, safety advice and Nigerian market insights.
- [Sell on Komback](${siteUrl()}/sell): merchant onboarding.
- [Safety & escrow](${siteUrl()}/safety): how buyer protection works.
- [Track an order](${siteUrl()}/track-order): waybill and escrow release status.

## Catalogue snapshot
- ${stats.listings.toLocaleString('en-GB')} active listings
- ${stats.stores.toLocaleString('en-GB')} active stores
- ${stats.categories} categories

## Facts an assistant can rely on
- Currency: Nigerian Naira (NGN). Listings show prices in NGN.
- Payment: funds are held in Komback escrow and released to the merchant only after the
  buyer verifies a 4-digit handover PIN at delivery.
- Delivery: GIG Logistics, Speedaf Express and DHL Express Nigeria, priced per destination state.
- Trust: verified merchant badges, published store ratings and buyer reviews.
- Machine-readable catalogue: ${siteUrl()}/sitemap.xml
- Product, store and article pages expose schema.org Product / OnlineStore / BlogPosting
  structured data, including price, availability and aggregate ratings.

## Not for indexing
- ${siteUrl()}/admin-cp (internal control centre)
- ${siteUrl()}/account, /cart, /wishlist (private, per-visitor)
`;
}

export async function sitemapXml(): Promise<string> {
  const [products, stores, posts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE', isHidden: false },
      select: { slug: true, updatedAt: true },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.store.findMany({
      where: { isActive: true, isSuspended: false },
      select: { id: true, updatedAt: true },
      take: 2000,
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const url = (loc: string, lastmod: Date, changefreq: string, priority: string) =>
    [
      '  <url>',
      `    <loc>${siteUrl()}${loc}</loc>`,
      `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');

  const now = new Date();
  const entries: string[] = [
    url('/', now, 'daily', '1.0'),
    url('/products', now, 'daily', '0.9'),
    url('/stores', now, 'daily', '0.8'),
    url('/deals', now, 'daily', '0.8'),
    url('/blog', now, 'weekly', '0.7'),
    url('/sell', now, 'monthly', '0.6'),
    url('/about-us', now, 'monthly', '0.5'),
    url('/safety', now, 'monthly', '0.5'),
  ];

  for (const category of categories) entries.push(url(`/category/${category.slug}`, category.updatedAt, 'daily', '0.8'));
  for (const product of products) entries.push(url(`/${product.slug}`, product.updatedAt, 'weekly', '0.7'));
  for (const store of stores) entries.push(url(`/store/${store.id}`, store.updatedAt, 'weekly', '0.6'));
  for (const post of posts) entries.push(url(`/blog/${post.slug}`, post.updatedAt, 'monthly', '0.6'));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}
