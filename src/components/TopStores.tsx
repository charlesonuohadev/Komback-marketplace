import React from 'react';
import { Store } from '../types';
import { useMarketplace } from '../context/AppContext';
import { Store as StoreIcon, Star, CheckCircle2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

interface TopStoresProps {
  onViewStore: (store: Store) => void;
  onViewAllStores: () => void;
}

export const TopStores: React.FC<TopStoresProps> = ({
  onViewStore,
  onViewAllStores
}) => {
  const { stores } = useMarketplace();

  return (
    <section id="komback-top-stores-section" className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <StoreIcon className="w-5 h-5" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Top Komback Stores
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Shop directly from verified businesses, registered merchants, and high-volume top-rated Nigerian sellers.
            </p>
          </div>

          <button
            id="view-all-stores-top-btn"
            onClick={onViewAllStores}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer"
          >
            <span>Explore All Verified Stores</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 6 Stores Grid (As specified in Blueprint: Jenny Phones, AutoHub, Glamour, TechBazaar, GadgetZone, Prime Properties) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div
              key={store.id}
              id={`store-card-${store.id}`}
              onClick={() => onViewStore(store)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              {/* Cover Banner with Avatar Overlay */}
              <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                <img
                  src={store.coverImage}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold">
                    {store.category}
                  </span>
                </div>
              </div>

              {/* Store Content */}
              <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between">
                
                {/* Store Avatar Overlap */}
                <div className="-mt-8 mb-3 flex items-end justify-between">
                  <div className="w-16 h-16 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
                    <img
                      src={store.avatar}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Verified Badge */}
                  {store.isVerified && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Verified Seller</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {store.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {store.tagline}
                  </p>

                  {/* Ratings, Sales count and Location from Blueprint */}
                  <div className="mt-3 flex items-center justify-between text-xs border-y border-slate-100 py-2">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{store.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-slate-600 font-semibold">
                      {store.salesCount.toLocaleString()} sales
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[90px]">{store.state.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Store CTA */}
                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {store.totalProducts} active products
                  </span>
                  <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                    <span>View Store</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
