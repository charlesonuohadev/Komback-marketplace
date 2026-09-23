import React, { useCallback, useEffect, useState } from 'react';
import { Banknote, Check, Search, Wallet, X } from 'lucide-react';
import { adminApi, AdminApiError } from '../adminApi';
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
  Textarea,
  formatNaira,
} from '../ui';

type Tab = 'payouts' | 'transactions';

interface TransactionRow {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  description: string;
  account: string;
  provider: string | null;
  store: { id: string; name: string } | null;
  orderNumber: string | null;
  createdAt: string;
}

interface PayoutRow {
  id: string;
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: string;
  note: string | null;
  requestedAt: string;
  processedAt: string | null;
  store: { id: string; name: string; slug: string };
}

export const FinanceSection: React.FC<{
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ notify }) => {
  const [tab, setTab] = useState<Tab>('payouts');

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Finance & escrow"
        subtitle="Approve seller withdrawals and audit every money movement on the platform."
        actions={
          <div className="flex bg-slate-100 rounded-xl p-1 text-[11px] font-bold">
            <button
              onClick={() => setTab('payouts')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                tab === 'payouts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Payouts
            </button>
            <button
              onClick={() => setTab('transactions')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                tab === 'transactions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Banknote className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Ledger
            </button>
          </div>
        }
      />

      {tab === 'payouts' ? <PayoutsPanel notify={notify} /> : <TransactionsPanel />}
    </div>
  );
};

// ---------------------------------------------------------------------------

const PayoutsPanel: React.FC<{ notify: (message: string, tone?: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ payout: PayoutRow; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.finance.payouts({ page, limit: 25, status: status || undefined });
      setPayouts(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load payouts');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingValue = payouts
    .filter((row) => row.status === 'PENDING')
    .reduce((sum, row) => sum + row.amount, 0);

  const decide = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      await adminApi.finance.decidePayout(decision.payout.id, decision.action, note || undefined);
      notify(
        decision.action === 'approve'
          ? `Approved ${formatNaira(decision.payout.amount)} for ${decision.payout.store.name}`
          : `Rejected payout — ${formatNaira(decision.payout.amount)} returned to ${decision.payout.store.name}`
      );
      setDecision(null);
      setNote('');
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Payout requests" value={total} icon={<Wallet className="w-4 h-4" />} tone="blue" />
        <StatCard
          label="Pending value (this page)"
          value={formatNaira(pendingValue)}
          icon={<Banknote className="w-4 h-4" />}
          tone={pendingValue > 0 ? 'amber' : 'default'}
        />
        <StatCard
          label="Awaiting review"
          value={payouts.filter((row) => row.status === 'PENDING').length}
          icon={<Check className="w-4 h-4" />}
          tone="rose"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Approving a payout marks the withdrawal as completed. Rejecting returns the funds to the
            seller's available balance.
          </p>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </Select>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading payouts…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">Store</th>
                  <th className="py-3 px-5">Bank</th>
                  <th className="py-3 px-5">Requested</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Decision</th>
                </tr>
              }
            >
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5 font-bold text-slate-900">{payout.store.name}</td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block">{payout.bankName}</span>
                    <span className="text-[10px] text-slate-500">
                      {payout.accountName} · {payout.accountNumber}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(payout.requestedAt).toLocaleString('en-NG', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-5">
                    <Badge
                      tone={
                        payout.status === 'COMPLETED'
                          ? 'emerald'
                          : payout.status === 'REJECTED'
                            ? 'rose'
                            : 'amber'
                      }
                    >
                      {payout.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-right font-black text-slate-900">
                    {formatNaira(payout.amount)}
                  </td>
                  <td className="py-3 px-5">
                    {payout.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => {
                            setNote('');
                            setDecision({ payout, action: 'approve' });
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNote('');
                            setDecision({ payout, action: 'reject' });
                          }}
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-[11px] text-slate-500">
                        {payout.processedAt
                          ? new Date(payout.processedAt).toLocaleDateString('en-NG')
                          : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No payout requests in this state.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(decision)}
        title={
          decision?.action === 'approve'
            ? `Approve ${formatNaira(decision?.payout.amount ?? 0)}?`
            : `Reject this payout?`
        }
        subtitle={decision?.payout.store.name}
        onClose={() => setDecision(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.action === 'approve' ? 'primary' : 'danger'}
              onClick={decide}
              loading={busy}
            >
              {decision?.action === 'approve' ? 'Approve payout' : 'Reject payout'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {decision?.action === 'reject' && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
              The amount is credited back to the seller's available balance and the ledger entry is
              marked as failed.
            </p>
          )}
          <Field label="Note (optional)">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------

const TransactionsPanel: React.FC = () => {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [totals, setTotals] = useState<{ type: string; amount: number; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.finance.transactions({
        page,
        limit: 25,
        type: type || undefined,
        q: query || undefined,
      });
      setRows(res.items);
      setTotals(res.totals);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load the ledger');
    } finally {
      setLoading(false);
    }
  }, [page, type, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionHeader title="Ledger totals by movement type" />
        <BarList
          items={totals.map((row) => ({
            label: `${row.type.replace(/_/g, ' ')} (${row.count})`,
            value: row.amount,
            tone: row.type === 'ESCROW_RELEASE' ? 'bg-emerald-500' : 'bg-blue-500',
          }))}
        />
      </Card>

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
                placeholder="Search reference, description or order…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="ghost">
              Search
            </Button>
          </form>
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All movements</option>
            <option value="ESCROW_SECURED">Escrow secured</option>
            <option value="ESCROW_RELEASE">Escrow release</option>
            <option value="BANK_PAYOUT">Bank payout</option>
            <option value="REFUND">Refund</option>
            <option value="LISTING_FEE">Listing fee</option>
            <option value="BOOST_FEE">Boost fee</option>
          </Select>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading ledger…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Store</th>
                  <th className="py-3 px-5">Detail</th>
                  <th className="py-3 px-5">When</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              }
            >
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5 font-mono text-[10px] font-bold text-slate-800">
                    {row.reference}
                  </td>
                  <td className="py-3 px-5">
                    <Badge tone={row.status === 'COMPLETED' ? 'emerald' : row.status === 'FAILED' ? 'rose' : 'amber'}>
                      {row.type.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block truncate max-w-[140px]">{row.store?.name ?? '—'}</span>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block truncate max-w-[220px]">{row.description}</span>
                    <span className="text-[10px] text-slate-400">{row.account}</span>
                  </td>
                  <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString('en-NG')}
                  </td>
                  <td className="py-3 px-5 text-right font-black text-slate-900">
                    {formatNaira(row.amount)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No ledger entries match these filters.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};
