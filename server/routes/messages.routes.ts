import { Router } from 'express';
import { prisma } from '../db';
import { attachIdentity, type AuthedRequest } from '../auth';
import { asString, asyncHandler, badRequest, notFound } from '../http';
import { serializeMessageThread } from '../serializers';
import { recordAudit } from '../audit';

export const messagesRouter = Router();

messagesRouter.use(attachIdentity);

/** Buyer starts (or reuses) a conversation with a store. */
messagesRouter.post(
  '/threads',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = req.ownerKey ?? 'guest:anonymous';
    const storeIdOrSlug = asString(req.body.storeId);
    const productIdOrSlug = asString(req.body.productId);
    const text = asString(req.body.text);
    const buyerName = asString(req.body.buyerName, req.user?.name ?? 'Guest Buyer');
    const buyerPhone = asString(req.body.buyerPhone, req.user?.phone ?? '') || null;

    if (!storeIdOrSlug) return badRequest(res, 'A store is required to start a conversation');
    if (!text) return badRequest(res, 'Please type a message');

    const store = await prisma.store.findFirst({
      where: { OR: [{ id: storeIdOrSlug }, { slug: storeIdOrSlug }, { name: storeIdOrSlug }] },
      select: { id: true },
    });
    if (!store) return notFound(res, 'Store not found');

    const product = productIdOrSlug
      ? await prisma.product.findFirst({
          where: { OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }] },
          select: { id: true },
        })
      : null;

    let thread = await prisma.messageThread.findFirst({
      where: { storeId: store.id, ownerKey, productId: product?.id ?? null },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          storeId: store.id,
          buyerId: req.user?.id ?? null,
          ownerKey,
          buyerName,
          buyerPhone,
          productId: product?.id ?? null,
          subject: product ? 'Product enquiry' : 'Store enquiry',
          unreadForSeller: 1,
        },
      });
    }

    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderRole: 'BUYER',
        senderId: req.user?.id ?? null,
        senderName: buyerName,
        text,
      },
    });

    const updated = await prisma.messageThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(), unreadForSeller: { increment: 1 } },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        store: { select: { avatar: true } },
      },
    });

    const productRow = updated.productId
      ? await prisma.product.findUnique({
          where: { id: updated.productId },
          select: { title: true, price: true, images: true },
        })
      : null;

    res.status(201).json({
      thread: serializeMessageThread({
        ...updated,
        product: productRow
          ? { title: productRow.title, price: productRow.price, images: productRow.images, avatar: productRow.images[0] }
          : null,
      }),
    });

    await recordAudit(req, {
      action: 'message.thread_started',
      category: 'MESSAGE',
      entityType: 'MessageThread',
      entityId: updated.id,
      description: `Enquiry started with a store${product ? ' about a listing' : ''}`,
      metadata: { storeId: store.id, productId: product?.id ?? null },
    });
  })
);

/** Conversations belonging to the current visitor/account. */
messagesRouter.get(
  '/threads',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = req.ownerKey ?? 'guest:anonymous';
    const threads = await prisma.messageThread.findMany({
      where: { ownerKey },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        store: { select: { avatar: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });

    res.json({
      threads: threads.map((thread) =>
        serializeMessageThread({ ...thread, product: null })
      ),
    });
  })
);

/** Buyer replies inside an existing conversation. */
messagesRouter.post(
  '/threads/:threadId/messages',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ownerKey = req.ownerKey ?? 'guest:anonymous';
    const threadId = asString(req.params.threadId);
    const text = asString(req.body.text);
    if (!text) return badRequest(res, 'Please type a message');

    const thread = await prisma.messageThread.findFirst({ where: { id: threadId, ownerKey } });
    if (!thread) return notFound(res, 'Conversation not found');

    const message = await prisma.message.create({
      data: {
        threadId,
        senderRole: 'BUYER',
        senderId: req.user?.id ?? null,
        senderName: req.user?.name ?? thread.buyerName,
        text,
      },
    });

    await prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: message.createdAt, unreadForSeller: { increment: 1 }, unreadForBuyer: 0 },
    });

    await recordAudit(req, {
      action: 'message.sent',
      category: 'MESSAGE',
      entityType: 'MessageThread',
      entityId: threadId,
      description: 'Buyer sent a message to a seller',
    });

    res.status(201).json({ message });
  })
);
