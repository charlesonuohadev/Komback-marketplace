/**
 * Super Admin API client (`/api/admin/*`).
 *
 * Kept separate from `src/lib/api.ts` so the whole admin console can be lazy-loaded
 * and never ships in the public storefront bundle.
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  avatar: string | null;
  location: string | null;
  state: string | null;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  emailVerified: boolean;
  adminNotes: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  store: { id: string; name: string; slug: string; isVerified: boolean; isSuspended: boolean } | null;
  ordersCount: number;
  reviewsCount: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  statusCode: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentStatus: string;
  placedAt: string;
  buyer: { name: string; phone: string; email: string | null; address: string; cityState: string };
  store: { id: string; name: string };
  courier: string | null;
  waybillNumber: string | null;
  pinVerified: boolean;
  items: { title: string; quantity: number; unitPrice: number; image: string }[];
}

export interface AdminStore {
  id: string;
  name: string;
  tagline: string;
  isVerified: boolean;
  rating: number;
  salesCount: number;
  location: string;
  state: string;
  avatar: string;
  coverImage: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  joinedDate: string;
  badges: string[];
  totalProducts: number;
  isSuspended: boolean;
  suspendReason: string | null;
  suspendedAt: string | null;
  isFeaturedStore: boolean;
  adminNotes: string | null;
  createdAt: string;
  owner: { id: string; email: string; name: string; isBanned: boolean } | null;
  wallet: { availableBalance: number; escrowLocked: number; totalSettled: number } | null;
}

export interface AdminListing {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  state: string;
  location: string;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  seller: { id: string; name: string; isVerified: boolean };
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'ARCHIVED';
  isHidden: boolean;
  isFeaturedAd?: boolean;
  featuredBadgeText?: string;
  views: number;
  stockQuantity: number;
  adminNotes: string | null;
  createdAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  popularSubcategories: string[];
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  storeCount: number;
}

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  tags: string[];
  readTime: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  isPublished: boolean;
  publishedAt: string;
}

export interface AdminReview {
  id: string;
  productId: string;
  author: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  isHidden: boolean;
  createdAt: string;
  product: { id: string; title: string } | null;
}

export interface AdminActivityEntry {
  id: string;
  action: string;
  category: string;
  description: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminOverview {
  kpis: {
    users: { total: number; buyers: number; sellers: number; admins: number; banned: number };
    stores: { total: number; verified: number; suspended: number };
    products: { total: number; hidden: number };
    orders: { total: number; byStatus: { status: string; statusCode: string; count: number }[] };
    finance: {
      grossRevenue: number;
      escrowLocked: number;
      sellerBalances: number;
      pendingPayouts: number;
      pendingPayoutCount: number;
    };
    engagement: { reviews: number; hiddenReviews: number; enquiries: number; articles: number };
    growth: { signups7: number; signups30: number };
  };
  trend: { date: string; orders: number; revenue: number }[];
  topStores: AdminStore[];
  recentOrders: AdminOrder[];
  recentActivity: AdminActivityEntry[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DatabaseHealth {
  configured: boolean;
  connected: boolean;
  latencyMs: number | null;
  serverVersion: string | null;
  connection: { host: string; port: string; database: string; schema: string; user: string; ssl: boolean };
  tables: { table: string; exists: boolean; rows: number | null }[];
  missingTables: string[];
  migrations: { applied: number; pending: number | null; latest: string | null };
  error: string | null;
  checkedAt: string;
  runtime: {
    node: string;
    uptimeSeconds: number;
    environment: string;
    mailConfigured: boolean;
    payments: { paystack: boolean; flutterwave: boolean };
    appUrl: string | null;
  };
  shippingFees: Record<string, number>;
}

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });

  const isJson = (response.headers.get('content-type') ?? '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Request failed with status ${response.status}`;
    throw new AdminApiError(message, response.status);
  }

  return payload as T;
}

const qs = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const serialised = search.toString();
  return serialised ? `?${serialised}` : '';
};

export const adminApi = {
  auth: {
    session: () =>
      request<{ user: AdminUser | null; mailConfigured: boolean }>('/auth/session'),
    login: (email: string, password: string) =>
      request<{ user: AdminUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string; mailConfigured: boolean; devResetUrl?: string; note?: string }>(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) }
      ),
    resetPassword: (token: string, password: string, confirmPassword: string) =>
      request<{ success: boolean; sessionsRevoked: number }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
      }),
  },

  overview: () => request<AdminOverview>('/overview'),
  health: () => request<DatabaseHealth>('/system/health'),

  activity: (params: Record<string, string | number | undefined> = {}) =>
    request<Paged<AdminActivityEntry> & { categoryTotals: { category: string; count: number }[] }>(
      `/activity${qs(params as Record<string, string | number>)}`
    ),

  users: {
    list: (params: Record<string, string | number | undefined> = {}) =>
      request<Paged<AdminUser> & { roleTotals: { role: string; count: number }[] }>(
        `/users${qs(params as Record<string, string | number>)}`
      ),
    detail: (id: string) =>
      request<{
        user: AdminUser;
        orders: AdminOrder[];
        sessions: { id: string; ipAddress: string | null; userAgent: string | null; createdAt: string; expiresAt: string }[];
        activity: { id: string; action: string; category: string; description: string; createdAt: string; ipAddress: string | null }[];
        reviews: { id: string; rating: number; comment: string; date: string }[];
        wallet: { availableBalance: number; escrowLocked: number; totalSettled: number } | null;
      }>(`/users/${id}`),
    create: (body: Record<string, unknown>) =>
      request<{ user: AdminUser }>('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ user: AdminUser; sessionsRevoked: number }>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string, deleteStore = false) =>
      request<{ success: boolean; storeDeleted: boolean }>(
        `/users/${id}${qs({ deleteStore: deleteStore ? 'true' : undefined })}`,
        { method: 'DELETE' }
      ),
    ban: (id: string, reason: string, suspendStore = true) =>
      request<{ user: AdminUser; sessionsRevoked: number }>(`/users/${id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason, suspendStore }),
      }),
    unban: (id: string, reinstateStore = true) =>
      request<{ user: AdminUser }>(`/users/${id}/unban`, {
        method: 'POST',
        body: JSON.stringify({ reinstateStore }),
      }),
    revokeSessions: (id: string) =>
      request<{ success: boolean; sessionsRevoked: number }>(`/users/${id}/revoke-sessions`, {
        method: 'POST',
      }),
  },

  stores: {
    list: (params: Record<string, string | number | undefined> = {}) =>
      request<Paged<AdminStore>>(`/stores${qs(params as Record<string, string | number>)}`),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ store: AdminStore }>(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    verify: (id: string, isVerified: boolean) =>
      request<{ store: AdminStore }>(`/stores/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isVerified }),
      }),
    suspend: (id: string, reason: string) =>
      request<{ store: AdminStore; listingsHidden: number }>(`/stores/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    reinstate: (id: string) =>
      request<{ store: AdminStore; listingsRestored: number }>(`/stores/${id}/reinstate`, {
        method: 'POST',
      }),
  },

  orders: {
    list: (params: Record<string, string | number | undefined> = {}) =>
      request<
        Paged<AdminOrder> & { statusTotals: { status: string; statusCode: string; count: number; value: number }[] }
      >(`/orders${qs(params as Record<string, string | number>)}`),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ order: AdminOrder }>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },

  products: {
    list: (params: Record<string, string | number | undefined> = {}) =>
      request<Paged<AdminListing>>(`/products${qs(params as Record<string, string | number>)}`),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ product: AdminListing }>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => request<{ categories: AdminCategory[] }>('/categories'),
    create: (body: Record<string, unknown>) =>
      request<{ category: AdminCategory }>('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ category: AdminCategory }>(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string, force = false) =>
      request<{ success: boolean }>(`/categories/${id}${qs({ force: force ? 'true' : undefined })}`, {
        method: 'DELETE',
      }),
  },

  blog: {
    list: () => request<{ posts: AdminBlogPost[] }>('/blog'),
    create: (body: Record<string, unknown>) =>
      request<{ post: AdminBlogPost }>('/blog', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ post: AdminBlogPost }>(`/blog/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request<{ success: boolean }>(`/blog/${id}`, { method: 'DELETE' }),
  },

  reviews: {
    list: (params: Record<string, string | number | undefined> = {}) =>
      request<Paged<AdminReview>>(`/reviews${qs(params as Record<string, string | number>)}`),
    setHidden: (id: string, isHidden: boolean) =>
      request<{ review: AdminReview; isHidden: boolean }>(`/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden }),
      }),
    remove: (id: string) => request<{ success: boolean }>(`/reviews/${id}`, { method: 'DELETE' }),
  },

  finance: {
    transactions: (params: Record<string, string | number | undefined> = {}) =>
      request<
        Paged<{
          id: string;
          reference: string;
          type: string;
          status: string;
          amount: number;
          description: string;
          account: string;
          provider: string | null;
          store: { id: string; name: string } | null;
          orderNumber: string | null;
          createdAt: string;
        }> & { totals: { type: string; amount: number; count: number }[] }
      >(`/transactions${qs(params as Record<string, string | number>)}`),
    payouts: (params: Record<string, string | number | undefined> = {}) =>
      request<
        Paged<{
          id: string;
          amount: number;
          bankName: string;
          accountName: string;
          accountNumber: string;
          status: string;
          note: string | null;
          requestedAt: string;
          processedAt: string | null;
          store: { id: string; name: string; slug: string };
        }>
      >(`/payouts${qs(params as Record<string, string | number>)}`),
    decidePayout: (id: string, decision: 'approve' | 'reject', note?: string) =>
      request<{ payout: unknown }>(`/payouts/${id}/${decision}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    adjustWallet: (storeId: string, amount: number, reason: string) =>
      request<{ wallet: { availableBalance: number } }>(`/wallets/${storeId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      }),
  },

  settings: {
    get: () =>
      request<{ settings: Record<string, unknown>; defaults: Record<string, unknown> }>('/settings'),
    update: (body: Record<string, unknown>) =>
      request<{ settings: Record<string, unknown> }>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
};
