import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { adminApi, AdminApiError, type AdminUser } from '../adminApi';
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
  StatCard,
  Textarea,
  formatNaira,
} from '../ui';

type RoleFilter = 'all' | 'BUYER' | 'SELLER' | 'ADMIN';
type StatusFilter = 'all' | 'active' | 'banned' | 'verified' | 'unverified';

interface FormState {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  password: string;
  location: string;
  state: string;
  emailVerified: boolean;
  isActive: boolean;
  adminNotes: string;
  storeName: string;
  storeCategorySlug: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  role: 'BUYER',
  password: '',
  location: '',
  state: 'Lagos',
  emailVerified: true,
  isActive: true,
  adminNotes: '',
  storeName: '',
  storeCategorySlug: '',
};

export const UsersSection: React.FC<{
  initialParams: URLSearchParams;
  categories: { slug: string; name: string }[];
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ initialParams, categories, notify }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleTotals, setRoleTotals] = useState<{ role: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<RoleFilter>((initialParams.get('role') as RoleFilter) ?? 'all');
  const [status, setStatus] = useState<StatusFilter>((initialParams.get('status') as StatusFilter) ?? 'all');
  const [query, setQuery] = useState(initialParams.get('q') ?? '');
  const [searchInput, setSearchInput] = useState(initialParams.get('q') ?? '');

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Awaited<ReturnType<typeof adminApi.users.detail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('Violation of Komback marketplace policy');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteStore, setDeleteStore] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.users.list({
        page,
        limit: 25,
        role: role === 'all' ? undefined : role,
        status: status === 'all' ? undefined : status,
        q: query || undefined,
      });
      setUsers(res.items);
      setRoleTotals(res.roleTotals);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load accounts');
    } finally {
      setLoading(false);
    }
  }, [page, role, status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setFormError(null);
    setForm({ ...EMPTY_FORM, storeCategorySlug: categories[0]?.slug ?? '' });
  };

  const openEdit = (user: AdminUser) => {
    setFormError(null);
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      password: '',
      location: user.location ?? '',
      state: user.state ?? 'Lagos',
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      adminNotes: user.adminNotes ?? '',
      storeName: '',
      storeCategorySlug: categories[0]?.slug ?? '',
    });
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);

    try {
      if (form.id) {
        await adminApi.users.update(form.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          location: form.location,
          state: form.state,
          emailVerified: form.emailVerified,
          isActive: form.isActive,
          adminNotes: form.adminNotes,
          ...(form.password ? { password: form.password } : {}),
        });
        notify(`Updated ${form.email}`);
      } else {
        await adminApi.users.create({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          password: form.password,
          location: form.location,
          state: form.state,
          emailVerified: form.emailVerified,
          adminNotes: form.adminNotes,
          ...(form.role === 'SELLER'
            ? { storeName: form.storeName || form.name, storeCategorySlug: form.storeCategorySlug }
            : {}),
        });
        notify(`Created ${form.role.toLowerCase()} account ${form.email}`);
      }
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    setBusyAction(true);
    try {
      const res = await adminApi.users.ban(banTarget.id, banReason);
      notify(`Banned ${banTarget.email} · ${res.sessionsRevoked} session(s) ended`);
      setBanTarget(null);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Ban failed', 'error');
    } finally {
      setBusyAction(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyAction(true);
    try {
      await adminApi.users.remove(deleteTarget.id, deleteStore);
      notify(`Deleted ${deleteTarget.email}`);
      setDeleteTarget(null);
      setDeleteStore(false);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusyAction(false);
    }
  };

  const unban = async (user: AdminUser) => {
    try {
      await adminApi.users.unban(user.id);
      notify(`Reinstated ${user.email}`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Unban failed', 'error');
    }
  };

  const revoke = async (user: AdminUser) => {
    try {
      const res = await adminApi.users.revokeSessions(user.id);
      notify(`Signed ${user.email} out of ${res.sessionsRevoked} session(s)`);
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Could not revoke sessions', 'error');
    }
  };

  const openDetail = async (user: AdminUser) => {
    setDetailLoading(true);
    try {
      setDetail(await adminApi.users.detail(user.id));
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Could not load account', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const buyers = roleTotals.find((row) => row.role === 'BUYER')?.count ?? 0;
  const sellers = roleTotals.find((row) => row.role === 'SELLER')?.count ?? 0;
  const admins = roleTotals.find((row) => row.role === 'ADMIN')?.count ?? 0;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Users, buyers & sellers"
        subtitle="Create, edit, verify, ban or delete any account on the platform."
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" />
            New account
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="All accounts" value={total} icon={<Users className="w-4 h-4" />} tone="violet" />
        <StatCard label="Buyers" value={buyers} icon={<UserCheck className="w-4 h-4" />} tone="blue" />
        <StatCard label="Sellers" value={sellers} icon={<ShieldCheck className="w-4 h-4" />} tone="emerald" />
        <StatCard label="Administrators" value={admins} icon={<KeyRound className="w-4 h-4" />} tone="amber" />
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
                placeholder="Search by name, email, phone or store…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="ghost">
              Search
            </Button>
            {(query || role !== 'all' || status !== 'all') && (
              <Button
                type="button"
                variant="subtle"
                onClick={() => {
                  setSearchInput('');
                  setQuery('');
                  setRole('all');
                  setStatus('all');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </form>

          <div className="flex gap-2">
            <Select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as RoleFilter);
                setPage(1);
              }}
            >
              <option value="all">All roles</option>
              <option value="BUYER">Buyers</option>
              <option value="SELLER">Sellers</option>
              <option value="ADMIN">Admins</option>
            </Select>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="verified">Email verified</option>
              <option value="unverified">Unverified</option>
            </Select>
          </div>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading accounts…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">Account</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Store</th>
                  <th className="py-3 px-5">Activity</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              }
            >
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || '/images/logo.png'}
                        alt=""
                        className="w-8 h-8 rounded-xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <Badge
                      tone={user.role === 'ADMIN' ? 'amber' : user.role === 'SELLER' ? 'emerald' : 'blue'}
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    {user.store ? (
                      <span className="flex items-center gap-1.5">
                        {user.store.name}
                        {user.store.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                    <span className="block">{user.ordersCount} orders</span>
                    <span className="text-[10px]">
                      {user.loginCount} sign-ins
                      {user.lastLoginAt
                        ? ` · ${new Date(user.lastLoginAt).toLocaleDateString('en-NG')}`
                        : ''}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex flex-wrap gap-1">
                      {user.isBanned ? (
                        <Badge tone="rose">BANNED</Badge>
                      ) : user.isActive ? (
                        <Badge tone="emerald">Active</Badge>
                      ) : (
                        <Badge tone="slate">Inactive</Badge>
                      )}
                      {user.emailVerified && <Badge tone="blue">Verified</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" title="View" onClick={() => openDetail(user)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(user)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {user.isBanned ? (
                        <Button variant="ghost" size="sm" title="Unban" onClick={() => unban(user)}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ban"
                          onClick={() => {
                            setBanReason('Violation of Komback marketplace policy');
                            setBanTarget(user);
                          }}
                          disabled={user.role === 'ADMIN'}
                        >
                          <Ban className="w-3.5 h-3.5 text-amber-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" title="Force sign-out" onClick={() => revoke(user)}>
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No accounts match these filters.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
          </>
        )}
      </Card>

      {/* Create / edit */}
      <Modal
        open={Boolean(form)}
        title={form?.id ? `Edit ${form.email}` : 'Create account'}
        subtitle="Changes take effect immediately and are written to the audit trail."
        onClose={() => setForm(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={submitForm} loading={saving}>
              {form?.id ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        {form && (
          <form onSubmit={submitForm} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Email address">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller (merchant)</option>
                <option value="ADMIN">Administrator</option>
              </Select>
            </Field>
            <Field
              label={form.id ? 'New password (leave blank to keep current)' : 'Password'}
              hint="Minimum 8 characters."
            >
              <Input
                type="password"
                required={!form.id}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Field label="City / area">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>

            {form.role === 'SELLER' && !form.id && (
              <>
                <Field label="Store name" hint="Defaults to the account name.">
                  <Input
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    placeholder="e.g. Jenny Phones & Gadgets"
                  />
                </Field>
                <Field label="Store category">
                  <Select
                    value={form.storeCategorySlug}
                    onChange={(e) => setForm({ ...form, storeCategorySlug: e.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}

            <div className="sm:col-span-2 flex flex-wrap gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                  checked={form.emailVerified}
                  onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })}
                />
                Email verified
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Account active
              </label>
            </div>

            <div className="sm:col-span-2">
              <Field label="Internal notes" hint="Only visible to administrators.">
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

      {/* Detail */}
      <Modal
        open={Boolean(detail) || detailLoading}
        title="Account detail"
        subtitle={detail?.user.email}
        onClose={() => setDetail(null)}
        wide
      >
        {detailLoading && <Spinner label="Loading account…" />}
        {detail && !detailLoading && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Role</p>
                <p className="font-black text-slate-900 mt-0.5">{detail.user.role}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Orders</p>
                <p className="font-black text-slate-900 mt-0.5">{detail.user.ordersCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Sign-ins</p>
                <p className="font-black text-slate-900 mt-0.5">{detail.user.loginCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Joined</p>
                <p className="font-black text-slate-900 mt-0.5">
                  {new Date(detail.user.createdAt).toLocaleDateString('en-NG')}
                </p>
              </div>
            </div>

            {detail.user.isBanned && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                Banned{detail.user.bannedAt ? ` on ${new Date(detail.user.bannedAt).toLocaleString('en-NG')}` : ''}
                {detail.user.banReason ? ` — ${detail.user.banReason}` : ''}
              </div>
            )}

            {detail.wallet && (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Available</p>
                  <p className="font-black text-emerald-900 mt-0.5">
                    {formatNaira(detail.wallet.availableBalance)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">In escrow</p>
                  <p className="font-black text-amber-900 mt-0.5">
                    {formatNaira(detail.wallet.escrowLocked)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Settled</p>
                  <p className="font-black text-slate-900 mt-0.5">
                    {formatNaira(detail.wallet.totalSettled)}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-2">
                Active sessions ({detail.sessions.length})
              </p>
              <div className="space-y-1.5">
                {detail.sessions.length === 0 && <p className="text-xs text-slate-500">No active sessions.</p>}
                {detail.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                  >
                    <span className="font-mono text-slate-600 truncate">{session.ipAddress ?? 'unknown IP'}</span>
                    <span className="text-slate-400 truncate max-w-[220px]">{session.userAgent ?? '—'}</span>
                    <span className="text-slate-500 shrink-0">
                      {new Date(session.createdAt).toLocaleDateString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-2">
                Recent orders ({detail.orders.length})
              </p>
              <div className="space-y-1.5">
                {detail.orders.length === 0 && <p className="text-xs text-slate-500">No orders yet.</p>}
                {detail.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                  >
                    <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
                    <span className="text-slate-500 truncate">{order.store.name}</span>
                    <Badge tone={order.statusCode === 'RELEASED' ? 'emerald' : 'amber'}>{order.status}</Badge>
                    <span className="font-black text-slate-900">{formatNaira(order.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-2">
                Activity history ({detail.activity.length})
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {detail.activity.length === 0 && <p className="text-xs text-slate-500">No recorded activity.</p>}
                {detail.activity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                  >
                    <span className="text-slate-400 shrink-0 w-28">
                      {new Date(entry.createdAt).toLocaleString('en-NG', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="font-bold text-slate-800 shrink-0 w-40 truncate">{entry.action}</span>
                    <span className="text-slate-600 truncate">{entry.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Ban */}
      <Modal
        open={Boolean(banTarget)}
        title={`Ban ${banTarget?.name ?? ''}`}
        subtitle="The account is signed out everywhere immediately and its storefront is suspended."
        onClose={() => setBanTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBanTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmBan} loading={busyAction}>
              <Ban className="w-3.5 h-3.5" />
              Ban account
            </Button>
          </>
        }
      >
        <Field label="Reason (shown to the user when they try to sign in)">
          <Textarea rows={3} value={banReason} onChange={(e) => setBanReason(e.target.value)} />
        </Field>
      </Modal>

      {/* Delete */}
      <Modal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name ?? ''}?`}
        subtitle="This cannot be undone."
        onClose={() => {
          setDeleteTarget(null);
          setDeleteStore(false);
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteStore(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={busyAction}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            The account and all of its sessions are removed. Orders and reviews are kept for
            financial records but detached from the account.
          </p>
          {deleteTarget?.store && (
            <label className="flex items-start gap-2 font-bold text-slate-700 p-3 rounded-xl bg-rose-50 border border-rose-200">
              <input
                type="checkbox"
                className="w-4 h-4 accent-rose-600 mt-0.5"
                checked={deleteStore}
                onChange={(e) => setDeleteStore(e.target.checked)}
              />
              <span>
                Also delete the store <strong>{deleteTarget.store.name}</strong> with all of its
                listings, orders, wallet balance and conversations.
              </span>
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
};
