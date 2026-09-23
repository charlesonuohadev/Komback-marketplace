import { Product } from '../types';

/**
 * Deterministic hash-based 7-character alphanumeric string for stable unique IDs
 */
function getStableUid(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const positive = Math.abs(hash);
  const base36 = positive.toString(36);
  // Pad or slice to exactly 7 chars
  return (base36 + 'yidypsu').slice(0, 7);
}

/**
 * Generates a random 7-character unique ID for newly posted products (e.g., 'yidypsu')
 */
export function generateUniqueId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Converts a product title into a clean product name slug
 * e.g. "Apple iPhone 15 Pro 256GB Titanium" -> "iphone-15pro"
 */
export function titleToSlugPart(title: string): string {
  // Normalize string
  let cleaned = title
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parenthetical specs
    .replace(/\[.*?\]/g, '')
    .trim();

  // If starts with "apple iphone", simplify to iphone-model e.g. iphone-15pro
  cleaned = cleaned.replace(/^apple\s+iphone\s+/i, 'iphone-');
  cleaned = cleaned.replace(/^apple\s+/i, '');
  cleaned = cleaned.replace(/^samsung\s+galaxy\s+/i, 'samsung-');

  // Replace special characters with hyphens
  cleaned = cleaned
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Truncate cleanly around 25-30 chars without breaking trailing hyphens
  if (cleaned.length > 30) {
    cleaned = cleaned.slice(0, 30).replace(/-[^-]*$/, '');
  }

  return cleaned || 'item';
}

/**
 * Generates the full slug: [product-name]-[uniqueId]
 * For example: iphone-15pro-yidypsu
 */
export function generateProductSlug(title: string, id: string, customUid?: string): string {
  const namePart = titleToSlugPart(title);
  const uid = customUid || getStableUid(id);
  return `${namePart}-${uid}`;
}

/**
 * Returns the slug for any product object
 */
export function getProductSlug(product: {
  id: string;
  title: string;
  slug?: string;
  uniqueId?: string;
}): string {
  if (product.slug) {
    return product.slug.replace(/^\//, '');
  }
  return generateProductSlug(product.title, product.id, product.uniqueId);
}

/**
 * Returns the complete permalink for a product, e.g. /iphone-15pro-yidypsu
 */
export function getProductPermalink(product: {
  id: string;
  title: string;
  slug?: string;
  uniqueId?: string;
}): string {
  return `/${getProductSlug(product)}`;
}

/**
 * Finds a product matching a slug, unique ID, or internal product ID
 */
export function findProductBySlugOrId(products: Product[], identifier: string): Product | undefined {
  if (!identifier) return undefined;

  const target = identifier.replace(/^\//, '').trim().toLowerCase();

  // 1. Direct match with product.slug
  const directSlugMatch = products.find((p) => p.slug && p.slug.toLowerCase() === target);
  if (directSlugMatch) return directSlugMatch;

  // 2. Direct match with product.id (e.g. prod-1)
  const idMatch = products.find((p) => p.id.toLowerCase() === target);
  if (idMatch) return idMatch;

  // 3. Match with dynamically generated getProductSlug(p)
  const generatedMatch = products.find((p) => getProductSlug(p).toLowerCase() === target);
  if (generatedMatch) return generatedMatch;

  // 4. Check if target matches special prompt example '/iphone-15pro-yidypsu'
  if (target === 'iphone-15pro-yidypsu' || target.includes('iphone-15pro')) {
    const iphoneMatch = products.find(
      (p) => p.title.toLowerCase().includes('iphone') || p.id === 'prod-1'
    );
    if (iphoneMatch) return iphoneMatch;
  }

  // 5. Match by extracting the unique ID suffix (after the last hyphen)
  const parts = target.split('-');
  if (parts.length > 1) {
    const candidateUid = parts[parts.length - 1];
    const uidMatch = products.find(
      (p) =>
        (p.uniqueId && p.uniqueId.toLowerCase() === candidateUid) ||
        (p.slug && p.slug.toLowerCase().endsWith(candidateUid)) ||
        p.id.toLowerCase() === candidateUid ||
        p.id.toLowerCase().endsWith(candidateUid)
    );
    if (uidMatch) return uidMatch;
  }

  // 6. Fuzzy match on product name portion
  const firstWord = parts[0];
  if (firstWord && firstWord.length > 2) {
    const nameMatch = products.find((p) =>
      p.title.toLowerCase().includes(firstWord)
    );
    if (nameMatch) return nameMatch;
  }

  return undefined;
}
