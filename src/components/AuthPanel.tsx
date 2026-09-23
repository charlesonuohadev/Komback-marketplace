import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Mail, Phone, Store, User } from 'lucide-react';
import { useMarketplace } from '../context/AppContext';

interface AuthPanelProps {
  /** Renders the merchant sign-up variant of the registration form. */
  intent?: 'buyer' | 'seller';
  onSuccess?: () => void;
}

/**
 * Sign-in / registration form. All credentials are verified server-side against
 * the PostgreSQL `User` table and a session cookie is issued on success.
 */
export const AuthPanel: React.FC<AuthPanelProps> = ({ intent = 'buyer', onSuccess }) => {
  const { login, register, categories } = useMarketplace();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isMerchant, setIsMerchant] = useState(intent === 'seller');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState(categories[0]?.slug ?? 'phones-tablets');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('Lagos');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          phone,
          location,
          state,
          ...(isMerchant ? { storeName, storeCategory, storeTagline: 'Verified Komback merchant' } : {}),
        });
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all';

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
          {mode === 'login' ? 'Sign in to Komback' : 'Create your Komback account'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isMerchant && mode === 'register'
            ? 'Merchant accounts get a storefront, wallet and order pipeline.'
            : 'Track orders, manage your cart and message verified sellers.'}
        </p>
      </div>

      <div className="flex bg-slate-100 rounded-xl p-1 mb-5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
            mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
            mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'register' && (
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              className={inputClass}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            className={inputClass}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            className={inputClass}
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {mode === 'register' && (
          <>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                className={inputClass}
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                placeholder="City / area"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="Lagos">Lagos</option>
                <option value="Abuja (FCT)">Abuja (FCT)</option>
                <option value="Port Harcourt (Rivers)">Rivers</option>
                <option value="Kano">Kano</option>
                <option value="Enugu">Enugu</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isMerchant}
                onChange={(e) => setIsMerchant(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                I want to sell on Komback (creates a storefront)
              </span>
            </label>

            {isMerchant && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="Store name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required={isMerchant}
                />
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-xs text-rose-600 font-bold flex items-start gap-1.5 bg-rose-50 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Please wait…</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" />
        <span>
          Passwords are hashed with bcrypt and sessions are stored in PostgreSQL. Komback staff
          never see your password.
        </span>
      </div>
    </div>
  );
};
