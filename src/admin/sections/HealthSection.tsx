import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  KeyRound,
  Mail,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react';
import { adminApi, AdminApiError, type DatabaseHealth } from '../adminApi';
import {
  Badge,
  Button,
  Card,
  DataTable,
  ErrorNote,
  SectionHeader,
  Spinner,
  StatCard,
} from '../ui';

export const HealthSection: React.FC = () => {
  const [report, setReport] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.health();
      setReport(res);
      setCheckedAt(new Date().toLocaleTimeString('en-NG'));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not run diagnostics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !report) return <Spinner label="Running database diagnostics…" />;

  const connected = Boolean(report?.connected);
  const migrated = (report?.missingTables.length ?? 1) === 0;
  const totalRows = report?.tables.reduce((sum, table) => sum + (table.rows ?? 0), 0) ?? 0;

  const checklist = [
    { label: 'DATABASE_URL configured', ok: Boolean(report?.configured) },
    { label: 'Connected to PostgreSQL', ok: connected },
    { label: 'Schema fully migrated', ok: connected && migrated },
    { label: 'Platform has data', ok: (report?.tables.find((t) => t.table === 'Product')?.rows ?? 0) > 0 },
    { label: 'Audit trail active', ok: (report?.tables.find((t) => t.table === 'AuditLog')?.rows ?? 0) > 0 },
    { label: 'Email provider configured', ok: Boolean(report?.runtime.mailConfigured) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="System health"
        subtitle="Confirm the app is talking to PostgreSQL, the schema is complete, and integrations are live."
        actions={
          <>
            {checkedAt && <span className="text-[11px] text-slate-500">Checked at {checkedAt}</span>}
            <Button variant="ghost" onClick={load} loading={loading}>
              <RefreshCw className="w-3.5 h-3.5" />
              Re-check
            </Button>
          </>
        }
      />

      <div
        className={`rounded-2xl border p-5 ${
          connected && migrated
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {connected && migrated ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
          )}
          <div className="text-xs">
            <p
              className={`font-black text-sm ${
                connected && migrated ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {connected && migrated
                ? 'Database connected and fully migrated — the app is persisting live data.'
                : connected
                  ? 'Connected, but the schema is incomplete.'
                  : 'Not connected to PostgreSQL.'}
            </p>
            {report?.error && (
              <p className="mt-2 font-mono text-[10px] text-rose-800 bg-white/70 rounded-lg p-2 break-all">
                {report.error}
              </p>
            )}
            {!connected && (
              <div className="mt-3 space-y-1 text-rose-800">
                <p className="font-bold">How to fix:</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>
                    In cPanel → <strong>PostgreSQL Databases</strong>, note the database name, user and
                    password.
                  </li>
                  <li>
                    Put them in <code className="font-mono">.env</code>:{' '}
                    <code className="font-mono">
                      DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DBNAME?schema=public"
                    </code>
                  </li>
                  <li>
                    Run <code className="font-mono">npm run db:check</code> to verify, then{' '}
                    <code className="font-mono">npm run prisma:migrate</code>.
                  </li>
                </ol>
              </div>
            )}
            {connected && !migrated && (
              <p className="mt-2 text-rose-800">
                Missing tables: <strong>{report?.missingTables.join(', ')}</strong>. Run{' '}
                <code className="font-mono">npm run prisma:migrate</code> (or{' '}
                <code className="font-mono">npm run prisma:push</code>).
              </p>
            )}
          </div>
        </div>
      </div>

      <ErrorNote message={error} onRetry={load} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Round-trip latency"
          value={report?.latencyMs !== null && report?.latencyMs !== undefined ? `${report.latencyMs} ms` : '—'}
          icon={<Server className="w-4 h-4" />}
          tone="blue"
        />
        <StatCard
          label="Rows across all tables"
          value={totalRows}
          icon={<HardDrive className="w-4 h-4" />}
          tone="emerald"
        />
        <StatCard
          label="Migrations applied"
          value={report?.migrations.applied ?? 0}
          hint={report?.migrations.latest ?? 'none'}
          icon={<Database className="w-4 h-4" />}
          tone="violet"
        />
        <StatCard
          label="Uptime"
          value={report ? `${Math.floor(report.runtime.uptimeSeconds / 60)} min` : '—'}
          hint={report?.runtime.node}
          icon={<RefreshCw className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5">
          <SectionHeader title="Readiness checklist" />
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={item.ok ? 'text-slate-700' : 'text-slate-500'}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Connection" />
          <dl className="space-y-2 text-xs">
            {[
              ['Host', report?.connection.host],
              ['Port', report?.connection.port],
              ['Database', report?.connection.database],
              ['Schema', report?.connection.schema],
              ['User', report?.connection.user],
              ['TLS', report?.connection.ssl ? 'required' : 'not required'],
              ['Server', report?.serverVersion],
              ['Environment', report?.runtime.environment],
              ['App URL', report?.runtime.appUrl],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-mono font-bold text-slate-800 truncate max-w-[60%]">
                  {value ?? '—'}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Integrations" />
          <div className="space-y-2.5">
            {[
              {
                label: 'Paystack',
                ok: Boolean(report?.runtime.payments.paystack),
                Icon: KeyRound,
              },
              {
                label: 'Flutterwave',
                ok: Boolean(report?.runtime.payments.flutterwave),
                Icon: KeyRound,
              },
              {
                label: 'Email delivery',
                ok: Boolean(report?.runtime.mailConfigured),
                Icon: Mail,
              },
            ].map(({ label, ok, Icon }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {label}
                </span>
                <Badge tone={ok ? 'emerald' : 'amber'}>
                  {ok ? 'Configured' : 'Sandbox / not set'}
                </Badge>
              </div>
            ))}
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Unset gateways run in clearly-labelled sandbox mode. Password reset links are written to
              the server log when no email provider is configured.
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5">
          <SectionHeader
            title="Tables"
            subtitle={`${report?.tables.length ?? 0} expected tables · ${report?.missingTables.length ?? 0} missing`}
          />
        </div>
        <DataTable
          head={
            <tr>
              <th className="py-3 px-5">Table</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Rows</th>
            </tr>
          }
        >
          {(report?.tables ?? []).map((table) => (
            <tr key={table.table} className="hover:bg-slate-50/70">
              <td className="py-2.5 px-5 font-mono text-[11px] font-bold text-slate-800">
                {table.table}
              </td>
              <td className="py-2.5 px-5">
                <Badge tone={table.exists ? 'emerald' : 'rose'}>
                  {table.exists ? 'present' : 'missing'}
                </Badge>
              </td>
              <td className="py-2.5 px-5 text-right font-bold text-slate-700">
                {table.rows === null ? '—' : table.rows.toLocaleString()}
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </div>
  );
};
