import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  DownloadCloud,
  Globe,
  RefreshCw,
  Server,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Product } from '../../types';

interface SellerWooCommerceProps {
  products: Product[];
  onSyncComplete: (newProducts: Product[]) => void;
}

const BASE_URL_KEY = 'komback_woocommerce_base_url';
const LAST_SYNC_KEY = 'komback_last_sync_timestamp';

/**
 * Imports the live komback.com (WooCommerce / Dokan) catalog into PostgreSQL.
 *
 * The request is made server-side so the storefront API is only ever contacted
 * from your own hosting, and every imported listing is written straight into the
 * `Product` table. Nothing is cached in the browser.
 */
export const SellerWooCommerce: React.FC<SellerWooCommerceProps> = ({
  products,
  onSyncComplete,
}) => {
  const [baseUrl, setBaseUrl] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem(BASE_URL_KEY) : null) ?? 'https://komback.com'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null
  );

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatus('Contacting the komback.com storefront API…');
    setSyncError(null);
    setSyncedCount(null);

    try {
      const res = await api.seller.syncWooCommerce(baseUrl);
      onSyncComplete(res.products);

      const now = new Date().toISOString();
      localStorage.setItem(BASE_URL_KEY, baseUrl);
      localStorage.setItem(LAST_SYNC_KEY, now);

      setSyncedCount(res.synced);
      setLastSyncTime(now);
      setSyncStatus(`Imported ${res.synced} listings into PostgreSQL.`);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Import failed');
      setSyncStatus(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold mb-2 border border-emerald-500/30">
              <Server className="w-3.5 h-3.5" />
              <span>WordPress / WooCommerce &amp; Dokan Importer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
              Import your storefront catalog
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Pulls live products from the komback.com REST API and writes them into your
              PostgreSQL catalog. Existing listings are updated in place by slug.
            </p>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || !baseUrl.trim()}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Importing…' : 'Import catalog now'}</span>
          </button>
        </div>
      </div>

      {/* Status */}
      {syncStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
          <span>{syncStatus}</span>
        </div>
      )}

      {syncError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-bold text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-px" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Listings in your store</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {products.length} items
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Last import</span>
            <DownloadCloud className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-black text-slate-900 mt-2.5">{formattedLastSync}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Last batch</span>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {syncedCount === null ? '—' : `${syncedCount} imported`}
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mb-1">
          Storefront connection
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          The importer tries the public Store API first, then the authenticated v3 and Dokan
          endpoints.
        </p>

        <label className="block text-xs font-bold text-slate-700 mb-1">Store base URL</label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://komback.com"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
        />

        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Endpoints attempted, in order
          </div>
          {[
            { path: '/wp-json/wc/store/v1/products', note: 'Public Store API (prices in kobo)' },
            { path: '/wp-json/wc/v3/products', note: 'Authenticated v3 REST API (prices in Naira)' },
            { path: '/wp-json/dokan/v1/products', note: 'Dokan multi-vendor catalog' },
          ].map((endpoint) => (
            <div
              key={endpoint.path}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80"
            >
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-bold text-slate-800 truncate">
                  {endpoint.path}
                </div>
                <div className="text-[10px] text-slate-500">{endpoint.note}</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
          If the storefront API cannot be reached or returns no products, the import fails with
          the exact reason. No placeholder listings are ever generated.
        </p>
      </div>
    </div>
  );
};
