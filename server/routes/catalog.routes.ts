import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { asInt, asString, asyncHandler, badRequest, isEmail, notFound } from '../http';
import {
  COURIERS,
  NIGERIAN_BANKS,
  NIGERIAN_STATES,
  PRODUCT_BADGES,
  PRODUCT_CONDITIONS,
  SHIPPING_FEES,
} from '../constants';
import {
  categoryInclude,
  productInclude,
  serializeBlogPost,
  serializeCategory,
  serializeProduct,
  serializeReview,
  serializeStore,
  storeInclude,
} from '../serializers';
import { recordAudit } from '../audit';
import type { AuthedRequest } from '../auth';

export const catalogRouter = Router();

const MAX_PAGE_SIZE = 100;

/** Reference data the client needs for selects/validations. */
catalogRouter.get('/locations', (_req, res) => {
  res.json({
    states: NIGERIAN_STATES,
    cities: NIGERIAN_STATES.filter((state) => state !== 'All Nigeria'),
    banks: NIGERIAN_BANKS,
    couriers: COURIERS,
    conditions: PRODUCT_CONDITIONS,
    badges: PRODUCT_BADGES,
    shippingFees: SHIPPING_FEES,
  });
});

catalogRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      include: categoryInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories: rows.map(serializeCategory) });
  })
);

catalogRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const q = asString(req.query.q);
    const category = asString(req.query.category);
    const state = asString(req.query.state);
    const condition = asString(req.query.condition);
    const storeId = asString(req.query.storeId);
    const seller = asString(req.query.seller);
    const ids = asString(req.query.ids);
    const minPrice = asInt(req.query.minPrice, 0);
    const maxPrice = asInt(req.query.maxPrice, 0);
    const page = Math.max(1, asInt(req.query.page, 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, asInt(req.query.limit, 48)));

    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { store: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (category && category !== 'all') {
      where.category = { OR: [{ slug: category }, { id: category }, { name: category }] };
    }
    if (state && state !== 'All Nigeria') {
      where.state = state;
    }
    if (condition) where.condition = condition;
    if (storeId) where.storeId = storeId;
    if (seller) where.store = { OR: [{ id: seller }, { slug: seller }] };
    if (ids) where.id = { in: ids.split(',').map((value) => value.trim()).filter(Boolean) };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Prisma.IntFilter).gte = minPrice;
      if (maxPrice) (where.price as Prisma.IntFilter).lte = maxPrice;
    }
    if (req.query.deal === 'true') where.isDeal = true;
    if (req.query.trending === 'true') where.isTrending = true;
    if (req.query.featuredAd === 'true') where.isFeaturedAd = true;
    if (req.query.inStock === 'true') where.inStock = true;

    const sort = asString(req.query.sort, 'newest');
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'price-asc'
        ? [{ price: 'asc' }]
        : sort === 'price-desc'
          ? [{ price: 'desc' }]
          : sort === 'rating'
            ? [{ rating: 'desc' }, { reviewsCount: 'desc' }]
            : sort === 'popular'
              ? [{ reviewsCount: 'desc' }, { rating: 'desc' }]
              : [{ isFeaturedAd: 'desc' }, { createdAt: 'desc' }];

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      products: rows.map(serializeProduct),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  })
);

catalogRouter.get(
  '/products/:idOrSlug',
  asyncHandler(async (req, res) => {
    const key = asString(req.params.idOrSlug);
    const row = await prisma.product.findFirst({
      where: { OR: [{ id: key }, { slug: key }, { uniqueId: key }] },
      include: productInclude,
    });
    if (!row) return notFound(res, 'Listing not found');
    res.json({ product: serializeProduct(row) });
  })
);

catalogRouter.get(
  '/products/:idOrSlug/reviews',
  asyncHandler(async (req, res) => {
    const key = asString(req.params.idOrSlug);
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: key }, { slug: key }, { uniqueId: key }] },
      select: { id: true },
    });
    if (!product) return notFound(res, 'Listing not found');

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ reviews: reviews.map(serializeReview) });
  })
);

catalogRouter.post(
  '/products/:idOrSlug/reviews',
  asyncHandler(async (req: AuthedRequest, res) => {
    const key = asString(req.params.idOrSlug);
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: key }, { slug: key }, { uniqueId: key }] },
      select: { id: true, storeId: true },
    });
    if (!product) return notFound(res, 'Listing not found');

    const author = req.user?.name ?? asString(req.body.author);
    const comment = asString(req.body.comment);
    const rating = Math.min(5, Math.max(1, asInt(req.body.rating, 5)));
    const location = asString(req.body.location, req.user?.location ?? 'Verified Buyer, Nigeria');

    if (!author) return badRequest(res, 'A reviewer name is required');
    if (comment.length < 3) return badRequest(res, 'Please write a short review');

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        storeId: product.storeId,
        userId: req.user?.id ?? null,
        author,
        comment,
        rating,
        location,
      },
    });

    const aggregate = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number((aggregate._avg.rating ?? rating).toFixed(1)),
        reviewsCount: aggregate._count._all,
      },
    });

    await recordAudit(req, {
      action: 'review.created',
      category: 'CONTENT',
      entityType: 'Review',
      entityId: review.id,
      description: `${author} left a ${rating}-star review`,
      metadata: { productId: product.id, rating },
    });

    res.status(201).json({ review: serializeReview(review) });
  })
);
catalogRouter.get(
  '/reviews/recent',
  asyncHandler(async (req, res) => {
    const limit = Math.min(24, Math.max(1, asInt(req.query.limit, 6)));
    const rows = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ reviews: rows.map(serializeReview) });
  })
);

catalogRouter.get(
  '/stores',
  asyncHandler(async (req, res) => {
    const q = asString(req.query.q);
    const state = asString(req.query.state);
    const category = asString(req.query.category);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, asInt(req.query.limit, 60)));

    const where: Prisma.StoreWhereInput = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { tagline: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (state && state !== 'All Nigeria') where.state = state;
    if (category && category !== 'all') {
      where.category = { OR: [{ slug: category }, { id: category }, { name: category }] };
    }
    if (req.query.verified === 'true') where.isVerified = true;

    const rows = await prisma.store.findMany({
      where,
      include: storeInclude,
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }, { salesCount: 'desc' }],
      take: limit,
    });

    res.json({ stores: rows.map(serializeStore) });
  })
);

catalogRouter.get(
  '/stores/:idOrSlug',
  asyncHandler(async (req, res) => {
    const key = asString(req.params.idOrSlug);
    const row = await prisma.store.findFirst({
      where: { OR: [{ id: key }, { slug: key }, { name: key }] },
      include: storeInclude,
    });
    if (!row) return notFound(res, 'Store not found');
    res.json({ store: serializeStore(row) });
  })
);

catalogRouter.get(
  '/blog',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
    res.json({ posts: rows.map(serializeBlogPost) });
  })
);

catalogRouter.get(
  '/blog/:idOrSlug',
  asyncHandler(async (req, res) => {
    const key = asString(req.params.idOrSlug);
    const row = await prisma.blogPost.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
    });
    if (!row) return notFound(res, 'Article not found');
    res.json({ post: serializeBlogPost(row) });
  })
);

catalogRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [products, stores, categories] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.store.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
    ]);
    res.json({ products, stores, categories });
  })
);
