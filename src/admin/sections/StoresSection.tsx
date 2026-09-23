import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  ExternalLink,
  Pencil,
  RotateCcw,
  Search,
  Star,
  Store as StoreIcon,
  Wallet,
} from 'lucide-react';
import { adminApi, AdminApiError, type AdminStore } from '../adminApi';
import {
  Badge,
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
  Textarea,
  formatNaira,
} from '../ui';

interface StoreForm {
  id: string;
  name: string;
  tagline: string;
  description: string;
  location: string;
  state: string;
  phone: string;
  isVerified: boolean;
  isFeaturedStore: boolean;
  badges: string;
  adminNotes: string;
}

export const StoresSection: React.FC<{
  initialParams: URLSearchParams;
  notify: (message: string, tone?: 'success' | 'error') => void;
  states: string[];
}> = ({ initialParams, notify, states }) => {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState(initialParams.get('q') ?? '');
  const [searchInput, setSearchInput] = useState(initialParams.get('q') ?? '');
  const [status, setStatus] = useState(initialParams.get('status') ?? '');
  const [state, setState] = useState('');

  const [form, setForm] = useState<StoreForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [suspendTarget, setSuspendTarget] = useState<AdminStore | null>(null);
  const [suspendReason, setSuspendReason] = useState('Under review by Komback trust & safety');
  const [busy, setBusy] = useState(false);

  const [walletTarget, setWalletTarget] = useState<AdminStore | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('Manual correction by administrator');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.stores.list({
        page,
        limit: 25,
        q: query || undefined,
        status: status || undefined,
        state: state || undefined,
      });
      setStores(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load stores');
    } finally {
      setLoading(false);
    }
  }, [page, query, status, state]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (store: AdminStore) => {
    setFormError(null);
    setForm({
      id: store.id,
      name: store.name,
      tagline: store.tagline,
      description: store.description,
      location: store.location,
      state: store.state,
      phone: store.phone,
      isVerified: store.isVerified,
      isFeaturedStore: store.isFeaturedStore,
      badges: store.badges.join('\n'),
      adminNotes: store.adminNotes ?? '',
    });
  };

  const save = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      await adminApi.stores.update(form.id, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        location: form.location,
        state: form.state,
        phone: form.phone,
        isVerified: form.isVerified,
        isFeaturedStore: form.isFeaturedStore,
        badges: form.badges,
        adminNotes: form.adminNotes,
      });
      notify(`Updated ${form.name}`);
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleVerified = async (store: AdminStore) => {
    try {
      await adminApi.stores.verify(store.id, !store.isVerified);
      notify(`${store.name} is now ${!store.isVerified ? 'verified' : 'unverified'}`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Update failed', 'error');
    }
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    setBusy(true);
    try {
      const res = await adminApi.stores.suspend(suspendTarget.id, suspendReason);
      notify(`Suspended ${suspendTarget.name} · ${res.listingsHidden} listing(s) hidden`);
      setSuspendTarget(null);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Suspend failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reinstate = async (store: AdminStore) => {
    try {
      const res = await adminApi.stores.reinstate(store.id);
      notify(`Reinstated ${store.name} · ${res.listingsRestored} listing(s) restored`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Reinstate failed', 'error');
    }
  };

  const applyAdjustment = async () => {
    if (!walletTarget) return;
    setBusy(true);
    try {
      const amount = Number.parseInt(adjustAmount, 10);
      await adminApi.finance.adjustWallet(walletTarget.id, amount, adjustReason);
      notify(`Wallet adjusted by ${formatNaira(amount)} for ${walletTarget.name}`);
      setWalletTarget(null);
      setAdjustAmount('');
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Adjustment failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Store & seller management"
        subtitle="Verify, feature, suspend or reinstate any merchant storefront and manage their wallet."
      />

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
                placeholder="Search store name, tagline or owner email…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="ghost">
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All states</option>
              {states
                .filter((name) => name !== 'All Nigeria')
                .map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </Select>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading stores…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">Store</th>
                  <th className="py-3 px-5">Owner</th>
                  <th className="py-3 px-5">Performance</th>
                  <th className="py-3 px-5">Wallet</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              }
            >
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={store.avatar || '/images/logo.png'}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{store.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {store.state} · {store.category || 'Uncategorised'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    {store.owner ? (
                      <span className="block truncate max-w-[170px]">{store.owner.email}</span>
                    ) : (
                      <span className="text-slate-400">No owner linked</span>
                    )}
                  </td>
                  <td className="py-3 px-5 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {store.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {store.totalProducts} listings · {store.salesCount} sales
                    </span>
                  </td>
                  <td className="py-3 px-5 whitespace-nowrap">
                    {store.wallet ? (
                      <>
                        <span className="block font-black text-slate-900">
                          {formatNaira(store.wallet.availableBalance)}
                        </span>
                        <span className="text-[10px] text-amber-600">
                          {formatNaira(store.wallet.escrowLocked)} in escrow
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex flex-wrap gap-1">
                      {store.isSuspended && <Badge tone="rose">SUSPENDED</Badge>}
                      {store.isVerified && <Badge tone="emerald">Verified</Badge>}
                      {store.isFeaturedStore && <Badge tone="violet">Featured</Badge>}
                      {!store.isVerified && !store.isSuspended && <Badge tone="slate">Pending</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title={store.isVerified ? 'Remove verification' : 'Verify store'}
                        onClick={() => toggleVerified(store)}
                      >
                        <BadgeCheck
                          className={`w-3.5 h-3.5 ${store.isVerified ? 'text-emerald-600' : 'text-slate-400'}`}
                        />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(store)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Adjust wallet"
                        onClick={() => {
                          setWalletTarget(store);
                          setAdjustAmount('');
                        }}
                      >
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      {store.isSuspended ? (
                        <Button variant="ghost" size="sm" title="Reinstate" onClick={() => reinstate(store)}>
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Suspend store"
                          onClick={() => {
                            setSuspendReason('Under review by Komback trust & safety');
                            setSuspendTarget(store);
                          }}
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      )}
                      <a
                        href={`/store/${store.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View storefront"
                        className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No stores match these filters.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
          </>
        )}
      </Card>

      {/* Edit store */}
      <Modal
        open={Boolean(form)}
        title={`Edit ${form?.name ?? 'store'}`}
        onClose={() => setForm(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={() => save()} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        {form && (
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Store name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Tagline">
                <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </Field>
            </div>
            <Field label="City / area">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Badges" hint="One per line, e.g. Verified Merchant">
                <Textarea
                  rows={3}
                  value={form.badges}
                  onChange={(e) => setForm({ ...form, badges: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                  checked={form.isVerified}
                  onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified merchant
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-violet-600"
                  checked={form.isFeaturedStore}
                  onChange={(e) => setForm({ ...form, isFeaturedStore: e.target.checked })}
                />
                <StoreIcon className="w-3.5 h-3.5 text-violet-600" /> Feature on the homepage
              </label>
            </div>
            <div className="sm:col-span-2">
              <Field label="Internal notes">
                <Textarea
                  rows={2}
                  value={form.adminNotes}
                  onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                />
              </Field>
            </div>
            {formError && (
              <p className="sm:col-span-2 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {formError}
              </p>
            )}
          </form>
        )}
      </Modal>

      {/* Suspend */}
      <Modal
        open={Boolean(suspendTarget)}
        title={`Suspend ${suspendTarget?.name ?? ''}`}
        subtitle="All of the store's listings are hidden from the marketplace immediately."
        onClose={() => setSuspendTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmSuspend} loading={busy}>
              Suspend store
            </Button>
          </>
        }
      >
        <Field label="Reason">
          <Textarea rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
        </Field>
      </Modal>

      {/* Wallet adjustment */}
      <Modal
        open={Boolean(walletTarget)}
        title={`Adjust wallet — ${walletTarget?.name ?? ''}`}
        subtitle="Signed amount: positive credits the seller, negative debits them."
        onClose={() => setWalletTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setWalletTarget(null)}>
              Cancel
            </Button>
            <Button onClick={applyAdjustment} loading={busy}>
              Apply adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Current available balance: </span>
            <span className="font-black text-slate-900">
              {formatNaira(walletTarget?.wallet?.availableBalance ?? 0)}
            </span>
          </div>
          <Field label="Amount (₦)">
            <Input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 25000 or -10000"
            />
          </Field>
          <Field label="Reason (recorded in the audit trail)">
            <Textarea rows={2} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};
