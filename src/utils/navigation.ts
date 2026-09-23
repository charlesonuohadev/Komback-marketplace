import { PageType, Product, Store, BlogPost } from '../types';
import { getProductPermalink } from './slug';

export function getPathForPage(
  page: PageType,
  options?: {
    product?: Product | null;
    store?: Store | null;
    article?: BlogPost | null;
    categorySlug?: string;
  }
): string {
  switch (page) {
    case 'home':
      return '/';
    case 'sell':
      return '/post-ad';
    case 'wishlist':
      return '/wishlist';
    case 'cart':
      return '/cart';
    case 'deals':
      return '/deals';
    case 'stores':
      return '/stores';
    case 'safety':
      return '/safety';
    case 'about-us':
      return '/about-us';
    case 'account':
      return '/account';
    case 'track-order':
      return '/track-order';
    case 'blog':
      return '/blog';
    case 'product-detail':
      return options?.product ? getProductPermalink(options.product) : '/products';
    case 'store-detail':
      return options?.store ? `/store/${options.store.id}` : '/stores';
    case 'blog-detail':
      return options?.article ? `/blog/${options.article.id}` : '/blog';
    case 'products':
      return options?.categorySlug && options.categorySlug !== 'all'
        ? `/category/${options.categorySlug}`
        : '/products';
    default:
      return '/';
  }
}

export interface ParsedRoute {
  page: PageType;
  productId?: string;
  productSlug?: string;
  storeId?: string;
  articleId?: string;
  categorySlug?: string;
}

const RESERVED_ROOT_PATHS = new Set([
  '',
  'home',
  'post-ad',
  'sell',
  'post',
  'new-ad',
  'wishlist',
  'saved',
  'cart',
  'checkout',
  'deals',
  'todays-deals',
  'flash-deals',
  'stores',
  'shops',
  'sellers',
  'about-us',
  'about',
  'safety',
  'faq',
  'terms',
  'privacy',
  'help',
  'account',
  'profile',
  'dashboard',
  'blog',
  'articles',
  'news',
  'products',
  'shop',
  'categories',
  'track-order',
  'tracking-order',
  'track-orders',
  'track'
]);

export function parsePath(pathname: string): ParsedRoute {
  // Normalize path
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '/home') {
    return { page: 'home' };
  }
  if (cleanPath === '/post-ad' || cleanPath === '/sell' || cleanPath === '/post' || cleanPath === '/new-ad') {
    return { page: 'sell' };
  }
  if (cleanPath === '/wishlist' || cleanPath === '/saved') {
    return { page: 'wishlist' };
  }
  if (cleanPath === '/cart' || cleanPath === '/checkout') {
    return { page: 'cart' };
  }
  if (cleanPath === '/deals' || cleanPath === '/todays-deals' || cleanPath === '/flash-deals') {
    return { page: 'deals' };
  }
  if (cleanPath === '/stores' || cleanPath === '/shops' || cleanPath === '/sellers') {
    return { page: 'stores' };
  }
  if (cleanPath === '/about-us' || cleanPath === '/about') {
    return { page: 'about-us' };
  }
  if (
    cleanPath === '/track-order' ||
    cleanPath === '/tracking-order' ||
    cleanPath === '/track-orders' ||
    cleanPath === '/track'
  ) {
    return { page: 'track-order' };
  }
  if (
    cleanPath === '/safety' ||
    cleanPath === '/faq' ||
    cleanPath === '/terms' ||
    cleanPath === '/privacy' ||
    cleanPath === '/help'
  ) {
    return { page: 'safety' };
  }
  if (cleanPath === '/account' || cleanPath === '/profile' || cleanPath === '/dashboard') {
    return { page: 'account' };
  }
  if (cleanPath === '/blog' || cleanPath === '/articles' || cleanPath === '/news') {
    return { page: 'blog' };
  }
  if (cleanPath.startsWith('/product/')) {
    const target = cleanPath.replace('/product/', '').trim();
    return { page: 'product-detail', productId: target, productSlug: target };
  }
  if (cleanPath.startsWith('/store/')) {
    const storeId = cleanPath.replace('/store/', '').trim();
    return { page: 'store-detail', storeId };
  }
  if (cleanPath.startsWith('/blog/')) {
    const articleId = cleanPath.replace('/blog/', '').trim();
    return { page: 'blog-detail', articleId };
  }
  if (cleanPath.startsWith('/category/')) {
    const categorySlug = cleanPath.replace('/category/', '').trim();
    return { page: 'products', categorySlug };
  }
  if (cleanPath === '/products' || cleanPath === '/shop' || cleanPath === '/categories') {
    return { page: 'products' };
  }

  // Dynamic Product Permalink support: /iphone-15pro-yidypsu
  // Any single-segment path that is not in RESERVED_ROOT_PATHS is evaluated as a product permalink
  const segments = cleanPath.replace(/^\//, '').split('/');
  if (segments.length === 1 && segments[0]) {
    const candidateSlug = segments[0];
    if (!RESERVED_ROOT_PATHS.has(candidateSlug.toLowerCase())) {
      return {
        page: 'product-detail',
        productId: candidateSlug,
        productSlug: candidateSlug
      };
    }
  }

  return { page: 'home' };
}

/**
 * Safely updates browser URL via pushState or replaceState.
 * Updates document title according to the active route.
 */
export function navigateTo(url: string, replace = false) {
  if (typeof window === 'undefined') return;

  const currentUrl = window.location.pathname + window.location.search;
  if (currentUrl !== url) {
    if (replace) {
      window.history.replaceState({ path: url }, '', url);
    } else {
      window.history.pushState({ path: url }, '', url);
    }
  }
}
