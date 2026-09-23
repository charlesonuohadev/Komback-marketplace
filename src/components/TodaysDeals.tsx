import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Flame, Clock, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface TodaysDealsProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onViewAllDeals: () => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
}

export const TodaysDeals: React.FC<TodaysDealsProps> = ({
  products,
  onViewProduct,
  wishlistIds,
  onToggleWishlist,
  onViewAllDeals,
  onQuickView
}) => {
  const dealProducts = products.filter(p => p.isDeal || p.originalPrice).slice(0, 4);

  // Dynamic countdown timer for daily flash deals
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num: number) => num.toString().padStart(2, '0');

  return (
    <section id="komback-todays-deals" className="py-7 sm:py-12 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header with Flash Countdown */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 sm:mb-8 border-b border-slate-800 pb-4 sm:pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] sm:text-xs font-bold mb-2">
              <Flame className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>FLASH DISCOUNTS & LIMITED INVENTORY</span>
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Today's Best Deals
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Hand-picked price cuts from verified merchants across Nigeria. Limited stock available at these prices.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-850 border border-slate-700/80 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl self-start md:self-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-300">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
              <span>Ends In:</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold">
              <span className="bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-amber-400 text-xs sm:text-sm">
                {formatDigit(timeLeft.hours)}h
              </span>
              <span className="text-slate-500">:</span>
              <span className="bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-amber-400 text-xs sm:text-sm">
                {formatDigit(timeLeft.minutes)}m
              </span>
              <span className="text-slate-500">:</span>
              <span className="bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-amber-400 text-xs sm:text-sm">
                {formatDigit(timeLeft.seconds)}s
              </span>
            </div>
          </div>
        </div>

        {/* Product Deals Cards Grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {dealProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewProduct={onViewProduct}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>

        {/* View All Deals CTA */}
        <div className="mt-8 text-center">
          <button
            id="view-all-deals-hub-btn"
            onClick={onViewAllDeals}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 hover:scale-102 transition-all cursor-pointer"
          >
            <span>Explore All Today's Deals Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
