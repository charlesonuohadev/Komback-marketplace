import React from 'react';
import { ShieldCheck, AlertTriangle, Lock, Eye, CheckCircle2, Phone, ArrowRight } from 'lucide-react';
import { PageType } from '../types';

interface SafetyPageProps {
  setCurrentPage: (page: PageType) => void;
}

export const SafetyPage: React.FC<SafetyPageProps> = ({ setCurrentPage }) => {
  return (
    <div id="komback-safety-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>TRUST & BUYER SAFETY MANDATE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
            Shop Safely on Komback Nigeria
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-xl">
            We are dedicated to building Nigeria's safest multivendor ecosystem. Learn how our verified merchant badges, escrow payments, and inspection rules safeguard every transaction.
          </p>
        </div>

        {/* Golden Safety Rules Card */}
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Primary Safety Rule for Nigerian Shoppers</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-950 font-bold leading-relaxed">
            🛡️ Never send money outside the recommended Komback payment channels or private untracked personal bank accounts before receiving and inspecting your item.
          </p>
        </div>

        {/* 4 Pillars of Komback Trust */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Physical Store Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every merchant displaying the <strong className="text-emerald-700">🟢 Verified Seller</strong> badge has passed physical business location verification (e.g. Computer Village Ikeja, Wuse II Abuja, Trade Fair Complex) and CAC registration checks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Komback Escrow Protection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you pay via Komback, your money remains safely held in escrow until you have received the waybill package, tested the item, and confirmed satisfaction.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Safe Public Meetups</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If arranging direct local inspection in Lagos, Abuja, or Port Harcourt, choose public commercial hubs, shopping malls, or the merchant's physical registered storefront.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900">Real-Time In-App Chat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Communicate directly with merchants via our integrated Chat with Seller tool. All negotiation records remain saved to prevent dispute ambiguities.
            </p>
          </div>

        </div>

        {/* Back to shopping CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => setCurrentPage('products')}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-colors cursor-pointer"
          >
            Start Shopping Safely on Komback →
          </button>
        </div>

      </div>
    </div>
  );
};
