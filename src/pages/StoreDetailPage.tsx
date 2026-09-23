import React from 'react';
import { Store, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, CheckCircle2, Star, MapPin, Phone, Mail, MessageSquare, ShieldCheck, Share2, Award } from 'lucide-react';

interface StoreDetailPageProps {
  store: Store;
  allProducts: Product[];
  onBack: () => void;
  onViewProduct: (product: Product) => void;
  onChatWithStore: (store: Store) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({
  store,
  allProducts,
  onBack,
  onViewProduct,
  onChatWithStore,
  wishlistIds,
  onToggleWishlist
}) => {
  // Find all products by this store or category match
  const storeProducts = allProducts.filter(
    p => p.seller.name.toLowerCase() === store.name.toLowerCase() || p.seller.id === store.id || p.categorySlug.includes(store.category.toLowerCase().split(' ')[0])
  );

  return (
    <div id={`store-detail-page-${store.id}`} className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Stores</span>
          </button>
        </div>

        {/* Store Banner & Profile Header */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs mb-8">
          {/* Cover Banner */}
          <div className="h-48 md:h-64 w-full bg-slate-900 relative overflow-hidden">
            <img
              src={store.coverImage}
              alt={store.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
          </div>

          {/* Store Info Row */}
          <div className="p-6 sm:p-8 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 sm:-mt-16 mb-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden shrink-0">
                  <img src={store.avatar} alt={store.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                      {store.name}
                    </h1>
                    {store.isVerified && (
                      <span className="p-1 rounded-full bg-emerald-100 text-emerald-700" title="Verified Merchant">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    {store.tagline}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{store.location}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{store.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({store.salesCount} sales)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onChatWithStore(store)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Merchant</span>
                </button>
                <a
                  href={`tel:${store.phone}`}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Call Store</span>
                </a>
              </div>

            </div>

            {/* Store Badges & Description */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 text-slate-600 leading-relaxed">
                <h4 className="font-bold text-slate-900 text-xs uppercase mb-1">About This Merchant</h4>
                <p>{store.description}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase">Verified Credentials</h4>
                {store.badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Store Catalog Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Products from {store.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {storeProducts.length} verified listings available in stock
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {storeProducts.map((p) => (
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
    </div>
  );
};
