import { Router } from 'express';
import { prisma } from '../db';
import { attachIdentity, type AuthedRequest } from '../auth';
import { asInt, asString, asyncHandler, badRequest, notFound } from '../http';
import { productInclude, serializeProduct } from '../serializers';
import { recordAudit } from '../audit';

export const cartRouter = Router();

cartRouter.use(attachIdentity);

async function ownerKeyOf(req: AuthedRequest): Promise<string> {
  return req.ownerKey ?? 'guest:anonymous';
}

cartRouter.get(
  '/cart',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    const rows = await prisma.cartItem.findMany({
      where: { ownerKey, product: { status: 'ACTIVE' } },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: 'asc' },
    });

    const items = rows.map((row) => ({
      product: serializeProduct(row.product),
      quantity: row.quantity,
      selectedColor: row.selectedColor ?? undefined,
      selectedSize: row.selectedSize ?? undefined,
    }));

    res.json({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    });
  })
);

cartRouter.post(
  '/cart',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    const productId = asString(req.body.productId);
    const quantity = Math.max(1, asInt(req.body.quantity, 1));
    if (!productId) return badRequest(res, 'productId is required');

    const product = await prisma.product.findFirst({
      where: { OR: [{ id: productId }, { slug: productId }] },
      select: { id: true, inStock: true },
    });
    if (!product) return notFound(res, 'Listing not found');
    if (!product.inStock) return badRequest(res, 'This item is currently out of stock');

    await prisma.cartItem.upsert({
      where: { ownerKey_productId: { ownerKey, productId: product.id } },
      create: {
        ownerKey,
        productId: product.id,
        quantity,
        selectedColor: asString(req.body.selectedColor) || null,
        selectedSize: asString(req.body.selectedSize) || null,
      },
      update: { quantity: { increment: quantity } },
    });

    res.status(201).json({ success: true });
    await recordAudit(req, {
      action: 'cart.item_added',
      category: 'ORDER',
      entityType: 'Product',
      entityId: product.id,
      description: `Added ${quantity} × listing to cart`,
      metadata: { quantity },
    });
  })
);

cartRouter.patch(
  '/cart/:productId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    const productId = asString(req.params.productId);
    const quantity = asInt(req.body.quantity, 1);

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { ownerKey, productId } });
      return res.json({ success: true, removed: true });
    }

    await prisma.cartItem.updateMany({ where: { ownerKey, productId }, data: { quantity } });
    res.json({ success: true });
  })
);

cartRouter.delete(
  '/cart/:productId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    await prisma.cartItem.deleteMany({
      where: { ownerKey, productId: asString(req.params.productId) },
    });
    await recordAudit(req, {
      action: 'cart.item_removed',
      category: 'ORDER',
      entityType: 'Product',
      entityId: asString(req.params.productId),
      description: 'Removed an item from the cart',
    });
    res.json({ success: true });
  })
);

cartRouter.delete(
  '/cart',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    await prisma.cartItem.deleteMany({ where: { ownerKey } });
    await recordAudit(req, {
      action: 'cart.cleared',
      category: 'ORDER',
      description: 'Cleared the shopping cart',
    });
    res.json({ success: true });
  })
);

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

cartRouter.get(
  '/wishlist',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    const rows = await prisma.wishlistItem.findMany({
      where: { ownerKey, product: { status: 'ACTIVE' } },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      ids: rows.map((row) => row.productId),
      products: rows.map((row) => serializeProduct(row.product)),
    });
  })
);

cartRouter.post(
  '/wishlist/toggle',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = await ownerKeyOf(req);
    const productId = asString(req.body.productId);
    if (!productId) return badRequest(res, 'productId is required');

    const product = await prisma.product.findFirst({
      where: { OR: [{ id: productId }, { slug: productId }] },
      select: { id: true },
    });
    if (!product) return notFound(res, 'Listing not found');

    const existing = await prisma.wishlistItem.findUnique({
      where: { ownerKey_productId: { ownerKey, productId: product.id } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.wishlistItem.create({ data: { ownerKey, productId: product.id } });
    }

    const ids = await prisma.wishlistItem.findMany({ where: { ownerKey }, select: { productId: true } });
    await recordAudit(req, {
      action: 'wishlist.toggled',
      category: 'USER',
      entityType: 'Product',
      entityId: product.id,
      description: existing ? 'Removed a listing from the wishlist' : 'Saved a listing to the wishlist',
    });
    res.json({ wishlisted: !existing, ids: ids.map((row) => row.productId) });
  })
);
