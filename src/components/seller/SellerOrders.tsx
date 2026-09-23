import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  ExternalLink, 
  Printer, 
  ArrowRight,
  Filter,
  Search,
  Key,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatNaira } from '../../utils/formatters';
import { PageType } from '../../types';

export interface SellerOrder {
  id: string;
  itemTitle: string;
  itemImage: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCityState: string;
  amount: number;
  date: string;
  status: 'Escrow Secured' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Released';
  courier: 'GIG Logistics' | 'Speedaf Express' | 'DHL Express Nigeria';
  waybillNumber: string;
  pinRequired: boolean;
  pinVerified: boolean;
  escrowReleaseDate?: string;
}

interface SellerOrdersProps {
  setCurrentPage: (page: PageType) => void;
  onOpenLogisticsTool?: (orderId: string) => void;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({
  setCurrentPage,
  onOpenLogisticsTool
}) => {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Orders are read from PostgreSQL for the signed-in merchant's storefront.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.orders.sellerOrders();
        if (!cancelled) setOrders(res.orders);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not load orders');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Escrow Secured' | 'Dispatched' | 'Delivered' | 'Released'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePinModalOrder, setActivePinModalOrder] = useState<SellerOrder | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.waybillNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleMarkDispatched = async (orderId: string) => {
    try {
      const res = await api.orders.updateStatus(orderId, { status: 'Dispatched' });
      setOrders((prev) => prev.map((order) => (order.id === res.order.id ? res.order : order)));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not dispatch this order');
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.length !== 4) {
      setPinError('Please enter the 4-digit buyer inspection PIN.');
      return;
    }

    if (!activePinModalOrder) return;

    try {
      const res = await api.orders.verifyPin(activePinModalOrder.id, enteredPin);
      setOrders((prev) => prev.map((order) => (order.id === res.order.id ? res.order : order)));
      setActivePinModalOrder(null);
      setEnteredPin('');
      setPinError('');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Could not verify the PIN');
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Escrow Protected Delivery Pipeline</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Customer Orders & Waybill Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track courier transit, manage waybills, and release escrow payouts upon delivery PIN verification.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('track-order')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Open Courier Tracker</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or waybill number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('Escrow Secured')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'Escrow Secured' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Dispatch
          </button>
          <button
            onClick={() => setStatusFilter('Dispatched')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'Dispatched' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Transit
          </button>
          <button
            onClick={() => setStatusFilter('Delivered')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'Delivered' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading && (
          <p className="text-xs font-bold text-slate-500 text-center py-10">Loading your orders…</p>
        )}
        {errorMessage && (
          <p className="text-xs font-bold text-rose-600 text-center py-4 bg-rose-50 rounded-2xl">
            {errorMessage}
          </p>
        )}
        {!isLoading && filteredOrders.length === 0 && (
          <p className="text-xs font-bold text-slate-500 text-center py-10">
            No orders match this filter yet.
          </p>
        )}
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-emerald-500/40 transition-all"
          >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm text-slate-900 font-mono">
                  {ord.id}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Order Placed: {ord.date}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-700">{ord.courier}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    ord.status === 'Delivered' || ord.status === 'Released'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ord.status === 'Dispatched'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{ord.status}</span>
                </span>
              </div>
            </div>

            {/* Main content row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
              {/* Product item */}
              <div className="flex items-center gap-4">
                <img
                  src={ord.itemImage}
                  alt={ord.itemTitle}
                  className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {ord.itemTitle}
                  </h4>
                  <div className="text-sm font-black text-slate-900 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                    {formatNaira(ord.amount)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    100% In Escrow
                  </div>
                </div>
              </div>

              {/* Buyer & Destination */}
              <div className="text-xs space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Customer & Delivery Address
                </div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ord.buyerName}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ord.buyerPhone}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{ord.buyerAddress}, {ord.buyerCityState}</span>
                </div>
              </div>

              {/* Waybill & Handover PIN Status */}
              <div className="text-xs space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Waybill & Payout Release
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                    {ord.waybillNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ord.escrowReleaseDate}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <div className={`text-[11px] font-bold flex items-center gap-1 ${ord.pinVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <Key className="w-3.5 h-3.5" />
                    <span>{ord.pinVerified ? 'PIN Verified (Escrow Released)' : 'Awaiting 4-Digit Buyer PIN'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${ord.buyerPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Buyer</span>
                </a>
                <a
                  href={`https://wa.me/${ord.buyerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>WhatsApp Message</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                {ord.status === 'Escrow Secured' && (
                  <button
                    onClick={() => handleMarkDispatched(ord.id)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch & Handover</span>
                  </button>
                )}

                {!ord.pinVerified && (
                  <button
                    onClick={() => {
                      setActivePinModalOrder(ord);
                      setEnteredPin('');
                      setPinError('');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Enter Buyer PIN</span>
                  </button>
                )}

                <button
                  onClick={() => setCurrentPage('track-order')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Live Waybill Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Buyer PIN Verification Modal */}
      {activePinModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Verify Buyer Inspection PIN
                </h3>
                <p className="text-xs text-slate-500">Order: {activePinModalOrder.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When the buyer inspects the package at delivery, they provide their confidential 4-digit code. Submitting it releases <strong>{formatNaira(activePinModalOrder.amount)}</strong> from escrow directly into your available balance.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 4-Digit Handover PIN *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="e.g. 7492"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  className="w-full text-center tracking-[1em] text-2xl font-black py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePinModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Confirm & Release Escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
