import React from 'react';
import { Product, PageType } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';

interface WishlistPageProps {
  products: Product[];
  wishlistIds: string[];
  onViewProduct: (product: Product) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  setCurrentPage: (page: PageType) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  products,
  wishlistIds,
  onViewProduct,
  onToggleWishlist,
  setCurrentPage
}) => {
  const wishlistedProducts = products.filter(p => wishlistIds.includes(p.id));

  return (
    <div id="komback-wishlist-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Saved Wishlist ({wishlistedProducts.length})
            </h1>
            <p className="text-xs text-slate-500">
              Items you've bookmarked to track price drops and seller updates.
            </p>
          </div>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500">
              Browse phones, cars, fashion, and real estate, and tap the heart icon to save listings.
            </p>
            <button
              onClick={() => setCurrentPage('products')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Explore Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {wishlistedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onViewProduct={onViewProduct}
                isWishlisted={true}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
