import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Search, Sparkles, Trash2 } from 'lucide-react';
import { adminApi, AdminApiError, type AdminListing } from '../adminApi';
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

interface ListingForm {
  id: string;
  title: string;
  price: string;
  badge: string;
  status: 'DRAFT' | 'ACTIVE' | 'SOLD' | 'ARCHIVED';
  isHidden: boolean;
  isFeaturedAd: boolean;
  featuredBadgeText: string;
  adminNotes: string;
}

export const ListingsSection: React.FC<{
  initialParams: URLSearchParams;
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ initialParams, notify }) => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState(initialParams.get('q') ?? '');
  const [searchInput, setSearchInput] = useState(initialParams.get('q') ?? '');
  const [status, setStatus] = useState(initialParams.get('status') ?? '');

  const [form, setForm] = useState<ListingForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminListing | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.products.list({
        page,
        limit: 25,
        q: query || undefined,
        status: status || undefined,
      });
      setListings(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load listings');
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (listing: AdminListing) => {
    setFormError(null);
    setForm({
      id: listing.id,
      title: listing.title,
      price: String(listing.price),
      badge: '',
      status: listing.status,
      isHidden: listing.isHidden,
      isFeaturedAd: Boolean(listing.isFeaturedAd),
      featuredBadgeText: listing.featuredBadgeText ?? '',
      adminNotes: listing.adminNotes ?? '',
    });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      await adminApi.products.update(form.id, {
        title: form.title,
        price: Number.parseInt(form.price, 10),
        status: form.status,
        isHidden: form.isHidden,
        isFeaturedAd: form.isFeaturedAd,
        featuredBadgeText: form.featuredBadgeText,
        adminNotes: form.adminNotes,
      });
      notify(`Listing "${form.title}" updated`);
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleHidden = async (listing: AdminListing) => {
    try {
      await adminApi.products.update(listing.id, { isHidden: !listing.isHidden });
      notify(`${!listing.isHidden ? 'Hidden' : 'Published'} "${listing.title}"`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Update failed', 'error');
    }
  };

  const toggleFeatured = async (listing: AdminListing) => {
    const next = !listing.isFeaturedAd;
    try {
      await adminApi.products.update(listing.id, {
        isFeaturedAd: next,
        featuredBadgeText: next ? 'Sponsored' : '',
      });
      notify(
        next ? `"${listing.title}" is now a sponsored placement` : `Removed sponsorship from "${listing.title}"`
      );
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Update failed', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.products.remove(deleteTarget.id);
      notify(`Deleted "${deleteTarget.title}"`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Listing moderation"
        subtitle="Hide, feature, edit or delete any product across every store."
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
                placeholder="Search listing title, slug or store…"
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
            <option value="">Any listing</option>
            <option value="hidden">Hidden only</option>
            <option value="visible">Visible only</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="SOLD">Sold</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading listings…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">Listing</th>
                  <th className="py-3 px-5">Store</th>
                  <th className="py-3 px-5">Price</th>
                  <th className="py-3 px-5">Reach</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              }
            >
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={listing.images[0] || '/images/logo.png'}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-[240px]">{listing.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {listing.category} · {listing.state}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block truncate max-w-[150px]">{listing.seller.name}</span>
                  </td>
                  <td className="py-3 px-5 font-black text-slate-900 whitespace-nowrap">
                    {formatNaira(listing.price)}
                  </td>
                  <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                    <span className="block">{listing.views} views</span>
                    <span className="text-[10px]">
                      {listing.rating.toFixed(1)}★ · {listing.reviewsCount} reviews
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={listing.status === 'ACTIVE' ? 'emerald' : 'slate'}>{listing.status}</Badge>
                      {listing.isHidden && <Badge tone="rose">HIDDEN</Badge>}
                      {listing.isFeaturedAd && <Badge tone="violet">SPONSORED</Badge>}
                      {!listing.inStock && <Badge tone="amber">Out of stock</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title={listing.isHidden ? 'Publish' : 'Hide'}
                        onClick={() => toggleHidden(listing)}
                      >
                        {listing.isHidden ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={listing.isFeaturedAd ? 'Remove sponsorship' : 'Feature as sponsored'}
                        onClick={() => toggleFeatured(listing)}
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${
                            listing.isFeaturedAd ? 'text-violet-600' : 'text-slate-400'
                          }`}
                        />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(listing)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete permanently"
                        onClick={() => setDeleteTarget(listing)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No listings match these filters.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(form)}
        title="Moderate listing"
        onClose={() => setForm(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save listing
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Title">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
            </div>
            <Field label="Price (₦)">
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ListingForm['status'] })}
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="SOLD">Sold</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
            <Field label="Sponsored badge text" hint="Shown when the listing is featured.">
              <Input
                value={form.featuredBadgeText}
                onChange={(e) => setForm({ ...form, featuredBadgeText: e.target.value })}
                placeholder="Sponsored"
              />
            </Field>
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-rose-600"
                  checked={form.isHidden}
                  onChange={(e) => setForm({ ...form, isHidden: e.target.checked })}
                />
                Hidden from the marketplace
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-violet-600"
                  checked={form.isFeaturedAd}
                  onChange={(e) => setForm({ ...form, isFeaturedAd: e.target.checked })}
                />
                Feature as a sponsored placement
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
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.title ?? ''}"?`}
        subtitle="This permanently removes the listing and its reviews. Prefer hiding unless it must be erased."
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={busy}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Consider <strong>hiding</strong> the listing instead so the seller keeps their history and the
          decision remains reversible.
        </p>
      </Modal>
    </div>
  );
};
