import { Router } from 'express';
import type { OrderStatus, ProductStatus, Store } from '@prisma/client';
import { prisma } from '../db';
import { attachIdentity, requireSeller, type AuthedRequest } from '../auth';
import { asInt, asString, asStringArray, asyncHandler, badRequest, notFound } from '../http';
import { COURIERS } from '../constants';
import { fetchKombackCatalog } from '../woocommerce';
import { recordAudit } from '../audit';
import {
  orderInclude,
  productInclude,
  serializeMessageThread,
  serializeProduct,
  serializeSellerOrder,
  serializeSellerStats,
  serializeStore,
  serializeWallet,
  storeInclude,
} from '../serializers';

export const sellerRouter = Router();

sellerRouter.use(attachIdentity);

type SellerRequest = AuthedRequest & { store: Store };

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Deterministic courier pricing used by the rate calculator. */
function computeRate(origin: string, destination: string, weightKg: number): number {
  const sameState = origin.trim().toLowerCase() === destination.trim().toLowerCase();
  const base = sameState ? 2500 : 4200;
  const perKg = sameState ? 350 : 550;
  return Math.round(base + Math.max(0.5, weightKg) * perKg);
}

sellerRouter.get(
  '/store',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = await prisma.store.findUnique({
      where: { id: (req as SellerRequest).store.id },
      include: storeInclude,
    });
    if (!store) return notFound(res, 'Store not found');
    res.json({ store: serializeStore(store) });
  })
);

sellerRouter.patch(
  '/store',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: asString(req.body.name) || undefined,
        tagline: asString(req.body.tagline) || undefined,
        description: asString(req.body.description) || undefined,
        location: asString(req.body.location) || undefined,
        state: asString(req.body.state) || undefined,
        phone: asString(req.body.phone) || undefined,
        email: asString(req.body.email) || undefined,
        whatsapp: asString(req.body.whatsapp) || undefined,
        avatar: asString(req.body.avatar) || undefined,
        coverImage: asString(req.body.coverImage) || undefined,
        bankName: asString(req.body.bankName) || undefined,
        bankAccountName: asString(req.body.bankAccountName) || undefined,
        bankAccountNumber: asString(req.body.bankAccountNumber) || undefined,
        bankCode: asString(req.body.bankCode) || undefined,
        shippingPolicy: asString(req.body.shippingPolicy) || undefined,
        returnPolicy: asString(req.body.returnPolicy) || undefined,
        facebookUrl: asString(req.body.facebookUrl) || undefined,
        instagramUrl: asString(req.body.instagramUrl) || undefined,
        websiteUrl: asString(req.body.websiteUrl) || undefined,
        categoryId: asString(req.body.categoryId) || undefined,
      },
      include: storeInclude,
    });

    await recordAudit(req, {
      action: 'store.updated',
      category: 'STORE',
      entityType: 'Store',
      entityId: storeId,
      description: `Updated storefront settings for ${store.name}`,
      metadata: { fields: Object.keys(req.body ?? {}) },
    });

    res.json({ store: serializeStore(store) });
  })
);

sellerRouter.get(
  '/stats',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;

    const [wallet, releasedAgg, completedOrders, productAgg, recentOrders] = await Promise.all([
      prisma.wallet.findUnique({ where: { storeId } }),
      prisma.order.aggregate({
        where: { storeId, status: 'RELEASED' },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { storeId, status: 'RELEASED' } }),
      prisma.product.aggregate({ where: { storeId }, _sum: { views: true } }),
      prisma.order.findMany({
        where: { storeId, placedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { total: true, placedAt: true },
      }),
    ]);

    const buckets = new Map<string, { day: string; amount: number; orders: number }>();
    for (const order of recentOrders) {
      const day = DAY_LABELS[order.placedAt.getDay()];
      const bucket = buckets.get(day) ?? { day, amount: 0, orders: 0 };
      bucket.amount += order.total;
      bucket.orders += 1;
      buckets.set(day, bucket);
    }

    const weekly = DAY_LABELS.map((day) => buckets.get(day) ?? { day, amount: 0, orders: 0 });
    const totalVolume = weekly.reduce((sum, day) => sum + day.amount, 0);
    const orderCount = weekly.reduce((sum, day) => sum + day.orders, 0);

    res.json({
      stats: serializeSellerStats({
        totalRevenue: releasedAgg._sum.total ?? 0,
        pendingEscrow: wallet?.escrowLocked ?? 0,
        availablePayout: wallet?.availableBalance ?? 0,
        completedOrders,
        weekly,
        totalVolume,
        avgOrderValue: orderCount > 0 ? Math.round(totalVolume / orderCount) : 0,
        storeVisits: productAgg._sum.views ?? 0,
      }),
    });
  })
);

sellerRouter.get(
  '/orders',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const status = asString(req.query.status);

    const rows = await prisma.order.findMany({
      where: { storeId, ...(status ? { status: status as OrderStatus } : {}) },
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
      take: 200,
    });

    res.json({ orders: rows.map(serializeSellerOrder) });
  })
);

sellerRouter.get(
  '/wallet',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const [wallet, transactions] = await Promise.all([
      prisma.wallet.findUnique({ where: { storeId } }),
      prisma.transaction.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    res.json({ wallet: serializeWallet(wallet, transactions) });
  })
);

sellerRouter.get(
  '/payouts',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const payouts = await prisma.payoutRequest.findMany({
      where: { storeId },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({ payouts });
  })
);

sellerRouter.post(
  '/wallet/payouts',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const amount = asInt(req.body.amount);

    const wallet = await prisma.wallet.findUnique({ where: { storeId } });
    const available = wallet?.availableBalance ?? 0;

    if (amount <= 0) return badRequest(res, 'Please enter a valid withdrawal amount');
    if (amount > available) return badRequest(res, 'Insufficient available balance');

    const store = (req as SellerRequest).store;
    const bankName = asString(req.body.bankName, store.bankName ?? '');
    const accountName = asString(req.body.bankAccountName, store.bankAccountName ?? store.name);
    const accountNumber = asString(req.body.bankAccountNumber, store.bankAccountNumber ?? '');

    if (!bankName || !accountNumber) {
      return badRequest(res, 'Add your bank name and account number in Shop Settings first');
    }

    const payout = await prisma.$transaction(async (tx) => {
      const created = await tx.payoutRequest.create({
        data: { storeId, amount, bankName, accountName, accountNumber, status: 'PENDING' },
      });

      await tx.wallet.update({
        where: { storeId },
        data: { availableBalance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          reference: `PYT-${created.id.slice(-8).toUpperCase()}`,
          type: 'BANK_PAYOUT',
          status: 'PENDING',
          amount,
          description: `NIBSS Instant Transfer to ${bankName}`,
          account: `${bankName} (${accountNumber.slice(0, 4)}****${accountNumber.slice(-2)})`,
          storeId,
        },
      });

      return created;
    });

    const [updatedWallet, transactions] = await Promise.all([
      prisma.wallet.findUnique({ where: { storeId } }),
      prisma.transaction.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);

    await recordAudit(req, {
      action: 'payout.requested',
      category: 'FINANCE',
      entityType: 'PayoutRequest',
      entityId: payout.id,
      description: `Requested ₦${amount.toLocaleString('en-NG')} payout to ${bankName}`,
      metadata: { amount, bankName },
    });

    res.status(201).json({
      payout,
      wallet: serializeWallet(updatedWallet, transactions),
    });
  })
);
sellerRouter.get(
  '/messages',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const threads = await prisma.messageThread.findMany({
      where: { storeId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        store: { select: { avatar: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const productIds = threads.map((thread) => thread.productId).filter(Boolean) as string[];
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true, price: true, images: true },
        })
      : [];

    res.json({
      threads: threads.map((thread) => {
        const product = products.find((row) => row.id === thread.productId);
        return serializeMessageThread({
          ...thread,
          product: product
            ? {
                title: product.title,
                price: product.price,
                images: product.images,
                avatar: product.images[0],
              }
            : null,
        });
      }),
    });
  })
);

sellerRouter.post(
  '/messages/:threadId/reply',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const threadId = asString(req.params.threadId);
    const text = asString(req.body.text);
    if (!text) return badRequest(res, 'Message text is required');

    const thread = await prisma.messageThread.findFirst({ where: { id: threadId, storeId } });
    if (!thread) return notFound(res, 'Conversation not found');

    const message = await prisma.message.create({
      data: {
        threadId,
        senderRole: 'SELLER',
        senderId: req.user?.id ?? null,
        senderName: req.user?.name ?? 'Seller',
        text,
      },
    });

    await prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: message.createdAt, unreadForBuyer: { increment: 1 }, unreadForSeller: 0 },
    });

    await recordAudit(req, {
      action: 'message.sent',
      category: 'MESSAGE',
      entityType: 'MessageThread',
      entityId: threadId,
      description: 'Seller replied to a buyer enquiry',
    });

    res.status(201).json({ message });
  })
);

sellerRouter.get(
  '/logistics',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = (req as SellerRequest).store.id;
    const shipments = await prisma.shipment.findMany({
      where: { order: { storeId } },
      include: { events: { orderBy: { occurredAt: 'asc' } }, order: { select: { orderNumber: true, buyerCityState: true, total: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const pendingOrders = await prisma.order.findMany({
      where: { storeId, status: { in: ['ESCROW_SECURED', 'DISPATCHED'] } },
      select: { orderNumber: true, buyerName: true, buyerPhone: true, deliveryAddress: true, buyerCityState: true, deliveryState: true, total: true },
      orderBy: { placedAt: 'desc' },
    });

    res.json({ shipments, pendingOrders, couriers: COURIERS });
  })
);

sellerRouter.post(
  '/logistics/waybill',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as SellerRequest).store;
    const orderNumber = asString(req.body.orderNumber).replace(/^#/, '');
    const courier = asString(req.body.courier, COURIERS[0]);
    const weight = Number(asString(req.body.parcelWeight, '1'));

    const order = await prisma.order.findFirst({
      where: { orderNumber, storeId: store.id },
    });
    if (!order) return badRequest(res, 'Select a valid order from your store to generate a waybill for');

    const stateCode = order.deliveryState.substring(0, 3).toUpperCase();
    const waybillNumber = `${courier.slice(0, 3).toUpperCase()}-${stateCode}-${Math.floor(10000 + Math.random() * 89999)}`;

    const shipment = await prisma.shipment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        courier,
        waybillNumber,
        status: 'DISPATCHED',
        origin: store.location,
        destination: order.buyerCityState,
        recipientName: asString(req.body.recipientName, order.buyerName),
        recipientPhone: asString(req.body.recipientPhone, order.buyerPhone),
        riderName: asString(req.body.riderName) || null,
        riderPhone: asString(req.body.riderPhone) || null,
        estimatedDelivery: asString(req.body.estimatedDelivery, '2-4 business days'),
        dispatchedAt: new Date(),
      },
      update: {
        courier,
        waybillNumber,
        status: 'DISPATCHED',
        destination: order.buyerCityState,
        recipientName: asString(req.body.recipientName, order.buyerName),
        recipientPhone: asString(req.body.recipientPhone, order.buyerPhone),
        dispatchedAt: new Date(),
      },
    });

    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        title: 'Parcel picked up & scanned',
        subtitle: `Waybill ${waybillNumber} generated for ${weight || 1}kg parcel via ${courier}`,
        location: store.location,
        status: 'completed',
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DISPATCHED', courier, waybillNumber },
    });

    await recordAudit(req, {
      action: 'waybill.created',
      category: 'ORDER',
      entityType: 'Order',
      entityId: order.id,
      description: `Waybill ${waybillNumber} generated via ${courier} for ${order.orderNumber}`,
      metadata: { courier, waybillNumber, weight },
    });

    res.status(201).json({ shipment });
  })
);

sellerRouter.get(
  '/logistics/rate',
  requireSeller,
  asyncHandler(async (req, res) => {
    const origin = asString(req.query.origin, 'Lagos');
    const destination = asString(req.query.destination, 'Abuja (FCT)');
    const weight = Number(asString(req.query.weight, '1')) || 1;
    res.json({ origin, destination, weight, rate: computeRate(origin, destination, weight) });
  })
);

// ---------------------------------------------------------------------------
// Inventory management
// ---------------------------------------------------------------------------

function makeUniqueId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function titleSlugPart(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
      .replace(/-[^-]*$/, '') || 'item'
  );
}

async function resolveCategoryId(raw: string, fallbackSlug = 'phones-tablets'): Promise<string> {
  const key = raw || fallbackSlug;
  const category = await prisma.category.findFirst({
    where: { OR: [{ id: key }, { slug: key }, { name: key }] },
    select: { id: true },
  });
  if (category) return category.id;

  const fallback = await prisma.category.findFirst({ select: { id: true } });
  if (!fallback) throw new Error('No categories exist yet — run the seed script first');
  return fallback.id;
}

sellerRouter.post(
  '/products',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as SellerRequest).store;
    const title = asString(req.body.title);
    const price = asInt(req.body.price);
    if (title.length < 4) return badRequest(res, 'A descriptive listing title is required');
    if (price <= 0) return badRequest(res, 'Enter a valid price in Naira');

    const uniqueId = makeUniqueId();
    const images = asStringArray(req.body.images);
    const categoryId = await resolveCategoryId(asString(req.body.category));

    const product = await prisma.product.create({
      data: {
        slug: `${titleSlugPart(title)}-${uniqueId}`,
        uniqueId,
        title,
        description: asString(req.body.description),
        features: asStringArray(req.body.features),
        images: images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
        price,
        originalPrice: asInt(req.body.originalPrice) || null,
        shippingFee: asInt(req.body.shippingFee),
        badge: asString(req.body.badge) || null,
        condition: asString(req.body.condition, 'Brand New'),
        categoryId,
        storeId: store.id,
        location: asString(req.body.location, store.location),
        state: asString(req.body.state, store.state),
        inStock: req.body.inStock === undefined ? true : Boolean(req.body.inStock),
        stockQuantity: asInt(req.body.stockQuantity, 1),
        isDeal: Boolean(req.body.isDeal),
        isTrending: Boolean(req.body.isTrending),
        status: 'ACTIVE',
      },
      include: productInclude,
    });

    await recordAudit(req, {
      action: 'product.created',
      category: 'PRODUCT',
      entityType: 'Product',
      entityId: product.id,
      description: `Published listing "${product.title}" at ₦${price.toLocaleString('en-NG')}`,
      metadata: { price, categoryId },
    });

    res.status(201).json({ product: serializeProduct(product) });
  })
);

sellerRouter.patch(
  '/products/:id',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as SellerRequest).store;
    const id = asString(req.params.id);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], storeId: store.id },
    });
    if (!existing) return notFound(res, 'Listing not found in your store');

    const images = asStringArray(req.body.images);
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        title: asString(req.body.title) || undefined,
        description: asString(req.body.description) || undefined,
        features: req.body.features !== undefined ? asStringArray(req.body.features) : undefined,
        images: images.length ? images : undefined,
        price: asInt(req.body.price) || undefined,
        originalPrice: req.body.originalPrice !== undefined ? asInt(req.body.originalPrice) || null : undefined,
        shippingFee: req.body.shippingFee !== undefined ? asInt(req.body.shippingFee) : undefined,
        badge: req.body.badge !== undefined ? asString(req.body.badge) || null : undefined,
        condition: asString(req.body.condition) || undefined,
        categoryId: asString(req.body.category)
          ? await resolveCategoryId(asString(req.body.category))
          : undefined,
        location: asString(req.body.location) || undefined,
        state: asString(req.body.state) || undefined,
        inStock: req.body.inStock === undefined ? undefined : Boolean(req.body.inStock),
        stockQuantity: req.body.stockQuantity === undefined ? undefined : asInt(req.body.stockQuantity, 1),
        isDeal: req.body.isDeal === undefined ? undefined : Boolean(req.body.isDeal),
        isTrending: req.body.isTrending === undefined ? undefined : Boolean(req.body.isTrending),
        status: (asString(req.body.status) || undefined) as ProductStatus | undefined,
      },
      include: productInclude,
    });

    await recordAudit(req, {
      action: 'product.updated',
      category: 'PRODUCT',
      entityType: 'Product',
      entityId: product.id,
      description: `Updated listing "${product.title}"`,
      metadata: { fields: Object.keys(req.body ?? {}) },
    });

    res.json({ product: serializeProduct(product) });
  })
);

sellerRouter.delete(
  '/products/:id',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as SellerRequest).store;
    const id = asString(req.params.id);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], storeId: store.id },
      select: { id: true },
    });
    if (!existing) return notFound(res, 'Listing not found in your store');

    await prisma.product.update({ where: { id: existing.id }, data: { status: 'ARCHIVED' } });

    await recordAudit(req, {
      action: 'product.deleted',
      category: 'PRODUCT',
      entityType: 'Product',
      entityId: existing.id,
      description: 'Archived a listing',
    });

    res.json({ success: true });
  })
);

// ---------------------------------------------------------------------------
// komback.com (WooCommerce / Dokan) import
// ---------------------------------------------------------------------------

sellerRouter.post(
  '/woocommerce/sync',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as SellerRequest).store;
    const baseUrl = asString(req.body.baseUrl, process.env.WOOCOMMERCE_BASE_URL ?? 'https://komback.com');

    // A failed fetch throws — the client shows the real reason instead of fake data.
    const { products: incoming, endpoint } = await fetchKombackCatalog(baseUrl);

    let synced = 0;

    for (const item of incoming) {
      const category =
        (await prisma.category.findFirst({
          where: { OR: [{ slug: item.categorySlug }, { name: item.categoryName }] },
          select: { id: true },
        })) ??
        (await prisma.category.findFirst({ select: { id: true } }));

      if (!category) continue;

      await prisma.product.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          uniqueId: item.sourceId.slice(-12).padStart(7, '0').slice(-12),
          title: item.title,
          description: item.description,
          features: item.features,
          images: item.images,
          price: item.price,
          originalPrice: item.originalPrice,
          condition: 'Brand New',
          categoryId: category.id,
          storeId: store.id,
          location: store.location,
          state: store.state,
          rating: item.rating,
          reviewsCount: item.reviewsCount,
          inStock: item.inStock,
          stockQuantity: item.stockQuantity,
          status: 'ACTIVE',
          createdAt: item.createdAt,
        },
        update: {
          title: item.title,
          description: item.description,
          features: item.features,
          images: item.images,
          price: item.price,
          originalPrice: item.originalPrice,
          categoryId: category.id,
          inStock: item.inStock,
          stockQuantity: item.stockQuantity,
          rating: item.rating,
          reviewsCount: item.reviewsCount,
        },
      });

      synced += 1;
    }

    const products = await prisma.product.findMany({
      where: { storeId: store.id, status: 'ACTIVE' },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    await recordAudit(req, {
      action: 'product.imported',
      category: 'PRODUCT',
      description: `Imported ${synced} listing(s) from ${baseUrl}`,
      metadata: { synced, endpoint, baseUrl },
    });

    res.json({ synced, endpoint, products: products.map(serializeProduct) });
  })
);
