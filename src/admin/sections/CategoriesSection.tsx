import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { adminApi, AdminApiError, type AdminCategory } from '../adminApi';
import {
  Badge,
  Button,
  Card,
  DataTable,
  ErrorNote,
  Field,
  Input,
  Modal,
  SectionHeader,
  Spinner,
  Textarea,
} from '../ui';

interface CategoryForm {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  popularSubcategories: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY: CategoryForm = {
  name: '',
  slug: '',
  icon: '📦',
  image: '',
  description: '',
  popularSubcategories: '',
  sortOrder: '99',
  isActive: true,
};

export const CategoriesSection: React.FC<{
  notify: (message: string, tone?: 'success' | 'error') => void;
  onChanged: () => void;
}> = ({ notify, onChanged }) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.categories.list();
      setCategories(res.categories);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        icon: form.icon,
        image: form.image,
        description: form.description,
        popularSubcategories: form.popularSubcategories,
        sortOrder: Number.parseInt(form.sortOrder, 10) || 99,
        isActive: form.isActive,
      };

      if (form.id) {
        await adminApi.categories.update(form.id, payload);
        notify(`Updated category ${form.name}`);
      } else {
        await adminApi.categories.create(payload);
        notify(`Created category ${form.name}`);
      }
      setForm(null);
      await load();
      onChanged();
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (force: boolean) => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.categories.remove(deleteTarget.id, force);
      notify(`Deleted category ${deleteTarget.name}`);
      setDeleteTarget(null);
      await load();
      onChanged();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Categories"
        subtitle="The taxonomy that drives storefront navigation and listing assignment."
        actions={
          <Button
            onClick={() => {
              setFormError(null);
              setForm({ ...EMPTY });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            New category
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <ErrorNote message={error} onRetry={load} />
        {loading ? (
          <Spinner label="Loading categories…" />
        ) : (
          <DataTable
            head={
              <tr>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Slug</th>
                <th className="py-3 px-5">Subcategories</th>
                <th className="py-3 px-5">Usage</th>
                <th className="py-3 px-5">Order</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            }
          >
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{category.icon}</span>
                    <div>
                      <p className="font-bold text-slate-900">{category.name}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[260px]">
                        {category.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-5 font-mono text-[11px] text-slate-600">{category.slug}</td>
                <td className="py-3 px-5 text-slate-600">
                  <span className="block truncate max-w-[200px]">
                    {category.popularSubcategories.slice(0, 4).join(', ') || '—'}
                  </span>
                </td>
                <td className="py-3 px-5 whitespace-nowrap">
                  <span className="block font-bold text-slate-800">
                    {category.productCount} listings
                  </span>
                  <span className="text-[10px] text-slate-500">{category.storeCount} stores</span>
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    <Badge tone={category.isActive ? 'emerald' : 'slate'}>
                      {category.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                    <span className="text-[10px] text-slate-500">#{category.sortOrder}</span>
                  </div>
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Edit"
                      onClick={() => {
                        setFormError(null);
                        setForm({
                          id: category.id,
                          name: category.name,
                          slug: category.slug,
                          icon: category.icon,
                          image: category.image,
                          description: category.description,
                          popularSubcategories: category.popularSubcategories.join('\n'),
                          sortOrder: String(category.sortOrder),
                          isActive: category.isActive,
                        });
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Delete"
                      onClick={() => setDeleteTarget(category)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </DataTable>
        )}
      </Card>

      <Modal
        open={Boolean(form)}
        title={form?.id ? `Edit ${form.name}` : 'New category'}
        onClose={() => setForm(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              <Tags className="w-3.5 h-3.5" />
              {form?.id ? 'Save category' : 'Create category'}
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Slug" hint="Leave blank to generate from the name.">
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label="Icon (emoji)">
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </Field>
            <Field label="Sort order" hint="Lower numbers appear first.">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Cover image URL">
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Popular subcategories" hint="One per line.">
                <Textarea
                  rows={4}
                  value={form.popularSubcategories}
                  onChange={(e) => setForm({ ...form, popularSubcategories: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Visible in storefront navigation
              </label>
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
        title={`Delete ${deleteTarget?.name ?? ''}?`}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            {deleteTarget && deleteTarget.productCount > 0 && (
              <Button variant="danger" loading={busy} onClick={() => confirmDelete(true)}>
                Delete and detach {deleteTarget.productCount} listing(s)
              </Button>
            )}
            <Button variant="danger" loading={busy} onClick={() => confirmDelete(false)}>
              Delete category
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          {deleteTarget && deleteTarget.productCount > 0
            ? `${deleteTarget.productCount} listing(s) and ${deleteTarget.storeCount} store(s) currently use this category. Deleting it will fail unless you force it — the listings would be left without a category. Move them first if you can.`
            : 'This category is not in use and can be deleted safely.'}
        </p>
      </Modal>
    </div>
  );
};
