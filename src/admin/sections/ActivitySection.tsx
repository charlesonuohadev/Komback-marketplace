import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Filter, Search } from 'lucide-react';
import { adminApi, AdminApiError, type AdminActivityEntry } from '../adminApi';
import { AUDIT_CATEGORIES, AUDIT_CATEGORY_LABEL, auditLabel, auditTone } from '../auditLabels';
import {
  Badge,
  BarList,
  Button,
  Card,
  DataTable,
  ErrorNote,
  Input,
  Modal,
  Pagination,
  SectionHeader,
  Select,
  Spinner,
  StatCard,
} from '../ui';

export const ActivitySection: React.FC<{
  initialParams: URLSearchParams;
  notify: (message: string, tone?: 'success' | 'error') => void;
}> = ({ initialParams, notify }) => {
  const [entries, setEntries] = useState<AdminActivityEntry[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminActivityEntry | null>(null);

  const [category, setCategory] = useState(initialParams.get('category') ?? '');
  const [entityId, setEntityId] = useState(initialParams.get('entityId') ?? '');
  const [query, setQuery] = useState(initialParams.get('q') ?? '');
  const [searchInput, setSearchInput] = useState(initialParams.get('q') ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.activity({
        page,
        limit: 40,
        category: category || undefined,
        entityId: entityId || undefined,
        q: query || undefined,
      });
      setEntries(res.items);
      setCategoryTotals(res.categoryTotals);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Could not load the activity log');
    } finally {
      setLoading(false);
    }
  }, [page, category, entityId, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Activity & audit trail"
        subtitle="Every sign-in, listing, order, payment, moderation action and admin change — permanently recorded."
        actions={
          <Button variant="ghost" onClick={load} loading={loading}>
            <Activity className="w-3.5 h-3.5" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <StatCard label="Recorded events" value={total} icon={<Activity className="w-4 h-4" />} tone="violet" />
          <StatCard
            label="Categories"
            value={categoryTotals.length}
            icon={<Filter className="w-4 h-4" />}
            tone="blue"
          />
        </div>
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Events per category" />
          <BarList
            items={categoryTotals
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((row) => ({
                label: AUDIT_CATEGORY_LABEL[row.category] ?? row.category,
                value: row.count,
              }))}
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
                placeholder="Search action, actor email or description…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="ghost">
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {AUDIT_CATEGORIES.map((name) => (
                <option key={name} value={name}>
                  {AUDIT_CATEGORY_LABEL[name]}
                </option>
              ))}
            </Select>
            {(category || query || entityId) && (
              <Button
                variant="subtle"
                onClick={() => {
                  setCategory('');
                  setQuery('');
                  setSearchInput('');
                  setEntityId('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <ErrorNote message={error} onRetry={load} />

        {loading ? (
          <Spinner label="Loading activity…" />
        ) : (
          <>
            <DataTable
              head={
                <tr>
                  <th className="py-3 px-5">When</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Actor</th>
                  <th className="py-3 px-5">Detail</th>
                  <th className="py-3 px-5 text-right">Inspect</th>
                </tr>
              }
            >
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 align-top">
                  <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString('en-NG', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-5">
                    <Badge tone={auditTone(entry.category)}>
                      {AUDIT_CATEGORY_LABEL[entry.category] ?? entry.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 font-bold text-slate-900">{auditLabel(entry.action)}</td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block truncate max-w-[180px]">
                      {entry.actorName ?? entry.actorEmail ?? 'Guest'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {entry.actorRole ?? 'GUEST'}
                      {entry.ipAddress ? ` · ${entry.ipAddress}` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    <span className="block max-w-[320px]">{entry.description || '—'}</span>
                    {entry.entityType && (
                      <span className="text-[10px] text-slate-400">
                        {entry.entityType}
                        {entry.entityId ? ` · ${entry.entityId}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(entry)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No activity matches these filters.
                  </td>
                </tr>
              )}
            </DataTable>
            <Pagination page={page} pages={pages} total={total} limit={40} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(detail)}
        title={detail ? auditLabel(detail.action) : 'Event'}
        subtitle={detail ? new Date(detail.createdAt).toLocaleString('en-NG') : undefined}
        onClose={() => setDetail(null)}
        wide
        footer={
          <Button variant="ghost" onClick={() => setDetail(null)}>
            Close
          </Button>
        }
      >
        {detail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Action key', detail.action],
                ['Category', AUDIT_CATEGORY_LABEL[detail.category] ?? detail.category],
                ['Actor', detail.actorName ?? '—'],
                ['Actor email', detail.actorEmail ?? '—'],
                ['Actor role', detail.actorRole ?? 'GUEST'],
                ['IP address', detail.ipAddress ?? '—'],
                ['Entity', detail.entityType ? `${detail.entityType} ${detail.entityId ?? ''}` : '—'],
                ['Description', detail.description || '—'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
                  <p className="font-medium text-slate-800 break-all mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {detail.userAgent && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-500">User agent</p>
                <p className="font-mono text-[10px] text-slate-600 break-all mt-0.5">{detail.userAgent}</p>
              </div>
            )}

            {detail.metadata ? (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Recorded payload
                </p>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[10px] overflow-x-auto">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {detail.entityId && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    setEntityId(detail.entityId as string);
                    setDetail(null);
                    setPage(1);
                  }}
                >
                  Show every event for this record
                </Button>
              )}
              {detail.actorId && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    notify(`Actor ${detail.actorEmail ?? detail.actorId}`);
                    setQuery(detail.actorEmail ?? '');
                    setSearchInput(detail.actorEmail ?? '');
                    setDetail(null);
                    setPage(1);
                  }}
                >
                  Filter by this actor
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
