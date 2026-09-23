import { Router } from 'express';
import { prisma } from '../db';
import {
  attachIdentity,
  createSession,
  destroySession,
  hashPassword,
  mergeGuestData,
  requireAuth,
  toAuthUser,
  verifyPassword,
  type AuthedRequest,
} from '../auth';
import { asString, asyncHandler, badRequest, isEmail, slugify } from '../http';
import { GUEST_COOKIE } from '../constants';
import { recordAudit } from '../audit';
import { storeInclude, serializeStore } from '../serializers';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req: AuthedRequest, res) => {
    const name = asString(req.body.name);
    const email = asString(req.body.email).toLowerCase();
    const password = asString(req.body.password);
    const phone = asString(req.body.phone) || null;
    const wantsStore = Boolean(asString(req.body.storeName));

    if (name.length < 2) return badRequest(res, 'Please enter your full name');
    if (!isEmail(email)) return badRequest(res, 'Please enter a valid email address');
    if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest(res, 'An account with that email already exists');

    const categorySlug = asString(req.body.storeCategory, 'phones-tablets');
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: wantsStore ? 'SELLER' : 'BUYER',
        location: asString(req.body.location) || null,
        state: asString(req.body.state) || null,
        ...(wantsStore
          ? {
              store: {
                create: {
                  name: asString(req.body.storeName),
                  slug: slugify(asString(req.body.storeName)),
                  tagline: asString(req.body.storeTagline, 'Verified Komback merchant'),
                  description: asString(
                    req.body.storeDescription,
                    'Official verified merchant on the Komback marketplace.'
                  ),
                  location: asString(req.body.location, 'Nigeria'),
                  state: asString(req.body.state, 'Lagos'),
                  phone,
                  email,
                  joinedDate: String(new Date().getFullYear()),
                  badges: ['Verified Merchant', 'Escrow Insured'],
                  categoryId: category?.id ?? null,
                  whatsapp: phone,
                  wallet: { create: {} },
                },
              },
            }
          : {}),
      },
      include: { store: { select: { id: true } } },
    });

    const guestId = req.cookies?.[GUEST_COOKIE];
    if (guestId) await mergeGuestData(guestId, user.id);

    await createSession(req, res, user.id);

    await recordAudit(req, {
      action: 'auth.register',
      category: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      description: `${wantsStore ? 'Merchant' : 'Buyer'} account created for ${email}`,
      metadata: { role: user.role, storeName: wantsStore ? asString(req.body.storeName) : null },
      actor: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    res.status(201).json({ user: toAuthUser({ ...user, store: user.store }) });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = asString(req.body.email).toLowerCase();
    const password = asString(req.body.password);
    if (!email || !password) return badRequest(res, 'Email and password are required');

    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: { select: { id: true } } },
    });

    // The account is verified before anything else is revealed, so the endpoint
    // cannot be used to enumerate registered addresses.
    if (!user || !user.isActive) return badRequest(res, 'Invalid email or password');

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordAudit(req, {
        action: 'auth.login_failed',
        category: 'AUTH',
        description: `Failed sign-in for ${email}`,
        actor: { email: email, role: 'GUEST' },
      });
      return badRequest(res, 'Invalid email or password');
    }

    if (user.isBanned) {
      await recordAudit(req, {
        action: 'auth.login_blocked',
        category: 'AUTH',
        entityType: 'User',
        entityId: user.id,
        description: `Blocked sign-in for banned account ${email}`,
        actor: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
      return res.status(403).json({
        error:
          'This account has been suspended. ' +
          (user.banReason ? `Reason: ${user.banReason}. ` : '') +
          'Contact support@komback.com if you believe this is a mistake.',
      });
    }

    const guestId = req.cookies?.[GUEST_COOKIE];
    if (guestId) await mergeGuestData(guestId, user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastSeenAt: new Date(), loginCount: { increment: 1 } },
    });
    await createSession(req, res, user.id);

    await recordAudit(req, {
      action: 'auth.login',
      category: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      description: `${email} signed in`,
      actor: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    res.json({ user: toAuthUser(user) });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.user) {
      await recordAudit(req, {
        action: 'auth.logout',
        category: 'AUTH',
        entityType: 'User',
        entityId: req.user.id,
        description: `${req.user.email} signed out`,
      });
    }
    await destroySession(req, res);
    res.json({ success: true });
  })
);

authRouter.get(
  '/me',
  attachIdentity,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user) return res.json({ user: null, store: null });

    const store = req.user.storeId
      ? await prisma.store.findUnique({ where: { id: req.user.storeId }, include: storeInclude })
      : null;

    res.json({ user: req.user, store: store ? serializeStore(store) : null });
  })
);

authRouter.patch(
  '/me',
  attachIdentity,
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: asString(req.body.name) || undefined,
        phone: asString(req.body.phone) || undefined,
        avatar: asString(req.body.avatar) || undefined,
        location: asString(req.body.location) || undefined,
        state: asString(req.body.state) || undefined,
      },
      include: { store: { select: { id: true } } },
    });
    res.json({ user: toAuthUser(user) });
  })
);
