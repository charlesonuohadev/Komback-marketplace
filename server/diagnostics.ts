import { prisma } from './db';

/**
 * Live database diagnostics used by `npm run db:check` and by the Super Admin
 * → System Health panel. Never exposes credentials.
 */

const EXPECTED_TABLES = [
  'User',
  'Session',
  'PasswordResetToken',
  'AuditLog',
  'PlatformSetting',
  'Category',
  'Store',
  'Product',
  'Review',
  'BlogPost',
  'CartItem',
  'WishlistItem',
  'Order',
  'OrderItem',
  'Shipment',
  'ShipmentEvent',
  'Transaction',
  'Wallet',
  'PayoutRequest',
  'MessageThread',
  'Message',
];

export interface ConnectionInfo {
  host: string;
  port: string;
  database: string;
  schema: string;
  user: string;
  ssl: boolean;
}

/** Parses DATABASE_URL for display purposes only — the password is never returned. */
export function describeConnection(databaseUrl = process.env.DATABASE_URL): ConnectionInfo {
  if (!databaseUrl) {
    return { host: '—', port: '—', database: '—', schema: '—', user: '—', ssl: false };
  }

  try {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname || '—',
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, '') || '—',
      schema: parsed.searchParams.get('schema') ?? 'public',
      user: parsed.username || '—',
      ssl: parsed.searchParams.get('sslmode') === 'require',
    };
  } catch {
    return { host: '—', port: '—', database: '—', schema: '—', user: '—', ssl: false };
  }
}

export interface TableStat {
  table: string;
  exists: boolean;
  rows: number | null;
}

export interface DatabaseReport {
  configured: boolean;
  connected: boolean;
  latencyMs: number | null;
  serverVersion: string | null;
  connection: ConnectionInfo;
  tables: TableStat[];
  missingTables: string[];
  migrations: {
    applied: number;
    pending: number | null;
    latest: string | null;
  };
  error: string | null;
  checkedAt: string;
}

export async function inspectDatabase(): Promise<DatabaseReport> {
  const connection = describeConnection();
  const checkedAt = new Date().toISOString();

  const base: DatabaseReport = {
    configured: Boolean(process.env.DATABASE_URL),
    connected: false,
    latencyMs: null,
    serverVersion: null,
    connection,
    tables: EXPECTED_TABLES.map((table) => ({ table, exists: false, rows: null })),
    missingTables: [],
    migrations: { applied: 0, pending: null, latest: null },
    error: null,
    checkedAt,
  };

  if (!process.env.DATABASE_URL) {
    return {
      ...base,
      error:
        'DATABASE_URL is not set. Add it to .env — for cPanel PostgreSQL it looks like ' +
        'postgresql://USER:PASSWORD@localhost:5432/DBNAME?schema=public',
    };
  }

  try {
    const startedAt = Date.now();
    const versionRows = await prisma.$queryRaw<{ version: string }[]>`SELECT version() AS version`;
    base.connected = true;
    base.latencyMs = Date.now() - startedAt;
    base.serverVersion = versionRows[0]?.version?.split(' ').slice(0, 2).join(' ') ?? null;
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message.split('\n').slice(0, 6).join(' ').trim() : 'Unknown error',
    };
  }

  // Which tables actually exist?
  try {
    const rows = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = current_schema()
    `;
    const present = new Set(rows.map((row) => row.tablename));

    base.tables = EXPECTED_TABLES.map((table) => ({
      table,
      exists: present.has(table),
      rows: null,
    }));
    base.missingTables = base.tables.filter((entry) => !entry.exists).map((entry) => entry.table);
  } catch (error) {
    base.error = error instanceof Error ? error.message : 'Could not inspect tables';
    return base;
  }

  // Row counts — only for tables that exist.
  await Promise.all(
    base.tables
      .filter((entry) => entry.exists)
      .map(async (entry) => {
        try {
          const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM "${entry.table}"`
          );
          entry.rows = Number(result[0]?.count ?? 0);
        } catch {
          entry.rows = null;
        }
      })
  );

  // Migration state.
  try {
    const applied = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
      SELECT migration_name, finished_at FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL ORDER BY finished_at ASC
    `;
    base.migrations.applied = applied.length;
    base.migrations.latest = applied[applied.length - 1]?.migration_name ?? null;
    base.migrations.pending = base.missingTables.length > 0 ? base.missingTables.length : 0;
  } catch {
    // _prisma_migrations only exists once `prisma migrate deploy` has been run.
    base.migrations.applied = 0;
    base.migrations.pending = base.missingTables.length || EXPECTED_TABLES.length;
  }

  return base;
}

/** Compact health summary for the public `/api/health` endpoint. */
export async function quickHealth(): Promise<{ database: string; latencyMs: number | null }> {
  if (!process.env.DATABASE_URL) return { database: 'unconfigured', latencyMs: null };
  try {
    const startedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { database: 'connected', latencyMs: Date.now() - startedAt };
  } catch {
    return { database: 'unavailable', latencyMs: null };
  }
}
