import React from 'react';
import { PlusCircle, CheckCircle2, TrendingUp, Users, Shield, ArrowRight } from 'lucide-react';

interface SellBannerProps {
  openSellModal: () => void;
}

export const SellBanner: React.FC<SellBannerProps> = ({ openSellModal }) => {
  const sellerBenefits = [
    'Easy product listing in under 2 minutes',
    'Dedicated seller dashboard & inventory tools',
    'Reach over 500,000 active Nigerian buyers',
    'Manage your products & instant price updates',
    'Chat directly with interested customers'
  ];

  return (
    <section id="komback-sell-banner-section" className="py-14 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white relative overflow-hidden">
      {/* Background Decorative patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading, description and CTA */}
          <div className="lg:col-span-7">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700/60 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>💰 GROW YOUR BUSINESS IN NIGERIA</span>
            </div>

            {/* Main Heading from Blueprint */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              Have Something to Sell?
            </h2>

            <p className="text-xl sm:text-2xl font-semibold text-emerald-200 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Turn your products into sales with Komback.
            </p>

            {/* Supporting Text from Blueprint */}
            <p className="text-sm sm:text-base text-emerald-100/90 mt-4 leading-relaxed max-w-2xl">
              Whether you're a registered enterprise, boutique brand, Computer Village importer, Instagram fashion store, or individual clearing items, reach active ready-to-buy customers across Nigeria today.
            </p>

            {/* Main CTA Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                id="sell-banner-start-selling-btn"
                onClick={openSellModal}
                className="bg-white hover:bg-emerald-50 active:scale-98 text-emerald-900 font-extrabold px-8 py-4 rounded-2xl text-base flex items-center gap-2 shadow-2xl shadow-emerald-950/50 transition-all cursor-pointer group"
              >
                <PlusCircle className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <span>Start Selling on Komback</span>
                <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-xs text-emerald-200 font-medium">
                No upfront listing fee • Free account
              </div>
            </div>

            {/* 5 Bullet Points (Blueprint Page 7) */}
            <div className="mt-8 pt-6 border-t border-emerald-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sellerBenefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-medium text-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Interactive Seller Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-lg text-white">
                    🇳🇬
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Merchant Storefront</h4>
                    <span className="text-[11px] text-emerald-300">Verified Nigerian Business</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-400/20 text-emerald-300 text-xs font-bold rounded-lg">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-lg font-black text-white">₦4.8M+</div>
                  <div className="text-[10px] text-emerald-200">Monthly Volume</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-lg font-black text-white">1,420</div>
                  <div className="text-[10px] text-emerald-200">Buyers Reached</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-lg font-black text-white">4.9 ★</div>
                  <div className="text-[10px] text-emerald-200">Seller Rating</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero commission on your first 5 sold listings!</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
