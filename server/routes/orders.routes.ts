import { Router } from 'express';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '../db';
import {
  attachIdentity,
  generateHandoverPin,
  generateOrderNumber,
  requireSeller,
  type AuthedRequest,
} from '../auth';
import { asString, asyncHandler, badRequest, forbidden, notFound } from '../http';
import { recordAudit } from '../audit';
import { COURIERS, SHIPPING_FEES } from '../constants';
import {
  orderInclude,
  orderStatusFromLabel,
  orderStatusToLabel,
  serializeOrderTracking,
  serializeSellerOrder,
  storeInclude,
  serializeStore,
  productInclude,
  serializeProduct,
} from '../serializers';

export const ordersRouter = Router();

ordersRouter.use(attachIdentity);

export function shippingFeeFor(state: string): number {
  return SHIPPING_FEES[state] ?? SHIPPING_FEES.default;
}

/** Checkout: turns the signed-in/guest cart into one order per store. */
ordersRouter.post(
  '/orders',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = req.ownerKey ?? 'guest:anonymous';
    const buyerName = asString(req.body.buyerName, req.user?.name ?? '');
    const buyerPhone = asString(req.body.buyerPhone, req.user?.phone ?? '');
    const buyerEmail = asString(req.body.buyerEmail, req.user?.email ?? '') || null;
    const deliveryAddress = asString(req.body.deliveryAddress);
    const deliveryState = asString(req.body.deliveryState, 'Lagos');
    const buyerCityState = asString(req.body.buyerCityState, `${deliveryState}, Nigeria`);
    const paymentProvider = asString(req.body.paymentProvider, 'escrow');
    const paymentReference = asString(req.body.paymentReference) || null;

    if (buyerName.length < 2) return badRequest(res, 'A buyer name is required');
    if (buyerPhone.length < 7) return badRequest(res, 'A reachable phone number is required');
    if (deliveryAddress.length < 5) return badRequest(res, 'A delivery address is required');

    const cartRows = await prisma.cartItem.findMany({
      where: { ownerKey, product: { status: 'ACTIVE' } },
      include: { product: { include: productInclude } },
    });

    if (cartRows.length === 0) return badRequest(res, 'Your cart is empty');

    const byStore = new Map<string, typeof cartRows>();
    for (const row of cartRows) {
      const list = byStore.get(row.product.storeId) ?? [];
      list.push(row);
      byStore.set(row.product.storeId, list);
    }

    const created: { orderNumber: string; total: number; storeName: string; itemCount: number }[] = [];

    for (const [storeId, rows] of byStore) {
      const subtotal = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);
      const shippingFee = shippingFeeFor(deliveryState);
      const total = subtotal + shippingFee;

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          storeId,
          buyerId: req.user?.id ?? null,
          status: 'ESCROW_SECURED',
          subtotal,
          shippingFee,
          total,
          paymentStatus: 'PAID',
          paymentProvider,
          paymentReference,
          buyerName,
          buyerEmail,
          buyerPhone,
          deliveryAddress,
          buyerCityState,
          deliveryState,
          handoverPin: generateHandoverPin(),
          items: {
            create: rows.map((row) => ({
              productId: row.productId,
              title: row.product.title,
              image: row.product.images[0] ?? '',
              unitPrice: row.product.price,
              quantity: row.quantity,
              subtotal: row.product.price * row.quantity,
              condition: row.product.condition,
            })),
          },
        },
      });

      await prisma.wallet.upsert({
        where: { storeId },
        create: { storeId, escrowLocked: total },
        update: { escrowLocked: { increment: total } },
      });

      await prisma.transaction.create({
        data: {
          reference: `ESC-${order.orderNumber}`,
          type: 'ESCROW_SECURED',
          status: 'COMPLETED',
          amount: total,
          description: `Escrow secured for order ${order.orderNumber}`,
          account: 'Komback Escrow Vault',
          provider: paymentProvider,
          providerRef: paymentReference,
          orderId: order.id,
          storeId,
        },
      });

      const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
      created.push({
        orderNumber: order.orderNumber,
        total,
        storeName: store?.name ?? 'Store',
        itemCount: rows.reduce((sum, row) => sum + row.quantity, 0),
      });
    }

    await prisma.cartItem.deleteMany({ where: { ownerKey } });

    await recordAudit(req, {
      action: 'order.placed',
      category: 'ORDER',
      entityId: created[0]?.orderNumber,
      description: `${created.length} order(s) placed — ₦${created
        .reduce((sum, order) => sum + order.total, 0)
        .toLocaleString('en-NG')} secured in escrow`,
      metadata: { orders: created, paymentProvider },
    });

    res.status(201).json({ orders: created });
  })
);

/** Orders belonging to the signed-in buyer. */
ordersRouter.get(
  '/orders',
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user) return res.json({ orders: [] });

    const scope = asString(req.query.scope, 'buyer');
    const where =
      scope === 'seller' && req.user.storeId
        ? { storeId: req.user.storeId }
        : { buyerId: req.user.id };

    const rows = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
      take: 100,
    });

    if (scope === 'seller') {
      return res.json({ orders: rows.map(serializeSellerOrder) });
    }

    res.json({
      orders: rows.map((row) => ({
        orderNumber: row.orderNumber,
        status: orderStatusToLabel(row.status),
        total: row.total,
        placedAt: row.placedAt.toISOString(),
        storeName: row.store.name,
        items: row.items.map((item) => ({
          title: item.title,
          image: item.image,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      })),
    });
  })
);

/** Public waybill tracking. Handover PIN is masked unless you own the order. */
ordersRouter.get(
  '/track/:orderNumber',
  asyncHandler(async (req: AuthedRequest, res) => {
    const orderNumber = asString(req.params.orderNumber).replace(/^#/, '');
    const row = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
    if (!row) return notFound(res, `No order found for ${orderNumber}`);

    const isOwner =
      (req.user && row.buyerId === req.user.id) ||
      (req.user?.storeId && row.storeId === req.user.storeId);

    res.json({ order: serializeOrderTracking(row, { includeHandoverPin: Boolean(isOwner) }) });
  })
);

/** Seller: move an order through the fulfilment pipeline. */
ordersRouter.patch(
  '/orders/:orderNumber/status',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as AuthedRequest & { store: { id: string; name: string; location: string; phone: string | null } }).store;
    const orderNumber = asString(req.params.orderNumber).replace(/^#/, '');
    const nextStatus = orderStatusFromLabel(asString(req.body.status)) as OrderStatus;

    const order = await prisma.order.findFirst({
      where: { orderNumber, storeId: store.id },
      include: orderInclude,
    });
    if (!order) return notFound(res, 'Order not found for your store');

    const courier = asString(req.body.courier, order.courier ?? '') || null;
    const waybillNumber = asString(req.body.waybillNumber, order.waybillNumber ?? '') || null;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        courier,
        waybillNumber,
        courierNote: asString(req.body.note) || null,
      },
      include: orderInclude,
    });

    if (nextStatus === 'DISPATCHED' || nextStatus === 'OUT_FOR_DELIVERY') {
      const shipment = await prisma.shipment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          courier: courier ?? COURIERS[0],
          waybillNumber: waybillNumber ?? `KB-${order.orderNumber}-01`,
          status: nextStatus === 'DISPATCHED' ? 'DISPATCHED' : 'OUT_FOR_DELIVERY',
          origin: store.location,
          destination: order.buyerCityState,
          recipientName: order.buyerName,
          recipientPhone: order.buyerPhone,
          dispatchedAt: new Date(),
          estimatedDelivery: asString(req.body.estimatedDelivery, '2-4 business days'),
        },
        update: {
          courier: courier ?? undefined,
          status: nextStatus === 'DISPATCHED' ? 'DISPATCHED' : 'OUT_FOR_DELIVERY',
        },
      });

      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          title: `Handed to ${shipment.courier}`,
          subtitle: `Waybill ${shipment.waybillNumber} scanned at merchant hub`,
          location: store.location,
          status: 'completed',
        },
      });
    }

    await recordAudit(req, {
      action: 'order.dispatched',
      category: 'ORDER',
      entityType: 'Order',
      entityId: order.id,
      description: `Order ${order.orderNumber} → ${orderStatusToLabel(nextStatus)}${courier ? ` via ${courier}` : ''}`,
      metadata: { previousStatus: order.status, status: nextStatus, courier, waybillNumber },
    });

    res.json({ order: serializeSellerOrder(updated) });
  })
);

/** Seller: verify the buyer's 4-digit inspection PIN to release escrow. */ordersRouter.post(
  '/orders/:orderNumber/verify-pin',
  requireSeller,
  asyncHandler(async (req: AuthedRequest, res) => {
    const store = (req as AuthedRequest & { store: { id: string } }).store;
    const orderNumber = asString(req.params.orderNumber).replace(/^#/, '');
    const pin = asString(req.body.pin);

    const order = await prisma.order.findFirst({ where: { orderNumber, storeId: store.id } });
    if (!order) return notFound(res, 'Order not found for your store');
    if (!order.handoverPin) return badRequest(res, 'This order has no handover PIN');
    if (order.handoverPin !== pin) return badRequest(res, 'Incorrect handover PIN');

    const releasedAt = new Date();

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { pinVerified: true, status: 'RELEASED', releasedAt, escrowReleaseAt: releasedAt },
      include: orderInclude,
    });

    const wallet = await prisma.wallet.findUnique({ where: { storeId: store.id } });

    if (!order.pinVerified) {
      await prisma.wallet.upsert({
        where: { storeId: store.id },
        create: {
          storeId: store.id,
          availableBalance: order.total,
          escrowLocked: 0,
          totalSettled: order.total,
        },
        update: {
          availableBalance: { increment: order.total },
          escrowLocked: { decrement: Math.min(order.total, wallet?.escrowLocked ?? 0) },
          totalSettled: { increment: order.total },
        },
      });

      await prisma.transaction.create({
        data: {
          reference: `REL-${order.orderNumber}`,
          type: 'ESCROW_RELEASE',
          status: 'COMPLETED',
          amount: order.total,
          description: `Buyer PIN verification (${updated.orderNumber})`,
          account: 'Komback Escrow Vault',
          orderId: order.id,
          storeId: store.id,
        },
      });

      await prisma.store.update({
        where: { id: store.id },
        data: { salesCount: { increment: 1 } },
      });
    }

    if (updated.shipment) {
      await prisma.shipment.update({
        where: { id: updated.shipment.id },
        data: { status: 'DELIVERED', deliveredAt: releasedAt },
      });
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: updated.shipment.id,
          title: 'Delivered — Escrow Released',
          subtitle: `Buyer PIN verified. ₦${order.total.toLocaleString('en-NG')} released to merchant wallet`,
          location: updated.buyerCityState,
          status: 'completed',
          occurredAt: releasedAt,
        },
      });
    }

    await recordAudit(req, {
      action: 'order.escrow_released',
      category: 'FINANCE',
      entityType: 'Order',
      entityId: order.id,
      description: `Escrow of ₦${order.total.toLocaleString('en-NG')} released for ${order.orderNumber}`,
      metadata: { amount: order.total, alreadyReleased: order.pinVerified },
    });

    res.json({ order: serializeSellerOrder(updated) });
  })
);

/** Storefront lookup helper used by the seller dashboard. */
ordersRouter.get(
  '/orders/:orderNumber',
  asyncHandler(async (req: AuthedRequest, res) => {
    const orderNumber = asString(req.params.orderNumber).replace(/^#/, '');
    const row = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
    if (!row) return notFound(res, 'Order not found');

    const isOwner =
      (req.user && row.buyerId === req.user.id) ||
      (req.user?.storeId && row.storeId === req.user.storeId);
    if (!isOwner) return forbidden(res, 'You do not have access to this order');

    res.json({ order: serializeSellerOrder(row) });
  })
);

/** Related listings shown on the tracking page. */
ordersRouter.get(
  '/orders/:orderNumber/related',
  asyncHandler(async (req, res) => {
    const orderNumber = asString(req.params.orderNumber).replace(/^#/, '');
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { storeId: true },
    });
    if (!order) return notFound(res, 'Order not found');

    const products = await prisma.product.findMany({
      where: { storeId: order.storeId, status: 'ACTIVE' },
      include: productInclude,
      take: 4,
    });

    const store = await prisma.store.findUnique({ where: { id: order.storeId }, include: storeInclude });

    res.json({
      products: products.map(serializeProduct),
      store: store ? serializeStore(store) : null,
    });
  })
);
