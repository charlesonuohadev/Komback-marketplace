/** Human-readable labels for audit actions, mirroring `server/audit.ts`. */

export const AUDIT_CATEGORIES = [
  'AUTH',
  'USER',
  'STORE',
  'ORDER',
  'PRODUCT',
  'CONTENT',
  'FINANCE',
  'MESSAGE',
  'SYSTEM',
] as const;

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

const AUDIT_ACTION_LABEL: Record<string, string> = {
  'auth.register': 'New account created',
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in attempt',
  'auth.login_blocked': 'Sign-in blocked (suspended)',
  'auth.logout': 'Signed out',
  'auth.password_reset_requested': 'Password reset requested',
  'auth.password_reset_completed': 'Password reset completed',
  'cart.item_added': 'Added item to cart',
  'cart.item_removed': 'Removed item from cart',
  'cart.cleared': 'Cleared cart',
  'wishlist.toggled': 'Wishlist updated',
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
  'admin.login_blocked': 'Blocked admin sign-in',
  'admin.login_rate_limited': 'Admin sign-in rate limited',
  'admin.logout': 'Admin signed out',
  'admin.user.created': 'Admin created a user',
  'admin.user.updated': 'Admin updated a user',
  'admin.user.deleted': 'Admin deleted a user',
  'admin.user.banned': 'Admin banned a user',
  'admin.user.unbanned': 'Admin unbanned a user',
  'admin.user.sessions_revoked': 'Admin force-signed out a user',
  'admin.store.updated': 'Admin updated a store',
  'admin.store.verified': 'Store verification changed',
  'admin.store.suspended': 'Admin suspended a store',
  'admin.store.reinstated': 'Admin reinstated a store',
  'admin.order.updated': 'Admin updated an order',
  'admin.product.updated': 'Admin moderated a listing',
  'admin.product.deleted': 'Admin deleted a listing',
  'admin.review.hidden': 'Admin hid a review',
  'admin.review.restored': 'Admin restored a review',
  'admin.review.deleted': 'Admin deleted a review',
  'admin.category.created': 'Category created',
  'admin.category.updated': 'Category updated',
  'admin.category.deleted': 'Category deleted',
  'admin.blog.created': 'Article created',
  'admin.blog.updated': 'Article updated',
  'admin.blog.deleted': 'Article deleted',
  'admin.wallet.adjusted': 'Wallet manually adjusted',
  'admin.settings.updated': 'Platform settings updated',
};

export function auditLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action.replace(/[._]/g, ' ');
}

export function auditTone(category: string): string {
  switch (category) {
    case 'AUTH':
      return 'violet';
    case 'USER':
      return 'blue';
    case 'STORE':
      return 'emerald';
    case 'ORDER':
      return 'amber';
    case 'PRODUCT':
      return 'slate';
    case 'CONTENT':
      return 'violet';
    case 'FINANCE':
      return 'emerald';
    case 'MESSAGE':
      return 'blue';
    default:
      return 'slate';
  }
}
