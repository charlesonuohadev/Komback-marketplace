import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { apiRouter } from './routes/index';
import { loadHtmlTemplate, llmsTxt, renderHtml, resolveSeo, robotsTxt, sitemapXml } from './seo';
import { attachIdentity } from './auth';

/** Production is detected structurally — cPanel/Passenger does not set NODE_ENV. */
const isProduction = typeof __dirname === 'string' && __dirname.includes(path.sep);

/** Absolute path to the compiled client (dist) and the repo root. */
const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');

/** Paths that must never be served as the SPA shell. */
const NON_HTML_PREFIXES = ['/api', '/assets', '/images', '/sitemap.xml', '/robots.txt', '/llms.txt'];

function isHtmlRequest(req: Request): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  if (NON_HTML_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return false;
  if (/\.[a-z0-9]{2,6}$/i.test(req.path)) return false; // static file with an extension
  return req.accepts(['html', 'json']) === 'html';
}

/**
 * Turns the HTML shell into a fully server-rendered document: route-specific
 * title/description/canonical/OG tags plus schema.org JSON-LD, all resolved from
 * PostgreSQL. Crawlers and AI answer engines then see complete markup without
 * executing JavaScript.
 */
async function seoHtml(req: Request): Promise<string | null> {
  const template = isProduction
    ? loadHtmlTemplate(DIST_DIR)
    : loadHtmlTemplate(ROOT);
  if (!template) return null;

  const seo = await resolveSeo(req.path, '');
  return renderHtml(template, seo);
}

export async function startServer() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ---------------------------------------------------------------------
  // Machine-readable SEO endpoints
  // ---------------------------------------------------------------------

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(robotsTxt());
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const xml = await sitemapXml();
      res.type('application/xml').send(xml);
    } catch {
      res.status(503).type('text/plain').send('Sitemap temporarily unavailable');
    }
  });

  app.get('/llms.txt', async (_req, res) => {
    let stats = { listings: 0, stores: 0, categories: 0 };
    try {
      const { prisma } = await import('./db');
      const [listings, stores, categories] = await Promise.all([
        prisma.product.count({ where: { status: 'ACTIVE', isHidden: false } }),
        prisma.store.count({ where: { isActive: true, isSuspended: false } }),
        prisma.category.count({ where: { isActive: true } }),
      ]);
      stats = { listings, stores, categories };
    } catch {
      /* fall back to zeros — the guidance itself is still valuable */
    }
    res.type('text/plain').send(llmsTxt(stats));
  });

  // ---------------------------------------------------------------------
  // REST API
  // ---------------------------------------------------------------------

  // Identity (sessions, guest cookies, ban checks) is only needed for API calls —
  // static assets, sitemap and crawler traffic must not create session rows.
  app.use('/api', attachIdentity, apiRouter);

  // ---------------------------------------------------------------------
  // Client
  // ---------------------------------------------------------------------

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      try {
        if (!isHtmlRequest(req)) return next();
        const raw = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        const seo = await resolveSeo(req.path, '');
        const html = await vite.transformIndexHtml(req.originalUrl, renderHtml(raw, seo));
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    app.use(
      express.static(DIST_DIR, {
        index: false,
        setHeaders(res, filePath) {
          if (/\.(js|css|woff2?|png|jpg|jpeg|svg|webp|avif)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    app.use(async (req, res, next) => {
      if (!isHtmlRequest(req)) return next();
      try {
        const html = await seoHtml(req);
        if (html) {
          res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }).end(html);
          return;
        }
      } catch (error) {
        return next(error);
      }
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  // ---------------------------------------------------------------------
  // Errors
  // ---------------------------------------------------------------------

  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Endpoint not found', path: req.path });
      return;
    }
    res.status(404).type('text/plain').send('Not found');
  });

  app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
    const code = error?.code ?? error?.name;
    const isDbIssue =
      code === 'PrismaClientInitializationError' ||
      code === 'P1001' ||
      code === 'P1000' ||
      code === 'P2021' ||
      (typeof error?.message === 'string' && error.message.includes('DATABASE_URL'));

    if (isDbIssue) {
      console.error('[komback] database unavailable:', error?.message);
      if (req.path.startsWith('/api')) {
        res.status(503).json({
          error: 'Database unavailable',
          hint: 'Check DATABASE_URL and that PostgreSQL is running, then run `npm run db:check`.',
        });
        return;
      }
    } else {
      console.error('[komback] request failed:', error);
    }

    if (res.headersSent) return;
    if (req.path.startsWith('/api')) {
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.status(500).type('text/plain').send('Internal server error');
  });

  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => {
    console.log(`[komback] server listening on http://localhost:${port}`);
    console.log(`[komback] mode: ${isProduction ? 'production' : 'development'}`);
  });

  return server;
}
