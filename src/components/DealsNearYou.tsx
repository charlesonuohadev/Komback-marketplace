import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { MapPin, Navigation as NavIcon, ArrowRight } from 'lucide-react';

interface DealsNearYouProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onExploreCity: (city: string) => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
}

export const DealsNearYou: React.FC<DealsNearYouProps> = ({
  products,
  onViewProduct,
  wishlistIds,
  onToggleWishlist,
  onExploreCity,
  onQuickView
}) => {
  const cities = [
    'Lagos',
    'Abuja (FCT)',
    'Port Harcourt (Rivers)',
    'Enugu',
    'Onitsha (Anambra)',
    'Benin City (Edo)',
    'Ibadan (Oyo)',
    'Aba (Abia)',
    'Kano'
  ];

  const [activeCity, setActiveCity] = useState<string>('Lagos');

  // Filter products by active city
  const localProducts = products.filter(p => {
    const cityName = activeCity.split(' ')[0].toLowerCase();
    return p.state.toLowerCase().includes(cityName) || p.location.toLowerCase().includes(cityName);
  });

  const displayProducts = localProducts.length > 0 ? localProducts.slice(0, 4) : products.slice(0, 4);

  return (
    <section id="komback-deals-near-you" className="py-6 sm:py-10 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="p-1 sm:p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Great Deals Near You
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5">
              Verified products and pickup options from sellers in your immediate area.
            </p>
          </div>

          <button
            id="explore-all-city-listings-btn"
            onClick={() => onExploreCity(activeCity)}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer shrink-0"
          >
            <span>See {activeCity.split(' ')[0]}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 no-scrollbar mb-4 sm:mb-6">
          {cities.map((city) => {
            const isSelected = activeCity === city;
            const shortName = city.split(' ')[0];
            return (
              <button
                key={city}
                id={`city-pill-${shortName.toLowerCase()}`}
                onClick={() => setActiveCity(city)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 sm:gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <MapPin className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`} />
                <span>{shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Local Products Grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {displayProducts.map((product) => (
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

        {/* Local Seller Safety Notice */}
        <div className="mt-6 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <NavIcon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Meeting locally in <strong>{activeCity}</strong>? Always meet in public places (e.g. malls, fuel stations, banks) and inspect goods before handover.
            </span>
          </div>
          <button
            onClick={() => onExploreCity(activeCity)}
            className="text-emerald-700 font-bold hover:underline shrink-0 cursor-pointer"
          >
            Explore local safety guide →
          </button>
        </div>

      </div>
    </section>
  );
};
