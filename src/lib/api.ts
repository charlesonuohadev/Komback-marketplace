/**
 * Typed client for the Komback API (`/api/*`).
 *
 * Every piece of marketplace data — catalog, cart, wishlist, orders, reviews,
 * seller tools — is read and written through here. Nothing is stubbed locally.
 */
import type { BlogPost, CartItem, Category, Product, Review, Store } from '../types';

export interface Reference {
  states: string[];
  cities: string[];
  banks: string[];
  couriers: string[];
  conditions: string[];
  badges: string[];
  /** Escrow waybill price per delivery state, in Naira. Use `default` as the fallback. */
  shippingFees: Record<string, number>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  avatar: string | null;
  location: string | null;
  state: string | null;
  storeId: string | null;
}

export interface SellerOrder {
  id: string;
  itemTitle: string;
  itemImage: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCityState: string;
  amount: number;
  date: string;
  status: string;
  courier: string;
  waybillNumber: string;
  pinRequired: boolean;
  pinVerified: boolean;
  escrowReleaseDate: string;
}

export interface TrackingOrder {
  orderNumber: string;
  waybillNumber: string;
  courier: string;
  courierLogo: string;
  statusText: string;
  statusBadge: 'in-transit' | 'out-for-delivery' | 'delivered';
  estimatedDelivery: string;
  origin: string;
  destination: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  riderName: string;
  riderPhone: string;
  handoverPin: string;
  item: {
    title: string;
    image: string;
    sellerName: string;
    isVerified: boolean;
    unitPrice: number;
    shippingFee: number;
    totalAmount: number;
    productRefId: string;
  };
  milestones: {
    title: string;
    subtitle: string;
    timestamp: string;
    status: 'completed' | 'current' | 'pending';
    location: string;
  }[];
  logs: { time: string; date: string; location: string; description: string }[];
}

export interface WalletTransaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  account: string;
}

export interface Wallet {
  availableBalance: number;
  escrowLocked: number;
  totalSettled: number;
  transactions: WalletTransaction[];
}

export interface SellerStats {
  totalRevenue: number;
  pendingEscrow: number;
  availablePayout: number;
  completedOrders: number;
  weeklySalesData: { day: string; amount: number; orders: number }[];
  totalVolume: number;
  avgOrderValue: number;
  storeVisits: number;
}

export interface MessageThreadData {
  id: string;
  buyerName: string;
  buyerAvatar: string;
  productTitle: string;
  productPrice: number;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: { sender: 'buyer' | 'seller'; text: string; time: string }[];
}

export interface CheckoutPayload {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  deliveryAddress: string;
  buyerCityState?: string;
  deliveryState: string;
  paymentProvider?: string;
}

export interface CreatedOrder {
  orderNumber: string;
  total: number;
  storeName: string;
  itemCount: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Flattens an HTML/text error page into a short one-line clue. */
function summariseBody(body: string): string {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    throw new ApiError(
      `Could not reach /api${path} (${
        error instanceof Error ? error.message : 'network error'
      }).`,
      0
    );
  }

  const contentType = response.headers.get('content-type') ?? '';

  // Anything that is not JSON was not produced by the API router — something in
  // front of the Node app answered instead (a rewrite to the SPA shell, a stale
  // static build, or a Passenger/Apache error page). Previously this silently
  // became `null` and callers crashed with a "Cannot read properties of null"
  // error a long way from the real cause.
  if (!contentType.includes('application/json')) {
    const detail = summariseBody(await response.text().catch(() => ''));
    if (response.ok) {
      throw new ApiError(
        `The web server answered /api${path} with ${
          contentType || 'no content type'
        } instead of JSON, so the request never reached the API.` +
          (detail ? ` Response began: ${detail}` : ''),
        response.status
      );
    }
    throw new ApiError(
      `Request to /api${path} failed with status ${response.status}` +
        (detail ? `: ${detail}` : ''),
      response.status
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(`The API returned malformed JSON for /api${path}.`, response.status);
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  // Every endpoint returns a JSON object, so a null body can only crash the caller.
  if (payload === null || payload === undefined) {
    throw new ApiError(`The API returned an empty response for /api${path}.`, response.status);
  }

  return payload as T;
}

const query = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const serialised = search.toString();
  return serialised ? `?${serialised}` : '';
};

export const api = {
  health: () => request<{ status: string; database: string }>('/health'),
  config: () =>
    request<{
      paystackPublicKey: string;
      flutterwavePublicKey: string;
      hasPaystackSecret: boolean;
      hasFlutterwaveSecret: boolean;
    }>('/config'),

  reference: () => request<Reference>('/locations'),

  auth: {
    register: (body: Record<string, unknown>) =>
      request<{ user: AuthUser }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (email: string, password: string) =>
      request<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: AuthUser | null; store: Store | null }>('/auth/me'),
    updateProfile: (body: Record<string, unknown>) =>
      request<{ user: AuthUser }>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  catalog: {
    categories: () => request<{ categories: Category[] }>('/categories'),
    products: (params: Record<string, string | number | boolean | undefined> = {}) =>
      request<{ products: Product[]; total: number; page: number; limit: number; hasMore: boolean }>(
        `/products${query(params as Record<string, string | number>)}`
      ),
    product: (idOrSlug: string) => request<{ product: Product }>(`/products/${idOrSlug}`),
    reviews: (idOrSlug: string) => request<{ reviews: Review[] }>(`/products/${idOrSlug}/reviews`),
    recentReviews: (limit = 4) => request<{ reviews: Review[] }>(`/reviews/recent${query({ limit })}`),
    addReview: (idOrSlug: string, body: { author: string; comment: string; rating: number; location?: string }) =>
      request<{ review: Review }>(`/products/${idOrSlug}/reviews`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    stores: (params: Record<string, string | number | boolean | undefined> = {}) =>
      request<{ stores: Store[] }>(`/stores${query(params as Record<string, string | number>)}`),
    store: (idOrSlug: string) => request<{ store: Store }>(`/stores/${idOrSlug}`),
    blog: () => request<{ posts: BlogPost[] }>('/blog'),
    blogPost: (idOrSlug: string) => request<{ post: BlogPost }>(`/blog/${idOrSlug}`),
    stats: () => request<{ products: number; stores: number; categories: number }>('/stats'),
  },

  cart: {
    get: () => request<{ items: CartItem[]; count: number; subtotal: number }>('/cart'),
    add: (productId: string, quantity = 1) =>
      request<{ success: boolean }>('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      }),
    update: (productId: string, quantity: number) =>
      request<{ success: boolean }>(`/cart/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    remove: (productId: string) =>
      request<{ success: boolean }>(`/cart/${productId}`, { method: 'DELETE' }),
    clear: () => request<{ success: boolean }>('/cart', { method: 'DELETE' }),
  },

  wishlist: {
    get: () => request<{ ids: string[]; products: Product[] }>('/wishlist'),
    toggle: (productId: string) =>
      request<{ wishlisted: boolean; ids: string[] }>('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
  },

  orders: {
    checkout: (body: CheckoutPayload) =>
      request<{ orders: CreatedOrder[] }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
    mine: () =>
      request<{
        orders: {
          orderNumber: string;
          status: string;
          total: number;
          placedAt: string;
          storeName: string;
          items: { title: string; image: string; quantity: number; unitPrice: number }[];
        }[];
      }>('/orders'),
    track: (orderNumber: string) =>
      request<{ order: TrackingOrder }>(`/track/${encodeURIComponent(orderNumber)}`),
    detail: (orderNumber: string) =>
      request<{ order: SellerOrder }>(`/orders/${encodeURIComponent(orderNumber)}`),
    sellerOrders: (status?: string) =>
      request<{ orders: SellerOrder[] }>(`/seller/orders${query({ status })}`),
    updateStatus: (orderNumber: string, body: { status: string; courier?: string; waybillNumber?: string }) =>
      request<{ order: SellerOrder }>(
        `/orders/${encodeURIComponent(orderNumber.replace(/^#/, ''))}/status`,
        { method: 'PATCH', body: JSON.stringify(body) }
      ),
    verifyPin: (orderNumber: string, pin: string) =>
      request<{ order: SellerOrder }>(
        `/orders/${encodeURIComponent(orderNumber.replace(/^#/, ''))}/verify-pin`,
        { method: 'POST', body: JSON.stringify({ pin }) }
      ),
  },

  seller: {
    store: () => request<{ store: Store }>('/seller/store'),
    updateStore: (body: Record<string, unknown>) =>
      request<{ store: Store }>('/seller/store', { method: 'PATCH', body: JSON.stringify(body) }),
    stats: () => request<{ stats: SellerStats }>('/seller/stats'),
    wallet: () => request<{ wallet: Wallet }>('/seller/wallet'),
    payouts: () => request<{ payouts: unknown[] }>('/seller/payouts'),
    requestPayout: (body: { amount: number; bankName?: string; bankAccountName?: string; bankAccountNumber?: string }) =>
      request<{ wallet: Wallet }>('/seller/wallet/payouts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    messages: () => request<{ threads: MessageThreadData[] }>('/seller/messages'),
    reply: (threadId: string, text: string) =>
      request<{ message: unknown }>(`/seller/messages/${threadId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    logistics: () =>
      request<{
        shipments: {
          id: string;
          courier: string;
          waybillNumber: string;
          status: string;
          origin: string;
          destination: string;
          recipientName: string;
          estimatedDelivery: string | null;
          order: { orderNumber: string; buyerCityState: string; total: number };
        }[];
        pendingOrders: {
          orderNumber: string;
          buyerName: string;
          buyerPhone: string;
          deliveryAddress: string;
          buyerCityState: string;
          deliveryState: string;
          total: number;
        }[];
        couriers: string[];
      }>('/seller/logistics'),
    createWaybill: (body: Record<string, unknown>) =>
      request<{ shipment: { waybillNumber: string; courier: string } }>('/seller/logistics/waybill', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    rate: (origin: string, destination: string, weight: string) =>
      request<{ rate: number }>(`/seller/logistics/rate${query({ origin, destination, weight })}`),
    createProduct: (body: Record<string, unknown>) =>
      request<{ product: Product }>('/seller/products', { method: 'POST', body: JSON.stringify(body) }),
    updateProduct: (id: string, body: Record<string, unknown>) =>
      request<{ product: Product }>(`/seller/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteProduct: (id: string) =>
      request<{ success: boolean }>(`/seller/products/${id}`, { method: 'DELETE' }),
    syncWooCommerce: (baseUrl?: string) =>
      request<{ synced: number; endpoint: string; products: Product[] }>(
        '/seller/woocommerce/sync',
        { method: 'POST', body: JSON.stringify({ baseUrl }) }
      ),
  },

  messages: {
    threads: () => request<{ threads: MessageThreadData[] }>('/messages/threads'),
    start: (body: { storeId: string; productId?: string; text: string; buyerName?: string; buyerPhone?: string }) =>
      request<{ thread: MessageThreadData }>('/messages/threads', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    reply: (threadId: string, text: string) =>
      request<{ message: unknown }>(`/messages/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  },

  payments: {
    initializePaystack: (body: Record<string, unknown>) =>
      request<{ status: boolean; data?: { authorization_url?: string; reference?: string } }>(
        '/paystack/initialize',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    verifyPaystack: (reference: string) => request<Record<string, unknown>>(`/paystack/verify/${reference}`),
    initializeFlutterwave: (body: Record<string, unknown>) =>
      request<{ status: string; data?: { link?: string; tx_ref?: string } }>('/flutterwave/initialize', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    verifyFlutterwave: (reference: string) =>
      request<Record<string, unknown>>(`/flutterwave/verify/${reference}`),
  },
};
