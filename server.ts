/**
 * Komback entry point.
 *
 * Dev:        tsx server.ts            (Express + Vite middleware)
 * Production: esbuild -> dist/server.cjs, started by cPanel/Passenger via app.js
 *
 * All HTTP routes live in `server/routes` and all persistence goes through
 * Prisma (`prisma/schema.prisma`) against the cPanel PostgreSQL database.
 */
import { startServer } from './server/index';

startServer().catch((error) => {
  console.error('[komback] failed to start server:', error);
  process.exit(1);
});
