import { PrismaClient } from '@prisma/client';

/**
 * Single PrismaClient instance for the process. On cPanel/Passenger the app is a
 * long-lived Node process, so a module-level singleton is the correct lifetime.
 */
const globalForPrisma = globalThis as unknown as { __kombackPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__kombackPrisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

globalForPrisma.__kombackPrisma = prisma;

export function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Add your cPanel PostgreSQL connection string to .env ' +
        '(postgresql://USER:PASSWORD@localhost:5432/DBNAME?schema=public).'
    );
  }
}
