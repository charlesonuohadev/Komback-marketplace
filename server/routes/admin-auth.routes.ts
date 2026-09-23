import crypto from 'crypto';
import { Router } from 'express';
import { prisma } from '../db';
import {
  attachIdentity,
  createSession,
  destroySession,
  hashPassword,
  revokeUserSessions,
  verifyPassword,
  type AuthedRequest,
} from '../auth';
import { asString, asyncHandler, badRequest } from '../http';
import { recordAudit } from '../audit';
import { rateLimit, clearRateLimit } from '../rateLimit';
import { isMailConfigured, passwordResetEmail, sendMail } from '../mailer';

export const adminAuthRouter = Router();

const RESET_TTL_MINUTES = 30;
const isProduction = () => process.env.NODE_ENV === 'production';

export function adminResetUrl(token: string): string {
  const base = (process.env.APP_URL || '').replace(/\/$/, '');
  return `${base}/admin-cp/reset-password?token=${token}`;
}

/** Who am I? Used by the admin shell to decide between login and dashboard. */
adminAuthRouter.get(
  '/session',
  attachIdentity,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      user: req.user && req.user.role === 'ADMIN' ? req.user : null,
      mailConfigured: isMailConfigured(),
    });
  })
);

adminAuthRouter.post(
  '/login',
  attachIdentity,
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = asString(req.body.email).toLowerCase();
    const password = asString(req.body.password);
    const limiterKey = `admin-login:${req.ip ?? 'unknown'}:${email}`;

    const limit = rateLimit(limiterKey, 8, 10 * 60 * 1000);
    if (!limit.allowed) {
      await recordAudit(req, {
        action: 'admin.login_rate_limited',
        category: 'AUTH',
        description: `Too many failed admin sign-in attempts for ${email}`,
      });
      return res.status(429).json({
        error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
      });
    }

    if (!email || !password) return badRequest(res, 'Email and password are required');

    const user = await prisma.user.findUnique({ where: { email } });

    // Deliberately identical responses so the endpoint cannot enumerate accounts.
    const invalid = () => badRequest(res, 'Invalid email or password');

    if (!user || user.role !== 'ADMIN') {
      await recordAudit(req, {
        action: 'admin.login_failed',
        category: 'AUTH',
        description: `Failed admin sign-in for ${email}`,
        metadata: { email },
      });
      return invalid();
    }

    if (!user.isActive || user.isBanned) {
      await recordAudit(req, {
        action: 'admin.login_blocked',
        category: 'AUTH',
        entityType: 'User',
        entityId: user.id,
        description: `Blocked sign-in for ${email} (${user.isBanned ? 'banned' : 'deactivated'})`,
      });
      return res.status(403).json({ error: 'This administrator account is disabled.' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordAudit(req, {
        action: 'admin.login_failed',
        category: 'AUTH',
        description: `Failed admin sign-in for ${email}`,
        metadata: { email },
      });
      return invalid();
    }

    clearRateLimit(limiterKey);
    await createSession(req, res, user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastSeenAt: new Date(), loginCount: { increment: 1 } },
    });

    await recordAudit(
      { ...req, user: { id: user.id, email: user.email, name: user.name, role: 'ADMIN' } } as AuthedRequest,
      {
        action: 'admin.login',
        category: 'AUTH',
        entityType: 'User',
        entityId: user.id,
        description: `${user.email} signed in to the admin console`,
      }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        state: user.state,
        storeId: null,
      },
    });
  })
);

adminAuthRouter.post(
  '/logout',
  attachIdentity,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.user) {
      await recordAudit(req, {
        action: 'admin.logout',
        category: 'AUTH',
        entityType: 'User',
        entityId: req.user.id,
        description: `${req.user.email} signed out of the admin console`,
      });
    }
    await destroySession(req, res);
    res.json({ success: true });
  })
);

/**
 * Requests a reset link. The response never reveals whether the address exists.
 * The reset link is emailed when a provider is configured; otherwise it is written
 * to the server log (and, outside production, returned so a developer is not stuck).
 */
adminAuthRouter.post(
  '/forgot-password',
  attachIdentity,
  asyncHandler(async (req: AuthedRequest, res) => {
    const email = asString(req.body.email).toLowerCase();
    if (!email) return badRequest(res, 'Enter the email address of your admin account');

    const limit = rateLimit(`admin-forgot:${req.ip ?? 'unknown'}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many reset requests. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const genericResponse = {
      success: true,
      message:
        'If that email belongs to an administrator, a password reset link has been sent. ' +
        `It expires in ${RESET_TTL_MINUTES} minutes.`,
      mailConfigured: isMailConfigured(),
    };

    if (!user || user.role !== 'ADMIN') {
      await recordAudit(req, {
        action: 'auth.password_reset_requested',
        category: 'AUTH',
        description: `Password reset requested for unknown/non-admin address ${email}`,
      });
      return res.json(genericResponse);
    }

    // Invalidate any outstanding tokens for this account.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
        requestedIp: req.ip ?? null,
      },
    });

    const resetUrl = adminResetUrl(token);
    const mail = passwordResetEmail(user.name, resetUrl, RESET_TTL_MINUTES);
    const result = await sendMail({ to: user.email, ...mail });

    await recordAudit(req, {
      action: 'auth.password_reset_requested',
      category: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      description: `Password reset requested for ${user.email}`,
      metadata: { delivered: result.delivered, provider: result.provider },
    });

    // Without a mail provider the only way the operator can proceed is the server
    // log. Outside production we also return the link to unblock local setup.
    if (!result.delivered && !isProduction()) {
      return res.json({
        ...genericResponse,
        mailConfigured: result.delivered,
        devResetUrl: resetUrl,
        note: 'No email provider configured — use this link (also printed in the server log).',
      });
    }

    res.json(genericResponse);
  })
);

adminAuthRouter.post(
  '/reset-password',
  attachIdentity,
  asyncHandler(async (req: AuthedRequest, res) => {
    const token = asString(req.body.token);
    const password = asString(req.body.password);
    const confirm = asString(req.body.confirmPassword);

    if (!token) return badRequest(res, 'This reset link is invalid or incomplete');
    if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters');
    if (confirm && confirm !== password) return badRequest(res, 'Passwords do not match');

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return badRequest(res, 'This reset link has expired or has already been used');
    }

    if (record.user.role !== 'ADMIN') {
      return badRequest(res, 'This reset link is not valid for an administrator account');
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    // Any stolen session becomes useless the moment the password changes.
    const revoked = await revokeUserSessions(record.userId);

    await recordAudit(req, {
      action: 'auth.password_reset_completed',
      category: 'AUTH',
      entityType: 'User',
      entityId: record.userId,
      description: `Admin password reset completed for ${record.user.email}`,
      metadata: { sessionsRevoked: revoked },
    });

    res.json({ success: true, sessionsRevoked: revoked });
  })
);
