import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Filter
} from 'lucide-react';
import { formatNaira } from '../../utils/formatters';
import { api } from '../../lib/api';
import { Store } from '../../types';

interface SellerWalletProps {
  store: Store;
}

type Transaction = import('../../lib/api').WalletTransaction;

export const SellerWallet: React.FC<SellerWalletProps> = ({ store }) => {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [escrowLocked, setEscrowLocked] = useState(0);
  const [totalSettled, setTotalSettled] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const applyWallet = (wallet: import('../../lib/api').Wallet) => {
    setAvailableBalance(wallet.availableBalance);
    setEscrowLocked(wallet.escrowLocked);
    setTotalSettled(wallet.totalSettled);
    setTransactions(wallet.transactions);
  };

  // Balances and the ledger are read from PostgreSQL for this storefront.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.seller.wallet();
        if (!cancelled) applyWallet(res.wallet);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not load your wallet');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number.parseFloat(payoutAmount);

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount.');
      return;
    }
    if (amountNum > availableBalance) {
      setErrorMessage(`Insufficient balance. You can withdraw up to ₦${formatNaira(availableBalance)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.seller.requestPayout({ amount: Math.round(amountNum) });
      applyWallet(res.wallet);
      setPayoutSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        setPayoutSuccess(false);
        setIsPayoutModalOpen(false);
        setPayoutAmount('');
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Payout request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Escrow Guaranteed Settlement Engine</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Seller Wallet & Bank Payouts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant NIBSS electronic transfers straight to your verified Nigerian corporate bank account.
          </p>
        </div>

        <button
          onClick={() => {
            setIsPayoutModalOpen(true);
            setPayoutAmount('');
            setErrorMessage('');
            setPayoutSuccess(false);
          }}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Request Bank Payout</span>
        </button>
      </div>

      {/* Financial Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Available For Withdrawal</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3 font-['Plus_Jakarta_Sans',sans-serif]">
            {formatNaira(availableBalance)}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for instant bank credit</span>
          </div>
        </div>

        {/* Escrow Locked */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Escrow Locked In Transit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-3 font-['Plus_Jakarta_Sans',sans-serif]">
            {formatNaira(escrowLocked)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Releases immediately upon buyer PIN entry
          </div>
        </div>

        {/* Total Settled */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Lifetime Settled</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-3 font-['Plus_Jakarta_Sans',sans-serif]">
            {formatNaira(totalSettled)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {isLoading ? 'Loading…' : 'Escrow releases and payouts to date'}
          </div>
        </div>
      </div>

      {/* Linked Bank Account Summary Strip */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>Guaranty Trust Bank (GTBank)</span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Acct: 0123456789 • {store.name} ENT LTD
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Payout Speed</div>
          <div className="text-xs font-bold text-emerald-700">Instant (under 60 seconds)</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Ledger & Escrow Settlement History
            </h2>
            <p className="text-xs text-slate-500">
              Audit log of all payouts and buyer inspection releases
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {tx.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      tx.type === 'Escrow Release' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tx.type === 'Escrow Release' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      <span>{tx.type}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{tx.description}</div>
                    <div className="text-[10px] text-slate-400">{tx.date}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {tx.account}
                  </td>
                  <td className="py-3.5 px-4 font-black font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
                    {tx.type === 'Escrow Release' ? '+' : '-'}{formatNaira(tx.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Request Bank Payout
                </h3>
                <p className="text-xs text-slate-500">
                  Available: {formatNaira(availableBalance)}
                </p>
              </div>
            </div>

            {payoutSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Payout Request Dispatched!
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  ₦{formatNaira(parseFloat(payoutAmount))} has been transmitted via NIBSS Instant Payment to your linked GTBank account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Withdrawal Amount (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={availableBalance}
                    placeholder="e.g. 1000000"
                    value={payoutAmount}
                    onChange={(e) => {
                      setPayoutAmount(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full text-lg font-black py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  {errorMessage && (
                    <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorMessage}</span>
                    </p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Destination Bank:</span>
                    <span>Guaranty Trust Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span className="font-mono">0123456789</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer Fee:</span>
                    <span className="text-emerald-700 font-bold">₦0 (Komback Free Payout)</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting…' : 'Confirm & Transfer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
