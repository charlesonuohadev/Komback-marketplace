import type { Request } from 'express';
import { Prisma, type AuditCategory } from '@prisma/client';
import { prisma } from './db';
import type { AuthedRequest } from './auth';

/**
 * Central audit trail. Every meaningful action in the marketplace is recorded so
 * the Super Admin dashboard can show what happened, who did it and when.
 *
 * Auditing must never break a request, so failures are logged and swallowed.
 */

export interface AuditInput {
  /** Dotted action name, e.g. `user.login`, `admin.user.banned`. */
  action: string;
  category: AuditCategory;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  /**
   * Overrides the actor. Needed when the action happens before the session is
   * attached to the request (registration, sign-in) or by a background job.
   */
  actor?: { id?: string | null; email?: string | null; name?: string | null; role?: string | null };
}

function clientMeta(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
    req.ip ||
    null;

  return {
    ipAddress: ip,
    userAgent: req.headers['user-agent']?.slice(0, 250) ?? null,
  };
}

/** Records an action performed by the current request's user (or a guest). */
export async function recordAudit(req: Request | AuthedRequest, input: AuditInput): Promise<void> {
  const user = (req as AuthedRequest).user;
  const actor = input.actor ?? user;
  const meta = clientMeta(req);

  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        actorName: actor?.name ?? null,
        actorRole: actor?.role ?? 'GUEST',
        action: input.action,
        category: input.category,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        description: input.description ?? '',
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  } catch (error) {
    console.error('[komback] failed to write audit log', input.action, error);
  }
}

/** Records a system/background event that has no HTTP request behind it. */
export async function recordSystemAudit(
  input: AuditInput & { actorEmail?: string; actorName?: string; actorRole?: string }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorEmail: input.actorEmail ?? 'system@komback',
        actorName: input.actorName ?? 'System',
        actorRole: input.actorRole ?? 'SYSTEM',
        action: input.action,
        category: input.category,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        description: input.description ?? '',
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error('[komback] failed to write system audit log', input.action, error);
  }
}

export const AUDIT_CATEGORY_LABEL: Record<string, string> = {
  AUTH: 'Authentication',
  USER: 'Users',
  STORE: 'Stores',
  ORDER: 'Orders',
  PRODUCT: 'Listings',
  CONTENT: 'Content',
  FINANCE: 'Finance',
  MESSAGE: 'Messaging',
  SYSTEM: 'System',
};

/** Human-friendly one-liners for the activity feed. */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  'auth.register': 'New account created',
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in attempt',
  'auth.logout': 'Signed out',
  'auth.password_reset_requested': 'Password reset requested',
  'auth.password_reset_completed': 'Password reset completed',
  'cart.item_added': 'Added item to cart',
  'cart.item_removed': 'Removed item from cart',
  'cart.cleared': 'Cleared cart',
  'wishlist.toggled': 'Toggled wishlist item',
  'order.placed': 'Order placed (escrow secured)',
  'order.dispatched': 'Order dispatched',
  'order.escrow_released': 'Escrow released to seller',
  'order.cancelled': 'Order cancelled',
  'product.created': 'Listing published',
  'product.updated': 'Listing updated',
  'product.deleted': 'Listing archived',
  'product.imported': 'Listings imported from storefront',
  'review.created': 'Review published',
  'message.thread_started': 'Buyer enquiry started',
  'message.sent': 'Message sent',
  'store.updated': 'Storefront settings updated',
  'waybill.created': 'Waybill generated',
  'payout.requested': 'Payout requested',
  'payout.approved': 'Payout approved',
  'payout.rejected': 'Payout rejected',
  'admin.login': 'Admin signed in',
  'admin.login_failed': 'Failed admin sign-in',
  'admin.user.created': 'Admin created a user',
  'admin.user.updated': 'Admin updated a user',
  'admin.user.deleted': 'Admin deleted a user',
  'admin.user.banned': 'Admin banned a user',
  'admin.user.unbanned': 'Admin unbanned a user',
  'admin.store.suspended': 'Admin suspended a store',
  'admin.store.reinstated': 'Admin reinstated a store',
  'admin.store.verified': 'Store verification changed',
  'admin.product.updated': 'Admin moderated a listing',
  'admin.order.updated': 'Admin updated an order',
  'admin.category.created': 'Category created',
  'admin.category.updated': 'Category updated',
  'admin.category.deleted': 'Category deleted',
  'admin.blog.created': 'Article created',
  'admin.blog.updated': 'Article updated',
  'admin.blog.deleted': 'Article deleted',
  'admin.settings.updated': 'Platform settings updated',
};

export function auditLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action.replace(/[._]/g, ' ');
}
