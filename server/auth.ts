import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { GUEST_COOKIE, SESSION_COOKIE, SESSION_TTL_DAYS } from './constants';
import type { AuthUserDTO } from './dto';

export interface AuthedRequest extends Request {
  user?: AuthUserDTO;
  ownerKey?: string;
}

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const GUEST_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const isSecureRequest = (req: Request) =>
  req.secure || (req.headers['x-forwarded-proto'] as string | undefined) === 'https';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 899999);
  return `KB-${year}-${random}`;
}

export function generateHandoverPin(): string {
  return String(Math.floor(1000 + Math.random() * 8999));
}

export function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  location: string | null;
  state: string | null;
  store?: { id: string } | null;
}): AuthUserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role as AuthUserDTO['role'],
    avatar: user.avatar,
    location: user.location,
    state: user.state,
    storeId: user.store?.id ?? null,
  };
}

export async function createSession(
  req: Request,
  res: Response,
  userId: string
): Promise<string> {
  const token = generateToken();
  await prisma.session.create({
    data: {
      token,
      userId,
      userAgent: req.headers['user-agent']?.slice(0, 250) ?? null,
      ipAddress: req.ip ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
    maxAge: SESSION_TTL_MS,
  });

  return token;
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/**
 * Resolves the signed-in user (if any) and guarantees a guest identifier for
 * anonymous visitors so carts and wishlists can live in Postgres.
 *
 * Used as Express middleware, so it must always continue the chain via `next()`.
 */
export async function attachIdentity(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE];

    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: { include: { store: { select: { id: true } } } } },
      });

      if (session && session.expiresAt > new Date() && session.user.isActive && !session.user.isBanned) {
        req.user = toAuthUser(session.user);
      } else if (session) {
        // Expired, deactivated or banned — the session can no longer be used.
        await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      }
    }

    let guestId = req.cookies?.[GUEST_COOKIE];
    if (!guestId) {
      guestId = crypto.randomUUID();
      res.cookie(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecureRequest(req),
        path: '/',
        maxAge: GUEST_TTL_MS,
      });
    }

    req.ownerKey = req.user?.id ?? `guest:${guestId}`;
    next();
  } catch (error) {
    next(error);
  }
}

/** Moves guest cart/wishlist rows onto the signed-in user's key. */
export async function mergeGuestData(guestId: string, userId: string): Promise<void> {
  const guestKey = `guest:${guestId}`;
  if (guestKey === userId) return;

  const [guestCart, guestWishlist] = await Promise.all([
    prisma.cartItem.findMany({ where: { ownerKey: guestKey } }),
    prisma.wishlistItem.findMany({ where: { ownerKey: guestKey } }),
  ]);

  for (const item of guestCart) {
    const existing = await prisma.cartItem.findUnique({
      where: { ownerKey_productId: { ownerKey: userId, productId: item.productId } },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          ownerKey: userId,
          productId: item.productId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        },
      });
    }
  }

  for (const item of guestWishlist) {
    await prisma.wishlistItem
      .create({ data: { ownerKey: userId, productId: item.productId } })
      .catch(() => undefined);
  }

  await prisma.cartItem.deleteMany({ where: { ownerKey: guestKey } });
  await prisma.wishlistItem.deleteMany({ where: { ownerKey: guestKey } });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'You must be signed in to do that.' });
    return;
  }
  next();
}

/** Guards every `/api/admin/*` route except the auth endpoints. */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Administrator sign-in required.' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'This area is restricted to administrators.' });
    return;
  }
  next();
}

/** Invalidates every session for a user (used by ban, password change and force-logout). */
export async function revokeUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({ where: { userId } });
  return result.count;
}

export async function requireSeller(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'You must be signed in to do that.' });
    return;
  }

  const store = req.user.storeId
    ? await prisma.store.findUnique({ where: { id: req.user.storeId } })
    : null;

  if (!store) {
    res.status(403).json({ error: 'No store is linked to this account.' });
    return;
  }

  (req as AuthedRequest & { store?: typeof store }).store = store;
  next();
}
