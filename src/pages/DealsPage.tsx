import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Flame, Clock, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface DealsPageProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({
  products,
  onViewProduct,
  wishlistIds,
  onToggleWishlist
}) => {
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealItems = products.filter(p => {
    if (selectedBadge !== 'all') {
      return p.badge === selectedBadge;
    }
    return p.isDeal || p.originalPrice;
  });

  return (
    <div id="komback-deals-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner with Countdown */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 rounded-3xl p-8 text-white mb-8 border border-rose-900/30 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-2">
                <Flame className="w-4 h-4 fill-rose-400" />
                <span>HOTTEST DAILY MARKDOWNS IN NIGERIA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
                Today's Best Deals & Price Drops
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Save up to ₦150,000 on authenticated gadgets, vehicles, native attires, and luxury goods from verified Nigerian merchants.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl flex flex-col items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Next Deal Refresh In:</span>
              </span>
              <div className="flex items-center gap-2 font-mono font-black text-amber-400 text-xl">
                <span className="bg-slate-800 px-3 py-1 rounded-xl">{timeLeft.hours.toString().padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-slate-800 px-3 py-1 rounded-xl">{timeLeft.minutes.toString().padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-slate-800 px-3 py-1 rounded-xl">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {['all', '15% OFF', '20% OFF', 'Limited Deal', 'Popular', 'Best Price'].map((badge) => (
            <button
              key={badge}
              onClick={() => setSelectedBadge(badge)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedBadge === badge
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {badge === 'all' ? '🔥 All Active Deals' : badge}
            </button>
          ))}
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dealItems.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onViewProduct={onViewProduct}
              isWishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
