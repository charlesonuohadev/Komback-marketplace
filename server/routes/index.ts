import { Router } from 'express';
import { prisma } from '../db';
import { inspectDatabase, quickHealth } from '../diagnostics';
import { authRouter } from './auth.routes';
import { catalogRouter } from './catalog.routes';
import { cartRouter } from './cart.routes';
import { ordersRouter } from './orders.routes';
import { sellerRouter } from './seller.routes';
import { paymentsRouter } from './payments.routes';
import { messagesRouter } from './messages.routes';
import { adminAuthRouter } from './admin-auth.routes';
import { adminRouter, loadPublicFlags } from './admin.routes';
import { resolveSeo } from '../seo';

export const apiRouter = Router();

/** Liveness + database readiness. Used by monitoring and the admin health panel. */
apiRouter.get('/health', async (_req, res) => {
  const health = await quickHealth();
  res.json({
    status: 'ok',
    database: health.database,
    databaseLatencyMs: health.latencyMs,
    timestamp: new Date().toISOString(),
  });
});

/** Full database report — 200 when connected and fully migrated, otherwise 503. */
apiRouter.get('/health/database', async (_req, res) => {
  const report = await inspectDatabase();
  const healthy = report.connected && report.missingTables.length === 0;
  res.status(healthy ? 200 : 503).json(report);
});

// Safe public config endpoint (exposes only public keys, never secrets)
apiRouter.get('/config', async (_req, res) => {
  const flags = await loadPublicFlags();
  res.json({
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    hasPaystackSecret: Boolean(process.env.PAYSTACK_SECRET_KEY),
    hasFlutterwaveSecret: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
    maintenanceMode: flags.maintenanceMode,
    maintenanceMessage: flags.maintenanceMessage,
  });
});

/** Public platform statistics — trust signals for the storefront and SEO. */
apiRouter.get('/platform-stats', async (_req, res) => {
  try {
    const [listings, stores, states, categories] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE', isHidden: false } }),
      prisma.store.count({ where: { isActive: true, isSuspended: false } }),
      prisma.store.groupBy({ by: ['state'] }),
      prisma.category.count({ where: { isActive: true } }),
    ]);
    res.json({ listings, stores, statesCovered: states.length, categories });
  } catch {
    res.json({ listings: 0, stores: 0, statesCovered: 0, categories: 0 });
  }
});

/**
 * Route metadata for client-side navigation. The server already injects full
 * SEO markup into the HTML shell on first load; this endpoint lets the SPA keep
 * title/description/canonical/JSON-LD in sync as the visitor moves around.
 */
apiRouter.get('/seo', async (req, res) => {
  const requested = typeof req.query.path === 'string' ? req.query.path : '/';
  const safePath = requested.startsWith('/') ? requested.replace(/\/\/+/g, '/') : `/${requested}`;
  const seo = await resolveSeo(safePath.split('?')[0], '');
  res.set('Cache-Control', 'no-store').json(seo);
});

// Super Admin console: its own auth flow, then a fully guarded surface.
apiRouter.use('/admin/auth', adminAuthRouter);
apiRouter.use('/admin', adminRouter);

apiRouter.use('/auth', authRouter);
apiRouter.use('/seller', sellerRouter);
apiRouter.use('/', catalogRouter);
apiRouter.use('/', cartRouter);
apiRouter.use('/', ordersRouter);
apiRouter.use('/', paymentsRouter);
apiRouter.use('/messages', messagesRouter);
