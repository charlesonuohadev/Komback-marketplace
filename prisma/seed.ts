/**
 * Seeds PostgreSQL with the marketplace's initial catalog, editorial content,
 * merchant accounts, orders and wallet history.
 *
 * Run with:  npm run db:seed
 *
 * The script is idempotent: it wipes and re-inserts the seeded rows. It refuses to
 * run against a database that already contains products unless SEED_FORCE=true,
 * so it can never silently clobber live data.
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_BLOG_POSTS, SEED_CATEGORIES, SEED_REVIEWS, SEED_STORES } from './seed-data/catalog';
import { SEED_PRODUCTS } from './seed-data/products';
import { NIGERIAN_BANKS } from '../server/constants';

dotenv.config();

const prisma = new PrismaClient();

const NGN = (value: number) => Math.round(value);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Parses labels such as "3 days ago", "1 week ago" or "Aug 14, 2026". */
function parseRelativeDate(label: string, fallbackDaysAgo = 7): Date {
  const relative = /(\d+)\s*(day|week|month|hour|minute)/i.exec(label);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const ms =
      unit === 'minute'
        ? amount * 60_000
        : unit === 'hour'
          ? amount * 3_600_000
          : unit === 'day'
            ? amount * 86_400_000
            : unit === 'week'
              ? amount * 7 * 86_400_000
              : amount * 30 * 86_400_000;
    return new Date(Date.now() - ms);
  }

  const parsed = new Date(label);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const justNow = /just now/i.test(label);
  if (justNow) return new Date();

  return new Date(Date.now() - fallbackDaysAgo * 86_400_000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

async function assertSafeToSeed(): Promise<void> {
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0 && process.env.SEED_FORCE !== 'true') {
    console.log(
      `\n⚠️  Database already contains ${existingProducts} products.\n` +
        '   Re-run with SEED_FORCE=true if you really want to wipe and re-seed.\n'
    );
    process.exit(0);
  }
}

async function wipe(): Promise<void> {
  // Ordered to respect foreign keys.
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.store.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await assertSafeToSeed();
  console.log('→ Wiping existing seeded data…');
  await wipe();

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  console.log('→ Seeding categories…');
  for (const [index, category] of SEED_CATEGORIES.entries()) {
    await prisma.category.create({
      data: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        icon: category.icon,
        image: category.image,
        description: category.description,
        popularSubcategories: category.popularSubcategories,
        sortOrder: index,
      },
    });
  }

  const categoryBySlug = new Map(
    (await prisma.category.findMany()).map((category) => [category.slug, category])
  );
  const categoryByName = new Map(
    (await prisma.category.findMany()).map((category) => [category.name, category])
  );

  // -------------------------------------------------------------------------
  // Stores — the 6 curated storefronts plus any merchant referenced only by a listing
  // -------------------------------------------------------------------------
  console.log('→ Seeding stores…');
  const storeIds = new Set<string>();

  for (const store of SEED_STORES) {
    const category = categoryByName.get(store.category) ?? null;
    await prisma.store.create({
      data: {
        id: store.id,
        slug: slugify(store.name),
        name: store.name,
        tagline: store.tagline,
        description: store.description,
        isVerified: store.isVerified,
        rating: store.rating,
        salesCount: store.salesCount,
        location: store.location,
        state: store.state,
        avatar: store.avatar,
        coverImage: store.coverImage,
        phone: store.phone,
        email: store.email,
        whatsapp: store.phone,
        joinedDate: store.joinedDate,
        badges: store.badges,
        categoryId: category?.id ?? null,
        shippingPolicy: 'Nationwide delivery via GIG Logistics, Speedaf Express and DHL Nigeria.',
        returnPolicy: '7-day inspection and return window on eligible items.',
        bankName: NIGERIAN_BANKS[1],
        bankAccountName: store.name,
        bankAccountNumber: `0123${Math.floor(100000 + Math.random() * 899999)}`,
        wallet: { create: {} },
      },
    });
    storeIds.add(store.id);
  }

  // Merchants that only exist inside listing payloads.
  for (const product of SEED_PRODUCTS) {
    const seller = product.seller;
    if (storeIds.has(seller.id)) continue;

    const category =
      categoryBySlug.get(product.categorySlug) ?? categoryByName.get(product.category) ?? null;

    await prisma.store.create({
      data: {
        id: seller.id,
        slug: slugify(seller.name),
        name: seller.name,
        tagline: `Verified ${product.category} merchant on Komback`,
        description: `${seller.name} is a verified Komback merchant trading from ${seller.location}.`,
        isVerified: seller.isVerified,
        rating: seller.rating,
        salesCount: seller.salesCount,
        location: seller.location,
        state: product.state,
        avatar: seller.avatar ?? null,
        coverImage: product.images[1] ?? product.images[0] ?? null,
        phone: seller.phone ?? null,
        email: `${slugify(seller.name)}@komback.com`,
        whatsapp: seller.phone ?? null,
        joinedDate: seller.joinedYear,
        badges: ['Verified Merchant', 'Escrow Insured'],
        categoryId: category?.id ?? null,
        bankName: NIGERIAN_BANKS[0],
        bankAccountName: seller.name,
        bankAccountNumber: `0234${Math.floor(100000 + Math.random() * 899999)}`,
        wallet: { create: {} },
      },
    });
    storeIds.add(seller.id);
  }

  // -------------------------------------------------------------------------
  // Merchant + admin accounts
  // -------------------------------------------------------------------------
  console.log('→ Seeding merchant accounts…');
  const sellerPassword = await bcrypt.hash(process.env.SEED_SELLER_PASSWORD ?? 'ChangeMe123!', 10);
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!', 10);

  const allStores = await prisma.store.findMany();
  for (const store of allStores) {
    const email = `${store.slug}@komback.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: store.name,
        phone: store.phone,
        passwordHash: sellerPassword,
        role: 'SELLER',
        avatar: store.avatar,
        location: store.location,
        state: store.state,
      },
    });
    await prisma.store.update({ where: { id: store.id }, data: { ownerId: user.id } });
  }

  await prisma.user.create({
    data: {
      email: (process.env.SEED_ADMIN_EMAIL ?? 'admin@komback.com').toLowerCase(),
      name: 'Komback Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
      state: 'Lagos',
      location: 'Victoria Island, Lagos',
    },
  });

  const demoBuyer = await prisma.user.create({
    data: {
      email: 'buyer@komback.com',
      name: 'Demo Buyer',
      phone: '+234 802 000 1111',
      passwordHash: sellerPassword,
      role: 'BUYER',
      state: 'Lagos',
      location: 'Lekki Phase 1, Lagos',
    },
  });

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------
  console.log(`→ Seeding ${SEED_PRODUCTS.length} listings…`);
  const productIdMap = new Map<string, string>();

  for (const [index, product] of SEED_PRODUCTS.entries()) {
    const category =
      categoryBySlug.get(product.categorySlug) ??
      categoryByName.get(product.category) ??
      null;

    if (!category) {
      console.warn(`   ! skipping ${product.title} — no category matched`);
      continue;
    }

    const created = await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug ?? `${slugify(product.title)}-${product.uniqueId ?? index}`,
        uniqueId: product.uniqueId ?? String(index).padStart(6, '0'),
        title: product.title,
        description: product.description,
        features: product.features ?? [],
        images: product.images,
        price: NGN(product.price),
        originalPrice: product.originalPrice ? NGN(product.originalPrice) : null,
        shippingFee: product.price > 1_000_000 ? 8500 : 3500,
        badge: product.badge ?? null,
        condition: product.condition,
        categoryId: category.id,
        storeId: product.seller.id,
        location: product.location,
        state: product.state,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        inStock: product.inStock,
        stockQuantity: 3 + (index % 6),
        isTrending: Boolean(product.isTrending),
        isDeal: Boolean(product.isDeal),
        isFeaturedAd: index < 2,
        featuredBadgeText: index < 2 ? 'Sponsored' : null,
        views: 120 + index * 37,
        status: 'ACTIVE',
        createdAt: parseRelativeDate(product.createdAt ?? '', 5 + index),
      },
    });

    productIdMap.set(product.id, created.id);
  }

  const seededProducts = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

  // -------------------------------------------------------------------------
  // Editorial
  // -------------------------------------------------------------------------
  console.log('→ Seeding blog posts…');
  for (const post of SEED_BLOG_POSTS) {
    await prisma.blogPost.create({
      data: {
        id: post.id,
        slug: slugify(post.title),
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        image: post.image,
        tags: post.tags,
        readTime: post.readTime,
        authorName: post.author.name,
        authorRole: post.author.role,
        authorAvatar: post.author.avatar,
        publishedAt: parseRelativeDate(post.date, 10),
      },
    });
  }

  // -------------------------------------------------------------------------
  // Reviews — the legacy `prod-N` ids are mapped onto real seeded listings.
  // -------------------------------------------------------------------------
  console.log('→ Seeding reviews…');
  for (const [index, review] of SEED_REVIEWS.entries()) {
    const product = seededProducts[index % Math.max(1, seededProducts.length)];
    if (!product) continue;

    await prisma.review.create({
      data: {
        id: review.id,
        productId: product.id,
        storeId: product.storeId,
        author: review.author,
        location: review.location,
        rating: review.rating,
        comment: review.comment,
        isVerifiedPurchase: review.isVerifiedPurchase,
        sellerReply: review.sellerReply ?? null,
        createdAt: parseRelativeDate(review.date, 3 + index),
      },
    });
  }

  // -------------------------------------------------------------------------
  // Orders, escrow, shipments and wallets
  // -------------------------------------------------------------------------
  console.log('→ Seeding orders, shipments and wallet history…');
  const byUniqueId = new Map(seededProducts.map((product) => [product.uniqueId, product]));

  const orderBlueprints = [
    {
      orderNumber: 'KB-2026-9821',
      uniqueId: 'kba892',
      buyerName: 'Emeka Uchenna',
      buyerPhone: '+234 802 345 6789',
      deliveryAddress: 'Plot 14, Ahmadu Bello Way, Area 11',
      buyerCityState: 'Garki, Abuja (FCT)',
      deliveryState: 'Abuja (FCT)',
      status: 'DISPATCHED' as const,
      courier: 'GIG Logistics',
      waybillNumber: 'GIGL-ABJ-89471',
      daysAgo: 1,
      pinVerified: false,
      released: false,
    },
    {
      orderNumber: 'KB-2026-9740',
      uniqueId: 'kbc731',
      buyerName: 'Alhaji Musa Dangote',
      buyerPhone: '+234 803 987 6543',
      deliveryAddress: 'Suite 4B, Commercial Bompai Road',
      buyerCityState: 'Nassarawa, Kano',
      deliveryState: 'Kano',
      status: 'DELIVERED' as const,
      courier: 'Speedaf Express',
      waybillNumber: 'SPD-KN-92144',
      daysAgo: 3,
      pinVerified: true,
      released: false,
    },
    {
      orderNumber: 'KB-2026-9611',
      uniqueId: 'kbf319',
      buyerName: 'Tunde Bakare',
      buyerPhone: '+234 701 555 1234',
      deliveryAddress: 'Admiralty Way, Block 7 Flat 2',
      buyerCityState: 'Lekki Phase 1, Lagos',
      deliveryState: 'Lagos',
      status: 'ESCROW_SECURED' as const,
      courier: null,
      waybillNumber: null,
      daysAgo: 2,
      pinVerified: false,
      released: false,
    },
    {
      orderNumber: 'KB-2026-9530',
      uniqueId: 'kbm904',
      buyerName: 'Dr. Ifeoma Okafor',
      buyerPhone: '+234 809 333 7788',
      deliveryAddress: 'GRA Phase 2, Tombia Street',
      buyerCityState: 'Port Harcourt, Rivers',
      deliveryState: 'Rivers',
      status: 'RELEASED' as const,
      courier: 'DHL Express Nigeria',
      waybillNumber: 'DHL-PH-78320',
      daysAgo: 5,
      pinVerified: true,
      released: true,
    },
    {
      orderNumber: 'KB-2026-9402',
      uniqueId: 'kbs420',
      buyerName: 'Nkechi Obi',
      buyerPhone: '+234 805 222 9090',
      deliveryAddress: '12 Ogui Road, Independence Layout',
      buyerCityState: 'Enugu, Enugu',
      deliveryState: 'Enugu',
      status: 'RELEASED' as const,
      courier: 'GIG Logistics',
      waybillNumber: 'GIGL-EN-51208',
      daysAgo: 6,
      pinVerified: true,
      released: true,
    },
    {
      orderNumber: 'KB-2026-9355',
      uniqueId: 'kbh780',
      buyerName: 'Fatima Yusuf',
      buyerPhone: '+234 806 777 3131',
      deliveryAddress: '24 Ademola Adetokunbo Crescent',
      buyerCityState: 'Wuse 2, Abuja (FCT)',
      deliveryState: 'Abuja (FCT)',
      status: 'RELEASED' as const,
      courier: 'Speedaf Express',
      waybillNumber: 'SPD-ABJ-40277',
      daysAgo: 7,
      pinVerified: true,
      released: true,
    },
  ];

  const storeTotals = new Map<string, { available: number; locked: number; settled: number }>();

  for (const blueprint of orderBlueprints) {
    const product = byUniqueId.get(blueprint.uniqueId);
    if (!product) continue;

    const shippingFee = product.price > 1_000_000 ? 8500 : 3500;
    const total = product.price + shippingFee;
    const placedAt = daysAgo(blueprint.daysAgo);

    const order = await prisma.order.create({
      data: {
        orderNumber: blueprint.orderNumber,
        storeId: product.storeId,
        buyerId: demoBuyer.id,
        status: blueprint.status,
        subtotal: product.price,
        shippingFee,
        total,
        paymentStatus: 'PAID',
        paymentProvider: 'escrow',
        paymentReference: `ESC-${blueprint.orderNumber}`,
        buyerName: blueprint.buyerName,
        buyerEmail: `${slugify(blueprint.buyerName)}@example.com`,
        buyerPhone: blueprint.buyerPhone,
        deliveryAddress: blueprint.deliveryAddress,
        buyerCityState: blueprint.buyerCityState,
        deliveryState: blueprint.deliveryState,
        courier: blueprint.courier,
        waybillNumber: blueprint.waybillNumber,
        handoverPin: String(1000 + (blueprint.orderNumber.charCodeAt(9) % 9000)),
        pinVerified: blueprint.pinVerified,
        escrowReleaseAt: blueprint.pinVerified ? new Date(placedAt.getTime() + 86_400_000) : null,
        releasedAt: blueprint.released ? new Date(placedAt.getTime() + 2 * 86_400_000) : null,
        placedAt,
        items: {
          create: [
            {
              productId: product.id,
              title: product.title,
              image: product.images[0] ?? '',
              unitPrice: product.price,
              quantity: 1,
              subtotal: product.price,
              condition: product.condition,
            },
          ],
        },
      },
    });

    await prisma.transaction.create({
      data: {
        reference: `ESC-${order.orderNumber}`,
        type: 'ESCROW_SECURED',
        status: 'COMPLETED',
        amount: total,
        description: `Escrow secured for order ${order.orderNumber}`,
        account: 'Komback Escrow Vault',
        orderId: order.id,
        storeId: product.storeId,
        createdAt: placedAt,
      },
    });

    if (blueprint.courier) {
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          courier: blueprint.courier,
          waybillNumber: blueprint.waybillNumber ?? `KB-${order.orderNumber}`,
          status: blueprint.released ? 'DELIVERED' : 'DISPATCHED',
          origin: product.location,
          destination: blueprint.buyerCityState,
          recipientName: blueprint.buyerName,
          recipientPhone: blueprint.buyerPhone,
          riderName: 'Assigned courier fleet',
          riderPhone: '+234 803 456 7890',
          estimatedDelivery: '2-4 business days',
          dispatchedAt: new Date(placedAt.getTime() + 3_600_000),
          deliveredAt: blueprint.pinVerified ? new Date(placedAt.getTime() + 86_400_000) : null,
        },
      });

      await prisma.shipmentEvent.createMany({
        data: [
          {
            shipmentId: shipment.id,
            title: 'Order Placed & Escrow Secured',
            subtitle: 'Payment locked safely in Komback Buyer Escrow',
            location: 'Komback Central Escrow Vault',
            status: 'completed',
            occurredAt: placedAt,
          },
          {
            shipmentId: shipment.id,
            title: 'Merchant Packed & Verified',
            subtitle: 'Physical inspection completed at vendor shop',
            location: product.location,
            status: 'completed',
            occurredAt: new Date(placedAt.getTime() + 7_200_000),
          },
          {
            shipmentId: shipment.id,
            title: `Handed to Courier (${blueprint.courier})`,
            subtitle: `Waybill ${blueprint.waybillNumber} generated and scanned`,
            location: product.location,
            status: 'completed',
            occurredAt: new Date(placedAt.getTime() + 10_800_000),
          },
        ],
      });
    }

    const totals = storeTotals.get(product.storeId) ?? { available: 0, locked: 0, settled: 0 };
    if (blueprint.released) {
      totals.settled += total;
      totals.available += total;

      await prisma.transaction.create({
        data: {
          reference: `REL-${order.orderNumber}`,
          type: 'ESCROW_RELEASE',
          status: 'COMPLETED',
          amount: total,
          description: `Buyer PIN verification (${order.orderNumber})`,
          account: 'Komback Escrow Vault',
          orderId: order.id,
          storeId: product.storeId,
          createdAt: new Date(placedAt.getTime() + 2 * 86_400_000),
        },
      });
    } else {
      totals.locked += total;
    }
    storeTotals.set(product.storeId, totals);
  }

  // Withdrawals already settled for the demo storefront.
  const demoStore = await prisma.store.findUnique({ where: { slug: 'jenny-phones-gadgets' } });
  if (demoStore) {
    const totals = storeTotals.get(demoStore.id) ?? { available: 0, locked: 0, settled: 0 };
    for (const [index, amount] of [3_500_000, 5_000_000].entries()) {
      await prisma.transaction.create({
        data: {
          reference: `PYT-2026-${8402 + index * 109}`,
          type: 'BANK_PAYOUT',
          status: 'COMPLETED',
          amount,
          description: `NIBSS Instant Transfer to ${NIGERIAN_BANKS[1]}`,
          account: `${NIGERIAN_BANKS[1]} (0123****89)`,
          storeId: demoStore.id,
          createdAt: daysAgo(4 + index * 3),
        },
      });
      await prisma.payoutRequest.create({
        data: {
          storeId: demoStore.id,
          amount,
          bankName: NIGERIAN_BANKS[1],
          accountName: demoStore.name,
          accountNumber: '0123456789',
          status: 'COMPLETED',
          requestedAt: daysAgo(4 + index * 3),
          processedAt: daysAgo(4 + index * 3),
        },
      });
      totals.settled += amount;
    }
    storeTotals.set(demoStore.id, totals);
  }

  for (const [storeId, totals] of storeTotals) {
    await prisma.wallet.upsert({
      where: { storeId },
      create: {
        storeId,
        availableBalance: totals.available,
        escrowLocked: totals.locked,
        totalSettled: totals.settled,
      },
      update: {
        availableBalance: totals.available,
        escrowLocked: totals.locked,
        totalSettled: totals.settled,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Buyer enquiries (seller inbox)
  // -------------------------------------------------------------------------
  console.log('→ Seeding buyer enquiries…');
  const enquiryStore = demoStore ?? allStores[0];
  if (enquiryStore) {
    const threads = [
      {
        buyerName: 'Babajide Adeleke',
        buyerPhone: '+234 803 111 2222',
        productUniqueId: 'kba892',
        messages: [
          {
            senderRole: 'BUYER' as const,
            text: 'Good day! Is this factory unlocked and what is the battery health percentage?',
            minutesAgo: 16,
          },
          {
            senderRole: 'SELLER' as const,
            text: 'Hello Babajide! Yes, it is 100% factory unlocked with zero carrier restrictions. Battery health is 100% brand new cycle.',
            minutesAgo: 14,
          },
          {
            senderRole: 'BUYER' as const,
            text: 'Can you do a discount if I pay through Komback Escrow right now?',
            minutesAgo: 10,
          },
        ],
      },
      {
        buyerName: 'Chioma Nwosu',
        buyerPhone: '+234 809 444 5555',
        productUniqueId: 'kbf319',
        messages: [
          {
            senderRole: 'BUYER' as const,
            text: 'Hello! I need this for a Saturday wedding in Enugu. How many days will delivery take via Speedaf?',
            minutesAgo: 90,
          },
          {
            senderRole: 'SELLER' as const,
            text: 'Hi Chioma! Speedaf delivery from our Lagos hub to Enugu takes 2 working days.',
            minutesAgo: 80,
          },
        ],
      },
      {
        buyerName: 'Ibrahim Danladi',
        buyerPhone: '+234 807 888 9999',
        productUniqueId: 'kbs501',
        messages: [
          {
            senderRole: 'BUYER' as const,
            text: 'Good afternoon, can your certified technicians do the installation in Wuse 2 Abuja?',
            minutesAgo: 1500,
          },
          {
            senderRole: 'SELLER' as const,
            text: 'Good afternoon Ibrahim! Yes, we have certified solar engineers stationed in Abuja and installation is included.',
            minutesAgo: 1480,
          },
        ],
      },
    ];

    for (const thread of threads) {
      const product = thread.productUniqueId ? byUniqueId.get(thread.productUniqueId) : null;

      const created = await prisma.messageThread.create({
        data: {
          storeId: product?.storeId ?? enquiryStore.id,
          buyerId: demoBuyer.id,
          ownerKey: demoBuyer.id,
          buyerName: thread.buyerName,
          buyerPhone: thread.buyerPhone,
          productId: product?.id ?? null,
          subject: product ? product.title : 'Store enquiry',
          unreadForSeller: thread.messages.some((message) => message.senderRole === 'BUYER') ? 1 : 0,
          lastMessageAt: new Date(Date.now() - thread.messages[thread.messages.length - 1].minutesAgo * 60_000),
        },
      });

      for (const message of thread.messages) {
        await prisma.message.create({
          data: {
            threadId: created.id,
            senderRole: message.senderRole,
            senderName: message.senderRole === 'SELLER' ? created.buyerName : thread.buyerName,
            text: message.text,
            createdAt: new Date(Date.now() - message.minutesAgo * 60_000),
          },
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const [categories, stores, products, posts, reviews, orders, threads] = await Promise.all([
    prisma.category.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.blogPost.count(),
    prisma.review.count(),
    prisma.order.count(),
    prisma.messageThread.count(),
  ]);

  console.log(`
✅ Seed complete
   categories : ${categories}
   stores     : ${stores}
   products   : ${products}
   blog posts : ${posts}
   reviews    : ${reviews}
   orders     : ${orders}
   enquiries  : ${threads}

   Merchant sign-in: <store-slug>@komback.com
   Admin sign-in   : ${process.env.SEED_ADMIN_EMAIL ?? 'admin@komback.com'}
   Buyer sign-in   : buyer@komback.com
   Password        : ${process.env.SEED_SELLER_PASSWORD ?? 'ChangeMe123!'}
`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
