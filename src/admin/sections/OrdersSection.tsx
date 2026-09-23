import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Package, Search, ShieldCheck, Truck } from 'lucide-react';
import { adminApi, AdminApiError, type AdminOrder } from '../adminApi';
import {
  Badge,
  BarList,
  Button,
  Card,
  DataTable,
  ErrorNote,
  Field,
  Input,
  Modal,
  Pagination,
  SectionHeader,
  Select,
  Spinner,
  StatCard,
  formatNaira,
} from '../ui';

const ORDER_STATUSES = [
  'Pending Payment',
  'Escrow Secured',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
  'Released',
  'Cancelled',
];

export const OrdersSection: React.FC<{
  initialParams: URLSearchParams;
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ initialParams, notify }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusTotals, setStatusTotals] = useState<
    { status: string; statusCode: string; count: number; value: number }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState(initialParams.get('q') ?? '');
  const [searchInput, setSearchInput] = useState(initialParams.get('q') ?? '');
  const [status, setStatus] = useState(initialParams.get('status') ?? '');

  const [active, setActive] = useState<AdminOrder | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editWaybill, setEditWaybill] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.orders.list({
        page,
        limit: 25,
        q: query || undefined,
        status: status || undefined,
      });
      setOrders(res.items);
      setStatusTotals(res.statusTotals);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openOrder = (order: AdminOrder) => {
    setActive(order);
    setEditStatus(order.status);
    setEditCourier(order.courier ?? '');
    setEditWaybill(order.waybillNumber ?? '');
    setEditNote('');
  };

  const saveOrder = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await adminApi.orders.update(active.id, {
        status: editStatus,
        courier: editCourier,
        waybillNumber: editWaybill,
        note: editNote || undefined,
      });
      notify(`Order ${active.orderNumber} updated`);
      setActive(null);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const grossValue = statusTotals.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Order control"
        subtitle="Inspect every order on the platform and override its fulfilment status when needed."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Orders" value={total} icon={<Package className="w-4 h-4" />} tone="blue" />
          <StatCard
            label="Total value"
            value={formatNaira(grossValue)}
            hint="All orders in the current filter"
            icon={<ShieldCheck className="w-4 h-4" />}
            tone="emerald"
          />
          <StatCard
            label="Awaiting dispatch"
            value={statusTotals.find((row) => row.statusCode === 'ESCROW_SECURED')?.count ?? 0}
            icon={<Truck className="w-4 h-4" />}
            tone="amber"
          />
        </div>
        <Card className="p-5">
          <SectionHeader title="Pipeline" />
          <BarList
            items={statusTotals
              .slice()
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
              .map((row) => ({ label: row.status, value: row.count }))}
          />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(searchInput);
            }}
            className="flex-1 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search order number, buyer, phone or waybill…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="ghost">
              Search
            </Button>
          </form>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any status</option>
            {ORDER_STATUSES.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading orders…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">Order</th>
                  <th className="py-3 px-5">Buyer</th>
                  <th className="py-3 px-5">Store</th>
                  <th className="py-3 px-5">Placed</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Total</th>
                  <th className="py-3 px-5 text-right">Manage</th>
                </tr>
              }
            >
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5 font-mono text-[11px] font-bold text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block truncate max-w-[150px]">{order.buyer.name}</span>
                    <span className="text-[10px] text-slate-400">{order.buyer.phone}</span>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block truncate max-w-[140px]">{order.store.name}</span>
                  </td>
                  <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(order.placedAt).toLocaleDateString('en-NG')}
                  </td>
                  <td className="py-3 px-5">
                    <Badge
                      tone={
                        order.statusCode === 'RELEASED'
                          ? 'emerald'
                          : order.statusCode === 'CANCELLED'
                            ? 'rose'
                            : order.statusCode === 'DISPATCHED' || order.statusCode === 'OUT_FOR_DELIVERY'
                              ? 'blue'
                              : 'amber'
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-right font-black text-slate-900">
                    {formatNaira(order.total)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openOrder(order)}>
                      <Eye className="w-3.5 h-3.5" />
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No orders match these filters.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(active)}
        title={`Order ${active?.orderNumber ?? ''}`}
        subtitle={`${active?.store.name ?? ''} · placed ${active ? new Date(active.placedAt).toLocaleString('en-NG') : ''}`}
        onClose={() => setActive(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button onClick={saveOrder} loading={saving}>
              Save order
            </Button>
          </>
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500">Buyer & delivery</p>
                <p className="font-bold text-slate-900">{active.buyer.name}</p>
                <p className="text-slate-600">{active.buyer.phone}</p>
                {active.buyer.email && <p className="text-slate-600">{active.buyer.email}</p>}
                <p className="text-slate-600">
                  {active.buyer.address}, {active.buyer.cityState}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500">Payment</p>
                <p className="font-bold text-slate-900">{formatNaira(active.total)}</p>
                <p className="text-slate-600">
                  Subtotal {formatNaira(active.subtotal)} + delivery {formatNaira(active.shippingFee)}
                </p>
                <p className="text-slate-600">
                  Payment: <strong>{active.paymentStatus}</strong>
                </p>
                <p className="text-slate-600">
                  Handover PIN: <strong>{active.pinVerified ? 'verified' : 'not verified'}</strong>
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase text-slate-500 mb-2">
                Items ({active.items.length})
              </p>
              <div className="space-y-1.5">
                {active.items.map((item) => (
                  <div
                    key={`${item.title}-${item.quantity}`}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                  >
                    <img
                      src={item.image || '/images/logo.png'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100"
                    />
                    <span className="flex-1 truncate text-slate-700">{item.title}</span>
                    <span className="text-slate-500">×{item.quantity}</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Fulfilment status">
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {ORDER_STATUSES.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Courier">
                <Input value={editCourier} onChange={(e) => setEditCourier(e.target.value)} />
              </Field>
              <Field label="Waybill number">
                <Input value={editWaybill} onChange={(e) => setEditWaybill(e.target.value)} />
              </Field>
            </div>

            <Field label="Internal note">
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Why is this order being changed?"
              />
            </Field>

            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Setting the status to <strong>Released</strong> marks the escrow as released and stamps the
              release time. Setting it to <strong>Cancelled</strong> flags the payment as refunded. Both are
              recorded in the audit trail against your admin account.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
