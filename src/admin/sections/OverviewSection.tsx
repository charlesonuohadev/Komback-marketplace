import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Ban,
  Clock,
  EyeOff,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store as StoreIcon,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { adminApi, type AdminOverview } from '../adminApi';
import { auditLabel } from '../auditLabels';
import {
  BarList,
  Button,
  Card,
  DataTable,
  ErrorNote,
  SectionHeader,
  Spinner,
  StatCard,
  TrendChart,
  formatNaira,
} from '../ui';

export const OverviewSection: React.FC<{ onNavigate: (section: string, params?: string) => void }> = ({
  onNavigate,
}) => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.overview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) return <Spinner label="Loading marketplace overview…" />;
  if (error && !data) return <ErrorNote message={error} onRetry={load} />;
  if (!data) return null;

  const { kpis } = data;

  return (
    <div className="space-y-6">
      <ErrorNote message={error} onRetry={load} />

      <SectionHeader
        title="Marketplace overview"
        subtitle="Live totals across users, stores, listings, orders and money movement."
        actions={
          <Button variant="ghost" onClick={load} loading={loading}>
            Refresh
          </Button>
        }
      />

      {/* Money */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Gross settled revenue"
          value={formatNaira(kpis.finance.grossRevenue)}
          hint="Escrow released to merchants"
          icon={<TrendingUp className="w-4 h-4" />}
          tone="emerald"
          onClick={() => onNavigate('finance')}
        />
        <StatCard
          label="Escrow currently held"
          value={formatNaira(kpis.finance.escrowLocked)}
          hint="Locked until buyer PIN verification"
          icon={<ShieldCheck className="w-4 h-4" />}
          tone="amber"
          onClick={() => onNavigate('finance')}
        />
        <StatCard
          label="Seller wallet balances"
          value={formatNaira(kpis.finance.sellerBalances)}
          hint="Available for withdrawal"
          icon={<Wallet className="w-4 h-4" />}
          tone="blue"
          onClick={() => onNavigate('finance')}
        />
        <StatCard
          label="Pending payouts"
          value={formatNaira(kpis.finance.pendingPayouts)}
          hint={`${kpis.finance.pendingPayoutCount} request(s) awaiting review`}
          icon={<Clock className="w-4 h-4" />}
          tone={kpis.finance.pendingPayoutCount > 0 ? 'rose' : 'default'}
          onClick={() => onNavigate('finance')}
        />
      </div>

      {/* People & catalog */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Accounts"
          value={kpis.users.total}
          hint={`${kpis.users.buyers} buyers · ${kpis.users.sellers} sellers · ${kpis.users.admins} admins`}
          icon={<Users className="w-4 h-4" />}
          tone="violet"
          onClick={() => onNavigate('users')}
        />
        <StatCard
          label="Stores"
          value={kpis.stores.total}
          hint={`${kpis.stores.verified} verified · ${kpis.stores.suspended} suspended`}
          icon={<StoreIcon className="w-4 h-4" />}
          tone="emerald"
          onClick={() => onNavigate('stores')}
        />
        <StatCard
          label="Listings"
          value={kpis.products.total}
          hint={`${kpis.products.hidden} hidden by moderation`}
          icon={<Package className="w-4 h-4" />}
          onClick={() => onNavigate('listings')}
        />
        <StatCard
          label="Orders"
          value={kpis.orders.total}
          hint={`${kpis.engagement.enquiries} buyer enquiries`}
          icon={<ShoppingBag className="w-4 h-4" />}
          tone="blue"
          onClick={() => onNavigate('orders')}
        />
      </div>

      {/* Alerts */}
      {(kpis.users.banned > 0 || kpis.stores.suspended > 0 || kpis.products.hidden > 0) && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-900">Moderation in effect</p>
              <p className="mt-1">
                <button
                  onClick={() => onNavigate('users', 'status=banned')}
                  className="font-bold text-rose-700 hover:underline cursor-pointer"
                >
                  <Ban className="w-3 h-3 inline -mt-0.5" /> {kpis.users.banned} banned account(s)
                </button>
                {' · '}
                <button
                  onClick={() => onNavigate('stores', 'status=suspended')}
                  className="font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  {kpis.stores.suspended} suspended store(s)
                </button>
                {' · '}
                <button
                  onClick={() => onNavigate('listings', 'status=hidden')}
                  className="font-bold text-slate-700 hover:underline cursor-pointer"
                >
                  <EyeOff className="w-3 h-3 inline -mt-0.5" /> {kpis.products.hidden} hidden listing(s)
                </button>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Trend + status mix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <SectionHeader
            title="Orders & revenue (30 days)"
            subtitle={`${kpis.growth.signups7} new accounts in the last 7 days · ${kpis.growth.signups30} in 30 days`}
          />
          <TrendChart data={data.trend} />
        </Card>

        <Card className="p-5">
          <SectionHeader title="Order pipeline" subtitle="Where every order currently sits" />
          <BarList
            items={kpis.orders.byStatus
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((row) => ({ label: row.status, value: row.count }))}
          />
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              {kpis.engagement.reviews} reviews ({kpis.engagement.hiddenReviews} hidden)
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              {kpis.engagement.enquiries} enquiries
            </span>
          </div>
        </Card>
      </div>

      {/* Top stores + recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-1">
          <div className="p-5">
            <SectionHeader title="Top stores" subtitle="Ranked by completed sales" />
          </div>
          <div className="px-5 pb-5 space-y-3">
            {data.topStores.length === 0 && (
              <p className="text-xs text-slate-500">No stores yet.</p>
            )}
            {data.topStores.map((store) => (
              <button
                key={store.id}
                onClick={() => onNavigate('stores', `q=${encodeURIComponent(store.name)}`)}
                className="w-full flex items-center gap-3 text-left hover:bg-slate-50 rounded-xl p-2 transition-colors cursor-pointer"
              >
                <img
                  src={store.avatar || '/images/logo.png'}
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover bg-slate-100 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{store.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {store.state} · {store.totalProducts} listings
                  </p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 shrink-0">
                  {store.salesCount.toLocaleString()} sales
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2 overflow-hidden">
          <div className="p-5 pb-0">
            <SectionHeader
              title="Latest orders"
              subtitle="Newest escrow-secured purchases"
              actions={
                <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')}>
                  View all
                </Button>
              }
            />
          </div>
          <DataTable
            head={
              <tr>
                <th className="py-3 px-5">Order</th>
                <th className="py-3 px-5">Buyer</th>
                <th className="py-3 px-5">Store</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Total</th>
              </tr>
            }
          >
            {data.recentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-5 font-mono text-[11px] font-bold text-slate-900">
                  {order.orderNumber}
                </td>
                <td className="py-3 px-5 text-slate-600">{order.buyer.name}</td>
                <td className="py-3 px-5 text-slate-600">{order.store.name}</td>
                <td className="py-3 px-5 font-bold text-slate-700">{order.status}</td>
                <td className="py-3 px-5 text-right font-black text-slate-900">
                  {formatNaira(order.total)}
                </td>
              </tr>
            ))}
            {data.recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </DataTable>
        </Card>
      </div>

      {/* Activity preview */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-0">
          <SectionHeader
            title="Latest activity"
            subtitle="Real-time audit trail across the entire platform"
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('activity')}>
                <Activity className="w-3.5 h-3.5" />
                Full activity log
              </Button>
            }
          />
        </div>
        <DataTable
          head={
            <tr>
              <th className="py-3 px-5">When</th>
              <th className="py-3 px-5">Action</th>
              <th className="py-3 px-5">Actor</th>
              <th className="py-3 px-5">Detail</th>
            </tr>
          }
        >
          {data.recentActivity.map((entry) => (
            <tr key={entry.id} className="hover:bg-slate-50/70">
              <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleString('en-NG', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="py-3 px-5 font-bold text-slate-900 whitespace-nowrap">
                {auditLabel(entry.action)}
              </td>
              <td className="py-3 px-5 text-slate-600">
                <span className="block truncate max-w-[180px]">{entry.actorEmail ?? '—'}</span>
                <span className="text-[10px] text-slate-400">{entry.actorRole ?? 'GUEST'}</span>
              </td>
              <td className="py-3 px-5 text-slate-600">{entry.description || '—'}</td>
            </tr>
          ))}
          {data.recentActivity.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-slate-500">
                No activity recorded yet.
              </td>
            </tr>
          )}
        </DataTable>
      </Card>
    </div>
  );
};
