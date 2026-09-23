import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, FileText, MessageSquareQuote, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { adminApi, AdminApiError, type AdminBlogPost, type AdminReview } from '../adminApi';
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
} from '../ui';

interface PostForm {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  tags: string;
  readTime: string;
  authorName: string;
  authorRole: string;
  isPublished: boolean;
}

const EMPTY_POST: PostForm = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Marketplace',
  image: '',
  tags: '',
  readTime: '4 min read',
  authorName: 'Komback Editorial',
  authorRole: 'Marketplace Desk',
  isPublished: true,
};

export const ContentSection: React.FC<{
  initialParams: URLSearchParams;
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ initialParams, notify }) => {
  const [tab, setTab] = useState<'blog' | 'reviews'>(
    initialParams.get('tab') === 'reviews' ? 'reviews' : 'blog'
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Content & reviews"
        subtitle="Publish editorial content and moderate buyer reviews."
        actions={
          <div className="flex bg-slate-100 rounded-xl p-1 text-[11px] font-bold">
            <button
              onClick={() => setTab('blog')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                tab === 'blog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Blog
            </button>
            <button
              onClick={() => setTab('reviews')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                tab === 'reviews' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Reviews
            </button>
          </div>
        }
      />

      {tab === 'blog' ? <BlogPanel notify={notify} /> : <ReviewsPanel notify={notify} />}
    </div>
  );
};

// ---------------------------------------------------------------------------

const BlogPanel: React.FC<{ notify: (message: string, tone?: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogPost | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.blog.list();
      setPosts(res.posts);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load articles');
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
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        image: form.image,
        tags: form.tags,
        readTime: form.readTime,
        authorName: form.authorName,
        authorRole: form.authorRole,
        isPublished: form.isPublished,
      };
      if (form.id) {
        await adminApi.blog.update(form.id, payload);
        notify(`Updated article "${form.title}"`);
      } else {
        await adminApi.blog.create(payload);
        notify(`Published article "${form.title}"`);
      }
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post: AdminBlogPost) => {
    try {
      await adminApi.blog.update(post.id, { isPublished: !post.isPublished });
      notify(`${!post.isPublished ? 'Published' : 'Unpublished'} "${post.title}"`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Update failed', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.blog.remove(deleteTarget.id);
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
    <>
      <Card className="overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">{posts.length} article(s)</p>
          <Button
            onClick={() => {
              setFormError(null);
              setForm({ ...EMPTY_POST });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            New article
          </Button>
        </div>
        <ErrorNote message={error} onRetry={load} />
        {loading ? (
          <Spinner label="Loading articles…" />
        ) : (
          <DataTable
            head={
              <tr>
                <th className="py-3 px-5">Article</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Author</th>
                <th className="py-3 px-5">Published</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            }
          >
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.image || '/images/logo.png'}
                      alt=""
                      className="w-10 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate max-w-[280px]">{post.title}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[280px]">{post.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-5 text-slate-600">{post.category}</td>
                <td className="py-3 px-5 text-slate-600">
                  <span className="block truncate max-w-[140px]">{post.authorName}</span>
                </td>
                <td className="py-3 px-5">
                  <div className="flex flex-col gap-1">
                    <Badge tone={post.isPublished ? 'emerald' : 'slate'}>
                      {post.isPublished ? 'Live' : 'Draft'}
                    </Badge>
                    <span className="text-[10px] text-slate-500">
                      {new Date(post.publishedAt).toLocaleDateString('en-NG')}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={post.isPublished ? 'Unpublish' : 'Publish'}
                      onClick={() => togglePublish(post)}
                    >
                      {post.isPublished ? (
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Edit"
                      onClick={() => {
                        setFormError(null);
                        setForm({
                          id: post.id,
                          title: post.title,
                          excerpt: post.excerpt,
                          content: post.content,
                          category: post.category,
                          image: post.image,
                          tags: post.tags.join('\n'),
                          readTime: post.readTime,
                          authorName: post.authorName,
                          authorRole: post.authorRole,
                          isPublished: post.isPublished,
                        });
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(post)}>
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  No articles yet.
                </td>
              </tr>
            )}
          </DataTable>
        )}
      </Card>

      <Modal
        open={Boolean(form)}
        title={form?.id ? 'Edit article' : 'New article'}
        onClose={() => setForm(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {form?.id ? 'Save article' : 'Publish article'}
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
            <div className="sm:col-span-2">
              <Field label="Excerpt" hint="Shown in listings and search results.">
                <Textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Body" hint="Markdown-style headings (### ) are supported by the reader.">
                <Textarea
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Category">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <Field label="Read time">
              <Input value={form.readTime} onChange={(e) => setForm({ ...form, readTime: e.target.value })} />
            </Field>
            <Field label="Author name">
              <Input
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              />
            </Field>
            <Field label="Author role">
              <Input
                value={form.authorRole}
                onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Cover image URL">
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Tags" hint="One per line.">
                <Textarea rows={3} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Published and visible on the storefront
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
        title={`Delete "${deleteTarget?.title ?? ''}"?`}
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={busy}>
              Delete article
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">This permanently removes the article from the blog.</p>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------

const ReviewsPanel: React.FC<{ notify: (message: string, tone?: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.reviews.list({
        page,
        limit: 25,
        status: status || undefined,
        q: query || undefined,
      });
      setReviews(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const setHidden = async (review: AdminReview, isHidden: boolean) => {
    try {
      await adminApi.reviews.setHidden(review.id, isHidden);
      notify(`${isHidden ? 'Hid' : 'Restored'} review by ${review.author}`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Update failed', 'error');
    }
  };

  const remove = async (review: AdminReview) => {
    try {
      await adminApi.reviews.remove(review.id);
      notify(`Deleted review by ${review.author}`);
      await load();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Delete failed', 'error');
    }
  };

  return (
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
              placeholder="Search review text, author or product…"
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
          <option value="">All reviews</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </Select>
      </div>

      <ErrorNote message={error} onRetry={load} />

      {loading ? (
        <Spinner label="Loading reviews…" />
      ) : (
        <>
          <DataTable
            head={
              <tr>
                <th className="py-3 px-5">Review</th>
                <th className="py-3 px-5">Listing</th>
                <th className="py-3 px-5">Rating</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            }
          >
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-5">
                  <p className="font-bold text-slate-900">{review.author}</p>
                  <p className="text-[11px] text-slate-600 max-w-[340px]">{review.comment}</p>
                  <p className="text-[10px] text-slate-400">
                    {review.location} · {review.date}
                  </p>
                </td>
                <td className="py-3 px-5 text-slate-600">
                  <span className="block truncate max-w-[180px]">{review.product?.title ?? '—'}</span>
                </td>
                <td className="py-3 px-5">
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {review.rating}
                  </span>
                </td>
                <td className="py-3 px-5">
                  <Badge tone={review.isHidden ? 'rose' : 'emerald'}>
                    {review.isHidden ? 'Hidden' : 'Visible'}
                  </Badge>
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={review.isHidden ? 'Restore' : 'Hide'}
                      onClick={() => setHidden(review, !review.isHidden)}
                    >
                      {review.isHidden ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" title="Delete" onClick={() => remove(review)}>
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  No reviews match these filters.
                </td>
              </tr>
            )}
          </DataTable>
          <Pagination page={page} pages={pages} total={total} limit={25} onPage={setPage} />
        </>
      )}
    </Card>
  );
};
