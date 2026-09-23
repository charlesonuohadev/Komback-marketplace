import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  Eye, 
  Clock, 
  ArrowUpRight, 
  ShieldCheck, 
  Truck, 
  Plus, 
  RefreshCw,
  Wallet,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Store as StoreIcon
} from 'lucide-react';
import { Product, Store, PageType } from '../../types';
import { api, type SellerStats } from '../../lib/api';
import { formatNaira } from '../../utils/formatters';
import { SellerDashboardTab } from './SellerSidebar';

interface SellerOverviewProps {
  store: Store;
  products: Product[];
  setActiveTab: (tab: SellerDashboardTab) => void;
  openAddProductModal: () => void;
  onViewProduct: (product: Product) => void;
  setCurrentPage: (page: PageType) => void;
}

export const SellerOverview: React.FC<SellerOverviewProps> = ({
  store,
  products,
  setActiveTab,
  openAddProductModal,
  onViewProduct,
  setCurrentPage
}) => {
  const sellerProducts = products.filter(p => p.seller.id === store.id || p.seller.name === store.name);
  const displayProducts = sellerProducts;

  // Sales, escrow and traffic figures are aggregated by the API from PostgreSQL.
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.seller.stats();
        if (!cancelled) {
          setStats(res.stats);
          setStatsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setStatsError(err instanceof Error ? err.message : 'Could not load dashboard metrics');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const totalRevenue = stats?.totalRevenue ?? 0;
  const pendingEscrow = stats?.pendingEscrow ?? 0;
  const availablePayout = stats?.availablePayout ?? 0;
  const completedOrders = stats?.completedOrders ?? 0;
  const weeklySalesData = stats?.weeklySalesData ?? [];
  const maxWeeklyAmount = Math.max(1, ...weeklySalesData.map(d => d.amount));

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Top Banner Notice: Verified Merchant */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold mb-2 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Komback Escrow & MultiVendor Verified Merchant</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
              Welcome back, {store.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Manage your listings, fulfill buyer orders, and release your escrow payouts securely upon delivery inspection and PIN verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('orders')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Orders</span>
            </button>
            <button
              onClick={openAddProductModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {statsError && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl">
          {statsError}
        </p>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Sales (30d)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ₦
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {formatNaira(totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Released escrow, all time</span>
          </div>
        </div>

        {/* Metric 2: Escrow Locked */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Escrow In-Transit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {formatNaira(pendingEscrow)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            Pending buyer PIN inspection
          </div>
        </div>

        {/* Metric 3: Available Payout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Available for Payout</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {formatNaira(availablePayout)}
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="text-[11px] text-blue-600 font-extrabold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Request Bank Transfer</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 4: Orders & Waybills */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Fulfilled Waybills</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {completedOrders} Orders
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {stats ? 'Verified by buyer inspection PIN' : 'Loading…'}
          </div>
        </div>
      </div>

      {/* Analytics & Quick Action Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Bar Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Weekly Revenue Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Escrow verified orders across Nigerian corridors
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              7 Days Active
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full overflow-hidden">
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-3 pt-6 px-1 border-b border-slate-100">
              {weeklySalesData.map((bar) => {
                const heightPct = Math.round((bar.amount / maxWeeklyAmount) * 100);
                return (
                  <div key={bar.day} className="flex-1 min-w-0 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                      {formatNaira(bar.amount)}
                    </div>
                    <div className="w-full max-w-[36px] sm:max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden h-32 flex items-end">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-emerald-600 group-hover:bg-emerald-500 rounded-t-xl transition-all duration-500"
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-600">{bar.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 mt-2 text-center">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Total 7d Volume</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">{formatNaira(stats?.totalVolume ?? 0)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Avg. Order Value</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">{formatNaira(stats?.avgOrderValue ?? 0)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Listing Views</div>
              <div className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5 truncate">{(stats?.storeVisits ?? 0).toLocaleString()} Views</div>
            </div>
          </div>
        </div>

        {/* Quick Tools & Shortcuts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mb-1">
              Seller Dispatch Tools
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Instant management actions for your digital store
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => setActiveTab('logistics')}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Generate Courier Waybill</div>
                    <div className="text-[10px] text-slate-500">GIG Logistics, Speedaf, DHL</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('logistics')}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Verify Buyer Inspection PIN</div>
                    <div className="text-[10px] text-slate-500">Release escrow payout instantly</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('shop')}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Customize Digital Shop</div>
                    <div className="text-[10px] text-slate-500">Banner, WhatsApp, Bank Setup</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Public Store Link:</span>
            <span className="font-mono text-emerald-700 font-bold">/store/{store.id}</span>
          </div>
        </div>
      </div>

      {/* Live Marketplace Products Snapshot */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Active Store Listings ({displayProducts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live marketplace listings displayed to verified buyers across Nigeria
            </p>
          </div>

          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Products</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayProducts.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-full h-32 object-cover rounded-xl bg-slate-100 mb-3"
                />
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {p.category}
                </span>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-1.5" title={p.title}>
                  {p.title}
                </h3>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs font-black text-slate-900">
                  {formatNaira(p.price)}
                </div>
                <button
                  onClick={() => onViewProduct(p)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
