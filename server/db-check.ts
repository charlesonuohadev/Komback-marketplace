/**
 * `npm run db:check`
 *
 * Verifies that the application can reach PostgreSQL, that every table the app
 * needs actually exists, and that migrations have been applied. Run this on the
 * cPanel server after `npm install` / `npm run prisma:migrate`.
 *
 * Exit code 0 = healthy, 1 = problem (safe for CI / deployment scripts).
 */
import dotenv from 'dotenv';
import { inspectDatabase } from './diagnostics';
import { prisma } from './db';

dotenv.config();

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const tick = (ok: boolean) => (ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`);

async function main() {
  console.log('\n┌─ Komback database check ─────────────────────────────────────────┐');

  const report = await inspectDatabase();

  console.log(`│ ${tick(report.configured)} DATABASE_URL configured`);
  console.log(
    `│ ${tick(report.connected)} connected to ${report.connection.user}@${report.connection.host}:${report.connection.port}/${report.connection.database}` +
      (report.connection.ssl ? ' (ssl)' : '')
  );

  if (!report.connected) {
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log(`\n${RED}Database is NOT connected.${RESET}\n`);
    console.log(`Reason: ${report.error}\n`);
    console.log('How to fix:');
    console.log('  1. In cPanel → PostgreSQL Databases, note the database name, user and password.');
    console.log('  2. Put them in .env on the server:');
    console.log(
      `     ${DIM}DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DBNAME?schema=public"${RESET}`
    );
    console.log('  3. If this machine is NOT the cPanel server, enable Remote PostgreSQL in cPanel');
    console.log(`     and use the server hostname plus ${DIM}&sslmode=require${RESET}.`);
    console.log('  4. Re-run: npm run db:check\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(
    `│ ${tick(true)} round-trip ${report.latencyMs}ms  ${DIM}${report.serverVersion ?? ''}${RESET}`
  );
  console.log(`│ ${tick(report.missingTables.length === 0)} schema: ${EXPECTED_SUMMARY(report)}`);
  console.log('└──────────────────────────────────────────────────────────────────┘');

  console.log('\nTables');
  for (const table of report.tables) {
    const count = table.rows === null ? '—' : table.rows.toLocaleString();
    console.log(
      `  ${tick(table.exists)} ${table.table.padEnd(20)} ${table.exists ? count.padStart(10) : `${RED}missing${RESET}`}`
    );
  }

  console.log('\nMigrations');
  console.log(`  ${tick(report.migrations.applied > 0)} applied: ${report.migrations.applied}`);
  console.log(`  ${tick(report.missingTables.length === 0)} pending: ${report.migrations.pending ?? 'unknown'}`);
  if (report.migrations.latest) {
    console.log(`  ${DIM}latest: ${report.migrations.latest}${RESET}`);
  }

  if (report.missingTables.length > 0) {
    console.log(`\n${YELLOW}Some tables are missing.${RESET} Run one of:`);
    console.log(`  ${DIM}npm run prisma:migrate${RESET}   (apply committed migrations — recommended)`);
    console.log(`  ${DIM}npm run prisma:push${RESET}      (sync schema directly)\n`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const productCount = report.tables.find((table) => table.table === 'Product')?.rows ?? 0;
  if (productCount === 0) {
    console.log(`\n${YELLOW}Schema is ready but there is no catalog data yet.${RESET}`);
    console.log(`  ${DIM}npm run db:seed${RESET}   (loads the initial categories, stores, listings and content)\n`);
  }

  console.log(`\n${GREEN}Database is connected and fully migrated.${RESET}\n`);
  await prisma.$disconnect();
  process.exit(0);
}

function EXPECTED_SUMMARY(report: { tables: { exists: boolean }[]; missingTables: string[] }) {
  const total = report.tables.length;
  const present = total - report.missingTables.length;
  return `${present}/${total} tables present`;
}

main().catch(async (error) => {
  console.error(`${RED}Database check crashed:${RESET}`, error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
