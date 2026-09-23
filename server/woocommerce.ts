import { slugify } from './http';

/**
 * Pulls the live komback.com WooCommerce / Dokan catalog.
 *
 * This is a real HTTP integration — it never falls back to fabricated products.
 * Whatever the storefront API returns is what gets written to PostgreSQL.
 */

export interface WooCommerceRawProduct {
  id: number | string;
  name: string;
  slug?: string;
  permalink?: string;
  price?: string | number;
  regular_price?: string | number;
  sale_price?: string | number;
  description?: string;
  short_description?: string;
  sku?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number;
  categories?: { id: number; name: string; slug: string }[];
  images?: { src: string; alt?: string; name?: string }[];
  attributes?: { id: number; name: string; options: string[] }[];
  average_rating?: string | number;
  rating_count?: number;
  date_created?: string;
}

export interface NormalisedProduct {
  sourceId: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  description: string;
  features: string[];
  images: string[];
  categoryName: string;
  categorySlug: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewsCount: number;
  createdAt: Date;
}

const ENDPOINTS = [
  { path: '/wp-json/wc/store/v1/products', storeApi: true },
  { path: '/wp-json/wc/v3/products', storeApi: false },
  { path: '/wp-json/dokan/v1/products', storeApi: false },
];

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function normaliseWooCommerceProduct(
  raw: WooCommerceRawProduct,
  storeApi: boolean
): NormalisedProduct {
  // The Store API returns minor units (kobo) and an HTML-rendered price block,
  // while the v3/Dokan APIs return decimal strings in Naira.
  const rawPrice = storeApi ? toNumber(raw.price) / 100 : toNumber(raw.price);
  const rawRegular = storeApi ? toNumber(raw.regular_price) / 100 : toNumber(raw.regular_price);

  const price = Math.round(rawPrice);
  const originalPrice = rawRegular > rawPrice ? Math.round(rawRegular) : null;

  const sourceId = String(raw.id);
  const uniqueId = raw.sku?.trim() || sourceId.replace(/\D/g, '').slice(-6) || sourceId;

  const images = (raw.images ?? [])
    .map((image) => image.src)
    .filter((src): src is string => Boolean(src));

  const categoryName = raw.categories?.[0]?.name ?? 'Electronics & Laptops';
  const categorySlug = raw.categories?.[0]?.slug ?? slugify(categoryName);

  const features = (raw.attributes ?? [])
    .flatMap((attribute) => attribute.options.map((option) => `${attribute.name}: ${option}`))
    .filter(Boolean)
    .slice(0, 8);

  return {
    sourceId,
    title: raw.name,
    slug: raw.slug ? slugify(raw.slug) : `${slugify(raw.name)}-${uniqueId}`,
    price,
    originalPrice,
    description:
      stripHtml(raw.description ?? '') ||
      stripHtml(raw.short_description ?? '') ||
      'Imported from the komback.com storefront.',
    features,
    images,
    categoryName,
    categorySlug,
    inStock: raw.stock_status ? raw.stock_status !== 'outofstock' : true,
    stockQuantity: raw.stock_quantity ?? 1,
    rating: Number.parseFloat(String(raw.average_rating ?? 0)) || 0,
    reviewsCount: raw.rating_count ?? 0,
    createdAt: raw.date_created ? new Date(raw.date_created) : new Date(),
  };
}

/**
 * Fetches the catalog from komback.com. Throws when the storefront cannot be
 * reached or returns nothing usable — callers surface that to the user instead of
 * silently substituting placeholder data.
 */
export async function fetchKombackCatalog(
  baseUrl: string,
  timeoutMs = 8000
): Promise<{ products: NormalisedProduct[]; endpoint: string }> {
  const errors: string[] = [];

  for (const endpoint of ENDPOINTS) {
    const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}?per_page=100`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Komback-Marketplace/1.0' },
        signal: controller.signal,
      });

      if (!response.ok) {
        errors.push(`${endpoint.path} → HTTP ${response.status}`);
        continue;
      }

      const payload = (await response.json()) as unknown;
      const rows = Array.isArray(payload)
        ? (payload as WooCommerceRawProduct[])
        : Array.isArray((payload as { data?: unknown }).data)
          ? ((payload as { data: WooCommerceRawProduct[] }).data)
          : [];

      const products = rows
        .filter((row) => row && row.name)
        .map((row) => normaliseWooCommerceProduct(row, endpoint.storeApi))
        .filter((product) => product.price > 0);

      if (products.length > 0) {
        return { products, endpoint: endpoint.path };
      }

      errors.push(`${endpoint.path} → no products returned`);
    } catch (error) {
      errors.push(
        `${endpoint.path} → ${error instanceof Error ? error.message : 'request failed'}`
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Could not read the komback.com catalog. Tried: ${errors.join('; ')}. ` +
      'Check that the WordPress REST API is publicly reachable from this server.'
  );
}
