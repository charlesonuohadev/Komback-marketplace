import { Prisma } from '@prisma/client';
import type {
  BlogPost as BlogPostDTO,
  Category as CategoryDTO,
  Product as ProductDTO,
  Review as ReviewDTO,
  Store as StoreDTO,
} from '../src/types';
import type {
  MessageThreadDTO,
  OrderTrackingDTO,
  SellerOrderDTO,
  SellerStatsDTO,
  TransactionDTO,
  WalletDTO,
} from './dto';

// ---------------------------------------------------------------------------
// Reusable Prisma query shapes
// ---------------------------------------------------------------------------

export const productInclude = { store: true, category: true } satisfies Prisma.ProductInclude;
export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export const storeInclude = { category: true, _count: { select: { products: true } } } satisfies Prisma.StoreInclude;
export type StoreRow = Prisma.StoreGetPayload<{ include: typeof storeInclude }>;

export const categoryInclude = { _count: { select: { products: true } } } satisfies Prisma.CategoryInclude;
export type CategoryRow = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;

export const orderInclude = {
  store: true,
  items: true,
  shipment: { include: { events: { orderBy: { occurredAt: 'asc' } } } },
} satisfies Prisma.OrderInclude;
export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// ---------------------------------------------------------------------------
// Labels / enums -> presentation
// ---------------------------------------------------------------------------

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending Payment',
  ESCROW_SECURED: 'Escrow Secured',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  ESCROW_SECURED: 'Escrow Secured',
  ESCROW_RELEASE: 'Escrow Release',
  BANK_PAYOUT: 'Bank Payout',
  LISTING_FEE: 'Listing Fee',
  BOOST_FEE: 'Boost Fee',
  REFUND: 'Refund',
};

const TRANSACTION_STATUS_LABEL: Record<string, 'Completed' | 'Pending' | 'Failed'> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  FAILED: 'Failed',
};

export function orderStatusToLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export function orderStatusFromLabel(label: string): string {
  const entry = Object.entries(ORDER_STATUS_LABEL).find(([, value]) => value === label);
  return entry ? entry[0] : label.toUpperCase().replace(/[\s-]+/g, '_');
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatTimeLabel(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function relativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return formatDateLabel(date);
}

// ---------------------------------------------------------------------------
// Catalog serializers
// ---------------------------------------------------------------------------

export function serializeCategory(row: CategoryRow): CategoryDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    itemCount: row._count.products,
    image: row.image,
    description: row.description,
    popularSubcategories: row.popularSubcategories,
  };
}

export function serializeStore(row: StoreRow): StoreDTO {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    isVerified: row.isVerified,
    rating: row.rating,
    salesCount: row.salesCount,
    location: row.location,
    state: row.state,
    avatar: row.avatar ?? '',
    coverImage: row.coverImage ?? '',
    category: row.category?.name ?? '',
    description: row.description,
    phone: row.phone ?? '',
    email: row.email ?? '',
    joinedDate: row.joinedDate,
    badges: row.badges,
    totalProducts: row._count.products,
  };
}

export function serializeProduct(row: ProductRow): ProductDTO {
  return {
    id: row.id,
    slug: row.slug,
    uniqueId: row.uniqueId,
    title: row.title,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    badge: (row.badge as ProductDTO['badge']) ?? undefined,
    images: row.images,
    category: row.category.name,
    categorySlug: row.category.slug,
    location: row.location,
    state: row.state,
    seller: {
      id: row.store.id,
      name: row.store.name,
      isVerified: row.store.isVerified,
      rating: row.store.rating,
      salesCount: row.store.salesCount,
      location: row.store.location,
      phone: row.store.phone ?? undefined,
      avatar: row.store.avatar ?? undefined,
      joinedYear: row.store.joinedDate,
      responseRate: `${Math.max(80, Math.min(99, Math.round(row.store.rating * 20)))}% within 5 mins`,
    },
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    condition: row.condition as ProductDTO['condition'],
    description: row.description,
    features: row.features,
    inStock: row.inStock,
    isTrending: row.isTrending,
    isDeal: row.isDeal,
    isFeaturedAd: row.isFeaturedAd,
    featuredBadgeText: row.featuredBadgeText ?? undefined,
    boostPlan: row.boostPlan ?? undefined,
    boostExpiresAt: row.boostExpiresAt ? formatIsoDate(row.boostExpiresAt) : undefined,
    createdAt: formatIsoDate(row.createdAt),
  };
}

export function serializeReview(row: {
  id: string;
  productId: string;
  author: string;
  location: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  sellerReply: string | null;
  createdAt: Date;
}): ReviewDTO {
  return {
    id: row.id,
    productId: row.productId,
    author: row.author,
    location: row.location,
    rating: row.rating,
    date: relativeTimeLabel(row.createdAt),
    comment: row.comment,
    isVerifiedPurchase: row.isVerifiedPurchase,
    sellerReply: row.sellerReply ?? undefined,
  };
}

export function serializeBlogPost(row: {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  tags: string[];
  readTime: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  publishedAt: Date;
}): BlogPostDTO {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    date: formatDateLabel(row.publishedAt),
    readTime: row.readTime,
    author: {
      name: row.authorName,
      role: row.authorRole,
      avatar: row.authorAvatar,
    },
    image: row.image,
    tags: row.tags,
  };
}

// ---------------------------------------------------------------------------
// Commerce serializers
// ---------------------------------------------------------------------------

export function serializeSellerOrder(row: OrderRow): SellerOrderDTO {
  const primary = row.items[0];
  const pinVerified = row.pinVerified;

  let escrowReleaseDate: string;
  if (row.releasedAt) {
    escrowReleaseDate = `${formatIsoDate(row.releasedAt)} (Transferred to Wallet)`;
  } else if (pinVerified && row.shipment?.deliveredAt) {
    escrowReleaseDate = `${formatIsoDate(row.shipment.deliveredAt)} (Funds Settled)`;
  } else if (row.status === 'DISPATCHED' || row.status === 'OUT_FOR_DELIVERY') {
    escrowReleaseDate = 'Pending Handover PIN';
  } else {
    escrowReleaseDate = 'Awaiting Merchant Dispatch';
  }

  return {
    id: `#${row.orderNumber}`,
    itemTitle: primary?.title ?? 'Order item',
    itemImage: primary?.image ?? '',
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    buyerAddress: row.deliveryAddress,
    buyerCityState: row.buyerCityState,
    amount: row.total,
    date: formatIsoDate(row.placedAt),
    status: orderStatusToLabel(row.status),
    courier: row.courier ?? row.shipment?.courier ?? 'Pending courier assignment',
    waybillNumber: row.waybillNumber ?? row.shipment?.waybillNumber ?? 'Not generated',
    pinRequired: true,
    pinVerified,
    escrowReleaseDate,
  };
}

export function serializeOrderTracking(
  row: OrderRow,
  options: { includeHandoverPin?: boolean } = {}
): OrderTrackingDTO {
  const primary = row.items[0];
  const shipment = row.shipment;

  const statusBadge: OrderTrackingDTO['statusBadge'] =
    row.status === 'RELEASED' || row.status === 'DELIVERED'
      ? 'delivered'
      : row.status === 'OUT_FOR_DELIVERY'
        ? 'out-for-delivery'
        : 'in-transit';

  const milestones = (shipment?.events ?? []).map((event, index, all) => ({
    title: event.title,
    subtitle: event.subtitle,
    timestamp: `${formatDateLabel(event.occurredAt)} • ${formatTimeLabel(event.occurredAt)}`,
    status:
      index < all.length - 1
        ? ('completed' as const)
        : statusBadge === 'delivered'
          ? ('completed' as const)
          : ('current' as const),
    location: event.location,
  }));

  return {
    orderNumber: row.orderNumber,
    waybillNumber: shipment?.waybillNumber ?? row.waybillNumber ?? 'Pending',
    courier: shipment?.courier ?? row.courier ?? 'Pending courier assignment',
    courierLogo: '🚚',
    statusText: `${orderStatusToLabel(row.status)} — ${shipment?.destination || row.buyerCityState}`,
    statusBadge,
    estimatedDelivery: shipment?.estimatedDelivery ?? 'Awaiting dispatch',
    origin: shipment?.origin ?? row.store.location,
    destination: shipment?.destination ?? row.buyerCityState,
    recipientName: shipment?.recipientName || row.buyerName,
    recipientPhone: shipment?.recipientPhone || row.buyerPhone,
    deliveryAddress: row.deliveryAddress,
    riderName: shipment?.riderName ?? 'Awaiting courier assignment',
    riderPhone: shipment?.riderPhone ?? row.store.phone ?? '',
    // The inspection PIN is a shared secret between buyer and courier; only the
    // buyer or the fulfilling store ever receives the real value.
    handoverPin: options.includeHandoverPin ? (row.handoverPin ?? '----') : '----',
    item: {
      title: primary?.title ?? 'Order item',
      image: primary?.image ?? '',
      sellerName: row.store.name,
      isVerified: row.store.isVerified,
      unitPrice: primary?.unitPrice ?? row.subtotal,
      shippingFee: row.shippingFee,
      totalAmount: row.total,
      productRefId: primary?.productId ?? '',
    },
    milestones,
    logs: (shipment?.events ?? []).map((event) => ({
      time: formatTimeLabel(event.occurredAt),
      date: formatDateLabel(event.occurredAt),
      location: event.location,
      description: event.subtitle || event.title,
    })),
  };
}

export function serializeTransaction(row: {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  description: string;
  account: string;
  createdAt: Date;
}): TransactionDTO {
  return {
    id: row.reference || row.id,
    type: TRANSACTION_TYPE_LABEL[row.type] ?? row.type,
    description: row.description,
    amount: row.amount,
    date: formatIsoDate(row.createdAt),
    status: TRANSACTION_STATUS_LABEL[row.status] ?? 'Pending',
    account: row.account,
  };
}

export function serializeWallet(
  wallet: { availableBalance: number; escrowLocked: number; totalSettled: number } | null,
  transactions: Parameters<typeof serializeTransaction>[0][]
): WalletDTO {
  return {
    availableBalance: wallet?.availableBalance ?? 0,
    escrowLocked: wallet?.escrowLocked ?? 0,
    totalSettled: wallet?.totalSettled ?? 0,
    transactions: transactions.map(serializeTransaction),
  };
}

export function serializeMessageThread(row: {
  id: string;
  buyerName: string;
  store: { avatar: string | null };
  unreadForSeller: number;
  lastMessageAt: Date;
  messages: { senderRole: string; text: string; createdAt: Date }[];
  product?: { title: string; price: number; images: string[]; avatar?: string } | null;
}): MessageThreadDTO {
  const messages = row.messages.map((message) => ({
    sender: (message.senderRole === 'SELLER' ? 'seller' : 'buyer') as 'buyer' | 'seller',
    text: message.text,
    time: formatTimeLabel(message.createdAt),
  }));

  return {
    id: row.id,
    buyerName: row.buyerName,
    buyerAvatar: row.product?.avatar ?? row.store.avatar ?? '',
    productTitle: row.product?.title ?? 'General enquiry',
    productPrice: row.product?.price ?? 0,
    lastMessage: messages[messages.length - 1]?.text ?? '',
    time: relativeTimeLabel(row.lastMessageAt),
    unread: row.unreadForSeller > 0,
    messages,
  };
}

export function serializeSellerStats(input: {
  totalRevenue: number;
  pendingEscrow: number;
  availablePayout: number;
  completedOrders: number;
  weekly: { day: string; amount: number; orders: number }[];
  totalVolume: number;
  avgOrderValue: number;
  storeVisits: number;
}): SellerStatsDTO {
  return {
    totalRevenue: input.totalRevenue,
    pendingEscrow: input.pendingEscrow,
    availablePayout: input.availablePayout,
    completedOrders: input.completedOrders,
    weeklySalesData: input.weekly,
    totalVolume: input.totalVolume,
    avgOrderValue: input.avgOrderValue,
    storeVisits: input.storeVisits,
  };
}
