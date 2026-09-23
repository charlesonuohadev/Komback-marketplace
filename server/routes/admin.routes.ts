import { Router } from 'express';
import { Prisma, type AuditCategory, type OrderStatus, type Role } from '@prisma/client';
import { prisma } from '../db';
import {
  attachIdentity,
  hashPassword,
  requireAdmin,
  revokeUserSessions,
  type AuthedRequest,
} from '../auth';
import {
  asBool,
  asInt,
  asString,
  asStringArray,
  asyncHandler,
  badRequest,
  notFound,
  slugify,
} from '../http';
import { recordAudit } from '../audit';
import { inspectDatabase } from '../diagnostics';
import { NIGERIAN_BANKS, SHIPPING_FEES } from '../constants';
import {
  orderStatusFromLabel,
  orderStatusToLabel,
  orderInclude,
  productInclude,
  serializeProduct,
  serializeReview,
  serializeSellerOrder,
  serializeStore,
  storeInclude,
} from '../serializers';
import { isMailConfigured } from '../mailer';

export const adminRouter = Router();

adminRouter.use(attachIdentity, requireAdmin);

const MAX_PAGE_SIZE = 100;

function pagination(query: Record<string, unknown>) {
  const page = Math.max(1, asInt(query.page, 1));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, asInt(query.limit, 25)));
  return { page, limit, skip: (page - 1) * limit };
}

function paged<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

function adminUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  location: string | null;
  state: string | null;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: Date | null;
  banReason: string | null;
  emailVerified: boolean;
  adminNotes: string | null;
  lastLoginAt: Date | null;
  loginCount: number;
  createdAt: Date;
  store?: { id: string; name: string; slug: string; isVerified: boolean; isSuspended: boolean } | null;
  _count?: { orders?: number; reviews?: number };
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    location: user.location,
    state: user.state,
    isActive: user.isActive,
    isBanned: user.isBanned,
    bannedAt: user.bannedAt?.toISOString() ?? null,
    banReason: user.banReason,
    emailVerified: user.emailVerified,
    adminNotes: user.adminNotes,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    loginCount: user.loginCount,
    createdAt: user.createdAt.toISOString(),
    store: user.store ?? null,
    ordersCount: user._count?.orders ?? 0,
    reviewsCount: user._count?.reviews ?? 0,
  };
}

function adminOrder(row: {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  paymentStatus: string;
  placedAt: Date;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  deliveryAddress: string;
  buyerCityState: string;
  courier: string | null;
  waybillNumber: string | null;
  pinVerified: boolean;
  store: { id: string; name: string };
  items: { title: string; quantity: number; unitPrice: number; image: string }[];
}) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: orderStatusToLabel(row.status),
    statusCode: row.status,
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    total: row.total,
    paymentStatus: row.paymentStatus,
    placedAt: row.placedAt.toISOString(),
    buyer: {
      name: row.buyerName,
      phone: row.buyerPhone,
      email: row.buyerEmail,
      address: row.deliveryAddress,
      cityState: row.buyerCityState,
    },
    store: row.store,
    courier: row.courier,
    waybillNumber: row.waybillNumber,
    pinVerified: row.pinVerified,
    items: row.items,
  };
}

// ---------------------------------------------------------------------------
// Overview + system
// ---------------------------------------------------------------------------

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const since7 = new Date(Date.now() - 7 * 86_400_000);
    const since30 = new Date(Date.now() - 30 * 86_400_000);

    const [
      usersTotal,
      buyers,
      sellers,
      admins,
      bannedUsers,
      storesTotal,
      verifiedStores,
      suspendedStores,
      productsTotal,
      hiddenProducts,
      ordersTotal,
      ordersByStatus,
      revenueAgg,
      escrowAgg,
      pendingPayoutAgg,
      reviewsTotal,
      hiddenReviews,
      threadsTotal,
      postsTotal,
      signups7,
      signups30,
      orders30,
      topStores,
      recentOrders,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.store.count(),
      prisma.store.count({ where: { isVerified: true } }),
      prisma.store.count({ where: { isSuspended: true } }),
      prisma.product.count(),
      prisma.product.count({ where: { isHidden: true } }),
      prisma.order.count(),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.aggregate({ where: { status: 'RELEASED' }, _sum: { total: true } }),
      prisma.wallet.aggregate({ _sum: { escrowLocked: true, availableBalance: true } }),
      prisma.payoutRequest.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.review.count(),
      prisma.review.count({ where: { isHidden: true } }),
      prisma.messageThread.count(),
      prisma.blogPost.count(),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      prisma.order.findMany({
        where: { placedAt: { gte: since30 } },
        select: { total: true, placedAt: true, status: true },
      }),
      prisma.store.findMany({
        include: storeInclude,
        orderBy: { salesCount: 'desc' },
        take: 5,
      }),
      prisma.order.findMany({ include: orderInclude, orderBy: { placedAt: 'desc' }, take: 6 }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    // 30-day order trend for the chart.
    const trend = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
      const date = new Date(Date.now() - dayOffset * 86_400_000).toISOString().split('T')[0];
      trend.set(date, { date, orders: 0, revenue: 0 });
    }
    for (const order of orders30) {
      const date = order.placedAt.toISOString().split('T')[0];
      const bucket = trend.get(date);
      if (!bucket) continue;
      bucket.orders += 1;
      bucket.revenue += order.total;
    }

    res.json({
      kpis: {
        users: { total: usersTotal, buyers, sellers, admins, banned: bannedUsers },
        stores: { total: storesTotal, verified: verifiedStores, suspended: suspendedStores },
        products: { total: productsTotal, hidden: hiddenProducts },
        orders: {
          total: ordersTotal,
          byStatus: ordersByStatus.map((row) => ({
            status: orderStatusToLabel(row.status),
            statusCode: row.status,
            count: row._count._all,
          })),
        },
        finance: {
          grossRevenue: revenueAgg._sum.total ?? 0,
          escrowLocked: escrowAgg._sum.escrowLocked ?? 0,
          sellerBalances: escrowAgg._sum.availableBalance ?? 0,
          pendingPayouts: pendingPayoutAgg._sum.amount ?? 0,
          pendingPayoutCount: pendingPayoutAgg._count._all ?? 0,
        },
        engagement: {
          reviews: reviewsTotal,
          hiddenReviews,
          enquiries: threadsTotal,
          articles: postsTotal,
        },
        growth: { signups7, signups30 },
      },
      trend: Array.from(trend.values()),
      topStores: topStores.map((store) => ({
        ...serializeStore(store),
        revenue: store.salesCount,
      })),
      recentOrders: recentOrders.map(adminOrder),
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        action: entry.action,
        category: entry.category,
        description: entry.description,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        entityType: entry.entityType,
        entityId: entry.entityId,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  })
);

adminRouter.get(
  '/system/health',
  asyncHandler(async (_req, res) => {
    const report = await inspectDatabase();
    res.json({
      ...report,
      runtime: {
        node: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV ?? 'unset',
        mailConfigured: isMailConfigured(),
        payments: {
          paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
          flutterwave: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
        },
        appUrl: process.env.APP_URL || null,
      },
      shippingFees: SHIPPING_FEES,
    });
  })
);

adminRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = asString(req.query.q);
    const category = asString(req.query.category);
    const action = asString(req.query.action);
    const actorId = asString(req.query.actorId);
    const entityId = asString(req.query.entityId);
    const role = asString(req.query.role);

    const where: Prisma.AuditLogWhereInput = {};
    if (category) where.category = category as AuditCategory;
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;
    if (entityId) where.entityId = entityId;
    if (role) where.actorRole = role;
    if (q) {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { actorEmail: { contains: q, mode: 'insensitive' } },
        { actorName: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, rows, categories] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.auditLog.groupBy({ by: ['category'], _count: { _all: true } }),
    ]);

    res.json({
      ...paged(
        rows.map((row) => ({
          id: row.id,
          action: row.action,
          category: row.category,
          description: row.description,
          actorId: row.actorId,
          actorEmail: row.actorEmail,
          actorName: row.actorName,
          actorRole: row.actorRole,
          entityType: row.entityType,
          entityId: row.entityId,
          metadata: row.metadata,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent,
          createdAt: row.createdAt.toISOString(),
        })),
        total,
        page,
        limit
      ),
      categoryTotals: categories.map((row) => ({ category: row.category, count: row._count._all })),
    });
  })
);

// ---------------------------------------------------------------------------
// Users / buyers / sellers
// ---------------------------------------------------------------------------

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = asString(req.query.q);
    const role = asString(req.query.role);
    const status = asString(req.query.status); // active | banned | verified | unverified

    const where: Prisma.UserWhereInput = {};
    if (role && role !== 'all') where.role = role as Role;
    if (status === 'banned') where.isBanned = true;
    if (status === 'active') where.isBanned = false;
    if (status === 'verified') where.emailVerified = true;
    if (status === 'unverified') where.emailVerified = false;
    if (status === 'sellers') where.role = 'SELLER';
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { store: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, rows, roleTotals] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, slug: true, isVerified: true, isSuspended: true } },
          _count: { select: { orders: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    ]);

    res.json({
      ...paged(rows.map(adminUser), total, page, limit),
      roleTotals: roleTotals.map((row) => ({ role: row.role, count: row._count._all })),
    });
  })
);

adminRouter.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = asString(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, slug: true, isVerified: true, isSuspended: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!user) return notFound(res, 'User not found');

    const [orders, sessions, activity, reviews, wallet] = await Promise.all([
      prisma.order.findMany({ where: { buyerId: id }, include: orderInclude, orderBy: { placedAt: 'desc' }, take: 10 }),
      prisma.session.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.auditLog.findMany({ where: { actorId: id }, orderBy: { createdAt: 'desc' }, take: 25 }),
      prisma.review.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      user.store
        ? prisma.wallet.findUnique({ where: { storeId: user.store.id } })
        : Promise.resolve(null),
    ]);

    res.json({
      user: adminUser(user),
      orders: orders.map(adminOrder),
      sessions: sessions.map((session) => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
      activity: activity.map((entry) => ({
        id: entry.id,
        action: entry.action,
        category: entry.category,
        description: entry.description,
        createdAt: entry.createdAt.toISOString(),
        ipAddress: entry.ipAddress,
      })),
      reviews: reviews.map(serializeReview),
      wallet: wallet
        ? {
            availableBalance: wallet.availableBalance,
            escrowLocked: wallet.escrowLocked,
            totalSettled: wallet.totalSettled,
          }
        : null,
    });
  })
);

adminRouter.post(
  '/users',
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = asString(req.body.email).toLowerCase();
    const name = asString(req.body.name);
    const password = asString(req.body.password);
    const role = (asString(req.body.role, 'BUYER') as Role) ?? 'BUYER';

    if (name.length < 2) return badRequest(res, 'Enter the account holder name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest(res, 'Enter a valid email address');
    if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest(res, 'An account with that email already exists');

    const storeName = asString(req.body.storeName);
    const categorySlug = asString(req.body.storeCategorySlug);
    const category = categorySlug ? await prisma.category.findUnique({ where: { slug: categorySlug } }) : null;

    const created = await prisma.user.create({
      data: {
        email,
        name,
        phone: asString(req.body.phone) || null,
        role,
        passwordHash: await hashPassword(password),
        location: asString(req.body.location) || null,
        state: asString(req.body.state) || null,
        emailVerified: asBool(req.body.emailVerified, true),
        adminNotes: asString(req.body.adminNotes) || null,
        ...(role === 'SELLER' && storeName
          ? {
              store: {
                create: {
                  name: storeName,
                  slug: slugify(storeName),
                  tagline: asString(req.body.storeTagline, 'Verified Komback merchant'),
                  description: asString(req.body.storeDescription, 'Verified merchant on Komback.'),
                  location: asString(req.body.location, 'Nigeria'),
                  state: asString(req.body.state, 'Lagos'),
                  phone: asString(req.body.phone) || null,
                  email,
                  joinedDate: String(new Date().getFullYear()),
                  badges: ['Verified Merchant', 'Escrow Insured'],
                  categoryId: category?.id ?? null,
                  bankName: NIGERIAN_BANKS[0],
                  bankAccountName: storeName,
                  wallet: { create: {} },
                },
              },
            }
          : {}),
      },
      include: { store: { select: { id: true, name: true, slug: true, isVerified: true, isSuspended: true } } },
    });

    await recordAudit(req, {
      action: 'admin.user.created',
      category: 'USER',
      entityType: 'User',
      entityId: created.id,
      description: `Created ${role} account ${created.email}`,
      metadata: { role, storeName: storeName || null },
    });

    res.status(201).json({ user: adminUser(created) });
  })
);

adminRouter.patch(
  '/users/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'User not found');

    const role = asString(req.body.role) as Role | '';
    const changes: Prisma.UserUpdateInput = {
      name: asString(req.body.name) || undefined,
      phone: req.body.phone === undefined ? undefined : asString(req.body.phone) || null,
      location: req.body.location === undefined ? undefined : asString(req.body.location) || null,
      state: req.body.state === undefined ? undefined : asString(req.body.state) || null,
      avatar: req.body.avatar === undefined ? undefined : asString(req.body.avatar) || null,
      adminNotes: req.body.adminNotes === undefined ? undefined : asString(req.body.adminNotes) || null,
      emailVerified: req.body.emailVerified === undefined ? undefined : asBool(req.body.emailVerified),
      isActive: req.body.isActive === undefined ? undefined : asBool(req.body.isActive, true),
      role: role || undefined,
    };

    const newEmail = asString(req.body.email).toLowerCase();
    if (newEmail && newEmail !== existing.email) {
      const clash = await prisma.user.findUnique({ where: { email: newEmail } });
      if (clash) return badRequest(res, 'Another account already uses that email address');
      changes.email = newEmail;
    }

    const password = asString(req.body.password);
    if (password) {
      if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters');
      changes.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: changes,
      include: {
        store: { select: { id: true, name: true, slug: true, isVerified: true, isSuspended: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    // Changing a password or deactivating an account must end existing sessions.
    let revoked = 0;
    if (password || changes.isActive === false || (role && role !== existing.role)) {
      revoked = await revokeUserSessions(id);
    }

    await recordAudit(req, {
      action: 'admin.user.updated',
      category: 'USER',
      entityType: 'User',
      entityId: id,
      description: `Updated account ${updated.email}`,
      metadata: {
        fields: Object.keys(changes),
        passwordChanged: Boolean(password),
        sessionsRevoked: revoked,
      },
    });

    res.json({ user: adminUser(updated), sessionsRevoked: revoked });
  })
);

adminRouter.post(
  '/users/:id/ban',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const reason = asString(req.body.reason, 'Violation of Komback marketplace policy');

    const user = await prisma.user.findUnique({ where: { id }, include: { store: true } });
    if (!user) return notFound(res, 'User not found');
    if (user.id === req.user?.id) return badRequest(res, 'You cannot ban your own account');

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
        bannedById: req.user?.id ?? null,
      },
      include: {
        store: { select: { id: true, name: true, slug: true, isVerified: true, isSuspended: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    // A banned account loses access immediately...
    const revoked = await revokeUserSessions(id);

    // ...and its storefront stops trading.
    if (user.store && asBool(req.body.suspendStore, true)) {
      await prisma.store.update({
        where: { id: user.store.id },
        data: { isSuspended: true, suspendedAt: new Date(), suspendReason: `Owner banned: ${reason}` },
      });
      await prisma.product.updateMany({ where: { storeId: user.store.id }, data: { isHidden: true } });
    }

    await recordAudit(req, {
      action: 'admin.user.banned',
      category: 'USER',
      entityType: 'User',
      entityId: id,
      description: `Banned ${updated.email}: ${reason}`,
      metadata: { reason, sessionsRevoked: revoked, storeSuspended: Boolean(user.store) },
    });

    res.json({ user: adminUser(updated), sessionsRevoked: revoked });
  })
);

adminRouter.post(
  '/users/:id/unban',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const user = await prisma.user.findUnique({ where: { id }, include: { store: true } });
    if (!user) return notFound(res, 'User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: false, bannedAt: null, banReason: null, bannedById: null },
      include: {
        store: { select: { id: true, name: true, slug: true, isVerified: true, isSuspended: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (user.store && asBool(req.body.reinstateStore, true)) {
      await prisma.store.update({
        where: { id: user.store.id },
        data: { isSuspended: false, suspendedAt: null, suspendReason: null },
      });
      await prisma.product.updateMany({ where: { storeId: user.store.id }, data: { isHidden: false } });
    }

    await recordAudit(req, {
      action: 'admin.user.unbanned',
      category: 'USER',
      entityType: 'User',
      entityId: id,
      description: `Reinstated ${updated.email}`,
    });

    res.json({ user: adminUser(updated) });
  })
);

adminRouter.delete(
  '/users/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const user = await prisma.user.findUnique({ where: { id }, include: { store: true } });
    if (!user) return notFound(res, 'User not found');
    if (user.id === req.user?.id) return badRequest(res, 'You cannot delete your own account');

    const deleteStore = asBool(req.query.deleteStore) || asBool(req.body?.deleteStore);

    await revokeUserSessions(id);

    if (user.store && deleteStore) {
      // Cascades products, orders, wallet, shipments and conversations.
      await prisma.store.delete({ where: { id: user.store.id } });
    }

    await prisma.user.delete({ where: { id } });

    await recordAudit(req, {
      action: 'admin.user.deleted',
      category: 'USER',
      entityType: 'User',
      entityId: id,
      description: `Deleted account ${user.email} (${user.role})`,
      metadata: { role: user.role, storeDeleted: Boolean(user.store && deleteStore) },
    });

    res.json({ success: true, storeDeleted: Boolean(user.store && deleteStore) });
  })
);

adminRouter.post(
  '/users/:id/revoke-sessions',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!user) return notFound(res, 'User not found');

    const revoked = await revokeUserSessions(id);

    await recordAudit(req, {
      action: 'admin.user.sessions_revoked',
      category: 'USER',
      entityType: 'User',
      entityId: id,
      description: `Force-signed out ${user.email} (${revoked} session(s))`,
    });

    res.json({ success: true, sessionsRevoked: revoked });
  })
);

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

adminRouter.get(
  '/stores',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = asString(req.query.q);
    const state = asString(req.query.state);
    const status = asString(req.query.status);

    const where: Prisma.StoreWhereInput = {};
    if (state && state !== 'All Nigeria') where.state = state;
    if (status === 'verified') where.isVerified = true;
    if (status === 'unverified') where.isVerified = false;
    if (status === 'suspended') where.isSuspended = true;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { tagline: { contains: q, mode: 'insensitive' } },
        { owner: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        include: { ...storeInclude, owner: { select: { id: true, email: true, name: true, isBanned: true } }, wallet: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json(
      paged(
        rows.map((store) => ({
          ...serializeStore(store),
          isSuspended: store.isSuspended,
          suspendReason: store.suspendReason,
          suspendedAt: store.suspendedAt?.toISOString() ?? null,
          isFeaturedStore: store.isFeaturedStore,
          adminNotes: store.adminNotes,
          createdAt: store.createdAt.toISOString(),
          owner: store.owner,
          wallet: store.wallet
            ? {
                availableBalance: store.wallet.availableBalance,
                escrowLocked: store.wallet.escrowLocked,
                totalSettled: store.wallet.totalSettled,
              }
            : null,
        })),
        total,
        page,
        limit
      )
    );
  })
);

adminRouter.patch(
  '/stores/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const existing = await prisma.store.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Store not found');

    const updated = await prisma.store.update({
      where: { id },
      data: {
        name: asString(req.body.name) || undefined,
        tagline: req.body.tagline === undefined ? undefined : asString(req.body.tagline),
        description: req.body.description === undefined ? undefined : asString(req.body.description),
        location: asString(req.body.location) || undefined,
        state: asString(req.body.state) || undefined,
        phone: asString(req.body.phone) || undefined,
        isVerified: req.body.isVerified === undefined ? undefined : asBool(req.body.isVerified),
        isFeaturedStore:
          req.body.isFeaturedStore === undefined ? undefined : asBool(req.body.isFeaturedStore),
        adminNotes: req.body.adminNotes === undefined ? undefined : asString(req.body.adminNotes) || null,
        badges: req.body.badges === undefined ? undefined : asStringArray(req.body.badges),
      },
      include: storeInclude,
    });

    await recordAudit(req, {
      action: 'admin.store.updated',
      category: 'STORE',
      entityType: 'Store',
      entityId: id,
      description: `Updated store ${updated.name}`,
      metadata: { fields: Object.keys(req.body ?? {}) },
    });

    res.json({ store: serializeStore(updated) });
  })
);

adminRouter.post(
  '/stores/:id/verify',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const isVerified = asBool(req.body.isVerified, true);

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return notFound(res, 'Store not found');

    const updated = await prisma.store.update({ where: { id }, data: { isVerified }, include: storeInclude });

    await recordAudit(req, {
      action: 'admin.store.verified',
      category: 'STORE',
      entityType: 'Store',
      entityId: id,
      description: `${isVerified ? 'Verified' : 'Removed verification from'} store ${store.name}`,
    });

    res.json({ store: serializeStore(updated) });
  })
);

adminRouter.post(
  '/stores/:id/suspend',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const reason = asString(req.body.reason, 'Under review by Komback trust & safety');

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return notFound(res, 'Store not found');

    const updated = await prisma.store.update({
      where: { id },
      data: { isSuspended: true, suspendedAt: new Date(), suspendReason: reason },
      include: storeInclude,
    });

    const hidden = await prisma.product.updateMany({
      where: { storeId: id },
      data: { isHidden: true },
    });

    await recordAudit(req, {
      action: 'admin.store.suspended',
      category: 'STORE',
      entityType: 'Store',
      entityId: id,
      description: `Suspended store ${store.name}: ${reason}`,
      metadata: { listingsHidden: hidden.count },
    });

    res.json({ store: serializeStore(updated), listingsHidden: hidden.count });
  })
);

adminRouter.post(
  '/stores/:id/reinstate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return notFound(res, 'Store not found');

    const updated = await prisma.store.update({
      where: { id },
      data: { isSuspended: false, suspendedAt: null, suspendReason: null },
      include: storeInclude,
    });

    const restored = await prisma.product.updateMany({
      where: { storeId: id },
      data: { isHidden: false },
    });

    await recordAudit(req, {
      action: 'admin.store.reinstated',
      category: 'STORE',
      entityType: 'Store',
      entityId: id,
      description: `Reinstated store ${store.name}`,
      metadata: { listingsRestored: restored.count },
    });

    res.json({ store: serializeStore(updated), listingsRestored: restored.count });
  })
);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

adminRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = asString(req.query.q);
    const status = asString(req.query.status);
    const paymentStatus = asString(req.query.paymentStatus);
    const storeId = asString(req.query.storeId);

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = orderStatusFromLabel(status) as OrderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus as Prisma.OrderWhereInput['paymentStatus'];
    if (storeId) where.storeId = storeId;
    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { buyerName: { contains: q, mode: 'insensitive' } },
        { buyerPhone: { contains: q, mode: 'insensitive' } },
        { buyerEmail: { contains: q, mode: 'insensitive' } },
        { waybillNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, rows, statusTotals] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, include: orderInclude, orderBy: { placedAt: 'desc' }, skip, take: limit }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, _sum: { total: true } }),
    ]);

    res.json({
      ...paged(rows.map(adminOrder), total, page, limit),
      statusTotals: statusTotals.map((row) => ({
        status: orderStatusToLabel(row.status),
        statusCode: row.status,
        count: row._count._all,
        value: row._sum.total ?? 0,
      })),
    });
  })
);

adminRouter.patch(
  '/orders/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return notFound(res, 'Order not found');

    const statusLabel = asString(req.body.status);
    const data: Prisma.OrderUpdateInput = {
      courier: req.body.courier === undefined ? undefined : asString(req.body.courier) || null,
      waybillNumber: req.body.waybillNumber === undefined ? undefined : asString(req.body.waybillNumber) || null,
      courierNote: req.body.note === undefined ? undefined : asString(req.body.note) || null,
    };

    if (statusLabel) {
      const status = orderStatusFromLabel(statusLabel) as OrderStatus;
      data.status = status;
      if (status === 'RELEASED' && !order.releasedAt) {
        data.releasedAt = new Date();
        data.pinVerified = true;
      }
      if (status === 'CANCELLED') {
        data.paymentStatus = 'REFUNDED';
      }
    }

    if (req.body.paymentStatus) {
      data.paymentStatus = req.body.paymentStatus as Prisma.OrderUpdateInput['paymentStatus'];
    }

    const updated = await prisma.order.update({ where: { id }, data, include: orderInclude });

    await recordAudit(req, {
      action: statusLabel === 'Cancelled' ? 'order.cancelled' : 'admin.order.updated',
      category: 'ORDER',
      entityType: 'Order',
      entityId: id,
      description: `Admin updated order ${order.orderNumber}${statusLabel ? ` → ${statusLabel}` : ''}`,
      metadata: { previousStatus: order.status, changes: req.body },
    });

    res.json({ order: adminOrder(updated) });
  })
);

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

adminRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = asString(req.query.q);
    const status = asString(req.query.status);
    const storeId = asString(req.query.storeId);

    const where: Prisma.ProductWhereInput = {};
    if (status === 'hidden') where.isHidden = true;
    if (status === 'visible') where.isHidden = false;
    if (status && ['DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED'].includes(status)) {
      where.status = status as Prisma.ProductWhereInput['status'];
    }
    if (storeId) where.storeId = storeId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { store: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);

    res.json(
      paged(
        rows.map((row) => ({
          ...serializeProduct(row),
          status: row.status,
          isHidden: row.isHidden,
          views: row.views,
          stockQuantity: row.stockQuantity,
          adminNotes: row.adminNotes,
          createdAt: row.createdAt.toISOString(),
        })),
        total,
        page,
        limit
      )
    );
  })
);

adminRouter.patch(
  '/products/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return notFound(res, 'Listing not found');

    const updated = await prisma.product.update({
      where: { id },
      data: {
        isHidden: req.body.isHidden === undefined ? undefined : asBool(req.body.isHidden),
        isFeaturedAd: req.body.isFeaturedAd === undefined ? undefined : asBool(req.body.isFeaturedAd),
        featuredBadgeText:
          req.body.featuredBadgeText === undefined ? undefined : asString(req.body.featuredBadgeText) || null,
        adminNotes: req.body.adminNotes === undefined ? undefined : asString(req.body.adminNotes) || null,
        badge: req.body.badge === undefined ? undefined : asString(req.body.badge) || null,
        status: (asString(req.body.status) || undefined) as Prisma.ProductUpdateInput['status'],
        title: asString(req.body.title) || undefined,
        price: asInt(req.body.price) || undefined,
      },
      include: productInclude,
    });

    await recordAudit(req, {
      action: 'admin.product.updated',
      category: 'PRODUCT',
      entityType: 'Product',
      entityId: id,
      description: `Moderated listing "${product.title}"`,
      metadata: { changes: req.body },
    });

    res.json({ product: serializeProduct(updated) });
  })
);

adminRouter.delete(
  '/products/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return notFound(res, 'Listing not found');

    await prisma.product.delete({ where: { id } });

    await recordAudit(req, {
      action: 'admin.product.deleted',
      category: 'PRODUCT',
      entityType: 'Product',
      entityId: id,
      description: `Deleted listing "${product.title}" from ${product.storeId}`,
    });

    res.json({ success: true });
  })
);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

adminRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.category.findMany({
      include: { _count: { select: { products: true, stores: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json({
      categories: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: row.icon,
        image: row.image,
        description: row.description,
        popularSubcategories: row.popularSubcategories,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        productCount: row._count.products,
        storeCount: row._count.stores,
      })),
    });
  })
);

adminRouter.post(
  '/categories',
  asyncHandler(async (req: AuthedRequest, res) => {
    const name = asString(req.body.name);
    if (name.length < 2) return badRequest(res, 'Enter a category name');

    const slug = asString(req.body.slug) || slugify(name);
    const clash = await prisma.category.findFirst({ where: { OR: [{ slug }, { name }] } });
    if (clash) return badRequest(res, 'A category with that name or slug already exists');

    const created = await prisma.category.create({
      data: {
        name,
        slug,
        icon: asString(req.body.icon, '📦'),
        image: asString(req.body.image),
        description: asString(req.body.description),
        popularSubcategories: asStringArray(req.body.popularSubcategories),
        sortOrder: asInt(req.body.sortOrder, 99),
        isActive: asBool(req.body.isActive, true),
      },
    });

    await recordAudit(req, {
      action: 'admin.category.created',
      category: 'CONTENT',
      entityType: 'Category',
      entityId: created.id,
      description: `Created category ${created.name}`,
    });

    res.status(201).json({ category: created });
  })
);

adminRouter.patch(
  '/categories/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Category not found');

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: asString(req.body.name) || undefined,
        icon: req.body.icon === undefined ? undefined : asString(req.body.icon) || '📦',
        image: req.body.image === undefined ? undefined : asString(req.body.image),
        description: req.body.description === undefined ? undefined : asString(req.body.description),
        popularSubcategories:
          req.body.popularSubcategories === undefined ? undefined : asStringArray(req.body.popularSubcategories),
        sortOrder: req.body.sortOrder === undefined ? undefined : asInt(req.body.sortOrder, 99),
        isActive: req.body.isActive === undefined ? undefined : asBool(req.body.isActive, true),
      },
    });

    await recordAudit(req, {
      action: 'admin.category.updated',
      category: 'CONTENT',
      entityType: 'Category',
      entityId: id,
      description: `Updated category ${updated.name}`,
    });

    res.json({ category: updated });
  })
);

adminRouter.delete(
  '/categories/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) return notFound(res, 'Category not found');

    if (category._count.products > 0 && !asBool(req.query.force)) {
      return badRequest(
        res,
        `${category._count.products} listing(s) still use this category. Move them first, or pass force=true.`
      );
    }

    await prisma.category.delete({ where: { id } });

    await recordAudit(req, {
      action: 'admin.category.deleted',
      category: 'CONTENT',
      entityType: 'Category',
      entityId: id,
      description: `Deleted category ${category.name}`,
      metadata: { listingsAffected: category._count.products },
    });

    res.json({ success: true });
  })
);

// ---------------------------------------------------------------------------
// Blog / content
// ---------------------------------------------------------------------------

adminRouter.get(
  '/blog',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });
    res.json({ posts: rows });
  })
);

adminRouter.post(
  '/blog',
  asyncHandler(async (req: AuthedRequest, res) => {
    const title = asString(req.body.title);
    if (title.length < 4) return badRequest(res, 'Enter an article title');

    const slug = asString(req.body.slug) || slugify(title);
    const clash = await prisma.blogPost.findUnique({ where: { slug } });
    if (clash) return badRequest(res, 'An article with that slug already exists');

    const created = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: asString(req.body.excerpt),
        content: asString(req.body.content),
        category: asString(req.body.category, 'Marketplace'),
        image: asString(req.body.image),
        tags: asStringArray(req.body.tags),
        readTime: asString(req.body.readTime, '4 min read'),
        authorName: asString(req.body.authorName, req.user?.name ?? 'Komback Editorial'),
        authorRole: asString(req.body.authorRole, 'Marketplace Desk'),
        authorAvatar: asString(req.body.authorAvatar),
        isPublished: asBool(req.body.isPublished, true),
        publishedAt: new Date(),
      },
    });

    await recordAudit(req, {
      action: 'admin.blog.created',
      category: 'CONTENT',
      entityType: 'BlogPost',
      entityId: created.id,
      description: `Published article "${created.title}"`,
    });

    res.status(201).json({ post: created });
  })
);

adminRouter.patch(
  '/blog/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Article not found');

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: asString(req.body.title) || undefined,
        excerpt: req.body.excerpt === undefined ? undefined : asString(req.body.excerpt),
        content: req.body.content === undefined ? undefined : asString(req.body.content),
        category: asString(req.body.category) || undefined,
        image: req.body.image === undefined ? undefined : asString(req.body.image),
        tags: req.body.tags === undefined ? undefined : asStringArray(req.body.tags),
        readTime: asString(req.body.readTime) || undefined,
        authorName: asString(req.body.authorName) || undefined,
        authorRole: asString(req.body.authorRole) || undefined,
        isPublished: req.body.isPublished === undefined ? undefined : asBool(req.body.isPublished, true),
      },
    });

    await recordAudit(req, {
      action: 'admin.blog.updated',
      category: 'CONTENT',
      entityType: 'BlogPost',
      entityId: id,
      description: `Updated article "${updated.title}"`,
    });

    res.json({ post: updated });
  })
);

adminRouter.delete(
  '/blog/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return notFound(res, 'Article not found');

    await prisma.blogPost.delete({ where: { id } });

    await recordAudit(req, {
      action: 'admin.blog.deleted',
      category: 'CONTENT',
      entityType: 'BlogPost',
      entityId: id,
      description: `Deleted article "${post.title}"`,
    });

    res.json({ success: true });
  })
);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

adminRouter.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = asString(req.query.q);
    const status = asString(req.query.status);

    const where: Prisma.ReviewWhereInput = {};
    if (status === 'hidden') where.isHidden = true;
    if (status === 'visible') where.isHidden = false;
    if (q) {
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { product: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: { product: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json(
      paged(
        rows.map((row) => ({
          ...serializeReview(row),
          isHidden: row.isHidden,
          createdAt: row.createdAt.toISOString(),
          product: row.product,
        })),
        total,
        page,
        limit
      )
    );
  })
);

adminRouter.patch(
  '/reviews/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return notFound(res, 'Review not found');

    const updated = await prisma.review.update({
      where: { id },
      data: { isHidden: asBool(req.body.isHidden, true) },
    });

    await recordAudit(req, {
      action: updated.isHidden ? 'admin.review.hidden' : 'admin.review.restored',
      category: 'CONTENT',
      entityType: 'Review',
      entityId: id,
      description: `${updated.isHidden ? 'Hid' : 'Restored'} review by ${review.author}`,
    });

    res.json({ review: serializeReview(updated), isHidden: updated.isHidden });
  })
);

adminRouter.delete(
  '/reviews/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return notFound(res, 'Review not found');

    await prisma.review.delete({ where: { id } });

    await recordAudit(req, {
      action: 'admin.review.deleted',
      category: 'CONTENT',
      entityType: 'Review',
      entityId: id,
      description: `Deleted review by ${review.author}`,
    });

    res.json({ success: true });
  })
);

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

adminRouter.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const type = asString(req.query.type);
    const storeId = asString(req.query.storeId);
    const q = asString(req.query.q);

    const where: Prisma.TransactionWhereInput = {};
    if (type) where.type = type as Prisma.TransactionWhereInput['type'];
    if (storeId) where.storeId = storeId;
    if (q) {
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { account: { contains: q, mode: 'insensitive' } },
        { provider: { contains: q, mode: 'insensitive' } },
        { store: { is: { name: { contains: q, mode: 'insensitive' } } } },
        { order: { is: { orderNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [total, rows, totals] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { store: { select: { id: true, name: true } }, order: { select: { orderNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true }, _count: { _all: true } }),
    ]);

    res.json({
      ...paged(
        rows.map((row) => ({
          id: row.id,
          reference: row.reference,
          type: row.type,
          status: row.status,
          amount: row.amount,
          description: row.description,
          account: row.account,
          provider: row.provider,
          store: row.store,
          orderNumber: row.order?.orderNumber ?? null,
          createdAt: row.createdAt.toISOString(),
        })),
        total,
        page,
        limit
      ),
      totals: totals.map((row) => ({ type: row.type, amount: row._sum.amount ?? 0, count: row._count._all })),
    });
  })
);

adminRouter.get(
  '/payouts',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const status = asString(req.query.status);

    const where: Prisma.PayoutRequestWhereInput = {};
    if (status) where.status = status as Prisma.PayoutRequestWhereInput['status'];

    const [total, rows] = await Promise.all([
      prisma.payoutRequest.count({ where }),
      prisma.payoutRequest.findMany({
        where,
        include: { store: { select: { id: true, name: true, slug: true } } },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json(
      paged(
        rows.map((row) => ({
          id: row.id,
          amount: row.amount,
          bankName: row.bankName,
          accountName: row.accountName,
          accountNumber: row.accountNumber,
          status: row.status,
          note: row.note,
          requestedAt: row.requestedAt.toISOString(),
          processedAt: row.processedAt?.toISOString() ?? null,
          store: row.store,
        })),
        total,
        page,
        limit
      )
    );
  })
);

adminRouter.post(
  '/payouts/:id/:decision',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = asString(req.params.id);
    const decision = asString(req.params.decision); // approve | reject
    if (!['approve', 'reject'].includes(decision)) return badRequest(res, 'Decision must be approve or reject');

    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
      include: { store: { select: { id: true, name: true } } },
    });
    if (!payout) return notFound(res, 'Payout request not found');
    if (payout.status !== 'PENDING') return badRequest(res, `This payout is already ${payout.status.toLowerCase()}`);

    const approved = decision === 'approve';

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: approved ? 'COMPLETED' : 'REJECTED',
          processedAt: new Date(),
          note: asString(req.body.note) || payout.note,
        },
      });

      if (approved) {
        await tx.transaction.updateMany({
          where: { storeId: payout.storeId, type: 'BANK_PAYOUT', status: 'PENDING' },
          data: { status: 'COMPLETED' },
        });
      } else {
        // Rejected payouts return the money to the seller's available balance.
        await tx.wallet.upsert({
          where: { storeId: payout.storeId },
          create: { storeId: payout.storeId, availableBalance: payout.amount },
          update: { availableBalance: { increment: payout.amount } },
        });
        await tx.transaction.updateMany({
          where: { storeId: payout.storeId, type: 'BANK_PAYOUT', status: 'PENDING' },
          data: { status: 'FAILED' },
        });
      }

      return result;
    });

    await recordAudit(req, {
      action: approved ? 'payout.approved' : 'payout.rejected',
      category: 'FINANCE',
      entityType: 'PayoutRequest',
      entityId: id,
      description: `${approved ? 'Approved' : 'Rejected'} ₦${payout.amount.toLocaleString('en-NG')} payout for ${payout.store.name}`,
      metadata: { amount: payout.amount, storeId: payout.storeId },
    });

    res.json({ payout: updated });
  })
);

adminRouter.post(
  '/wallets/:storeId/adjust',
  asyncHandler(async (req: AuthedRequest, res) => {
    const storeId = asString(req.params.storeId);
    const amount = asInt(req.body.amount);
    const reason = asString(req.body.reason, 'Manual adjustment by administrator');

    if (!amount) return badRequest(res, 'Enter a non-zero amount (positive to credit, negative to debit)');

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return notFound(res, 'Store not found');

    const wallet = await prisma.wallet.upsert({
      where: { storeId },
      create: { storeId, availableBalance: Math.max(0, amount) },
      update: { availableBalance: { increment: amount } },
    });

    if (wallet.availableBalance < 0) {
      return badRequest(res, 'That adjustment would push the wallet balance below zero');
    }

    await prisma.transaction.create({
      data: {
        reference: `ADJ-${Date.now()}`,
        type: amount > 0 ? 'BANK_PAYOUT' : 'REFUND',
        status: 'COMPLETED',
        amount: Math.abs(amount),
        description: reason,
        account: `Admin adjustment (${req.user?.email})`,
        storeId,
      },
    });

    await recordAudit(req, {
      action: 'admin.wallet.adjusted',
      category: 'FINANCE',
      entityType: 'Store',
      entityId: storeId,
      description: `${amount > 0 ? 'Credited' : 'Debited'} ₦${Math.abs(amount).toLocaleString('en-NG')} on ${store.name}`,
      metadata: { amount, reason, balanceAfter: wallet.availableBalance },
    });

    res.json({ wallet });
  })
);

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Record<string, unknown> = {
  maintenanceMode: false,
  maintenanceMessage: 'Komback is undergoing scheduled maintenance. Please check back shortly.',
  allowNewRegistrations: true,
  allowNewListings: true,
  supportEmail: 'support@komback.com',
  supportPhone: '+234 800 000 0000',
  featuredCategoryLimit: 12,
};

async function readSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.platformSetting.findMany();
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...DEFAULT_SETTINGS, ...stored };
}

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({
      settings: await readSettings(),
      defaults: DEFAULT_SETTINGS,
      updated: rows.map((row) => ({
        key: row.key,
        value: row.value,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  })
);

adminRouter.patch(
  '/settings',
  asyncHandler(async (req: AuthedRequest, res) => {
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const keys = Object.keys(payload);
    if (keys.length === 0) return badRequest(res, 'No settings were provided');

    // Only known keys can be written, and every write is audited.
    const unknown = keys.filter((key) => !(key in DEFAULT_SETTINGS));
    if (unknown.length > 0) return badRequest(res, `Unknown setting(s): ${unknown.join(', ')}`);

    await prisma.$transaction(
      keys.map((key) =>
        prisma.platformSetting.upsert({
          where: { key },
          create: {
            key,
            value: payload[key] as Prisma.InputJsonValue,
            updatedById: req.user?.id ?? null,
          },
          update: { value: payload[key] as Prisma.InputJsonValue, updatedById: req.user?.id ?? null },
        })
      )
    );

    await recordAudit(req, {
      action: 'admin.settings.updated',
      category: 'SYSTEM',
      description: `Updated platform settings: ${keys.join(', ')}`,
      metadata: payload,
    });

    res.json({ settings: await readSettings() });
  })
);

/** Public helper used by the storefront to react to maintenance mode. */
export async function loadPublicFlags(): Promise<{ maintenanceMode: boolean; maintenanceMessage: string }> {
  const settings = await readSettings();
  return {
    maintenanceMode: Boolean(settings.maintenanceMode),
    maintenanceMessage: String(settings.maintenanceMessage ?? DEFAULT_SETTINGS.maintenanceMessage),
  };
}
