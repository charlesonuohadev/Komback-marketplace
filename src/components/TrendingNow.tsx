import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Flame, ArrowRight } from 'lucide-react';

interface TrendingNowProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onViewAllTrending: () => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
}

export const TrendingNow: React.FC<TrendingNowProps> = ({
  products,
  onViewProduct,
  wishlistIds,
  onToggleWishlist,
  onViewAllTrending,
  onQuickView
}) => {
  const trendingProducts = products.filter(p => p.isTrending).slice(0, 4);

  return (
    <section id="komback-trending-section" className="py-6 sm:py-10 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="p-1 sm:p-1.5 rounded-lg bg-orange-100 text-orange-600 shrink-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500 text-orange-500" />
              </span>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Trending on Komback
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5">
              Popular items shoppers across Nigeria are looking for right now.
            </p>
          </div>

          <button
            id="trending-view-all-btn"
            onClick={onViewAllTrending}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer shrink-0"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 2-column Product Grid on Mobile, 4-column on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {trendingProducts.map((product) => (
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

      </div>
    </section>
  );
};
