import React from 'react';
import { Product } from '../types';
import { Heart, Star, MapPin, CheckCircle2, ArrowRight, Eye, Repeat } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
  onCompare?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewProduct,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onCompare
}) => {
  // Determine badge styling if available
  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case '15% OFF':
      case '20% OFF':
        return 'bg-rose-500 text-white';
      case 'Limited Deal':
        return 'bg-amber-500 text-white';
      case 'Popular':
        return 'bg-purple-600 text-white';
      case 'Best Price':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-900 text-white';
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onViewProduct(product)}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Single Deal Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 z-10">
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wide shadow-xs ${getBadgeStyle(product.badge)}`}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Condition Badge (e.g. Brand New, UK Used, Tokunbo) */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-semibold">
            {product.condition}
          </span>
        </div>

        {/* Wishlist Button (Mobile App Touch Friendly) */}
        <button
          id={`wishlist-toggle-${product.id}`}
          onClick={(e) => onToggleWishlist(product, e)}
          className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-transform active:scale-85 cursor-pointer z-20 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-200'
              : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white shadow-2xs'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Desktop Hover Quick Actions: Compare & Quick View (Blueprint Page 15) */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-end gap-1.5 z-10">
          {onCompare && (
            <button
              onClick={(e) => onCompare(product, e)}
              className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
              title="Compare"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="text-[10px]">Compare</span>
            </button>
          )}
          {onQuickView && (
            <button
              onClick={(e) => onQuickView(product, e)}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
              title="Quick View"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px]">Quick View</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Details Container */}
      <div className="p-2.5 sm:p-3.5 md:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Verified Seller indicator */}
          <div className="flex items-center justify-between gap-1 mb-1">
            {product.seller.isVerified ? (
              <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Verified</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md">
                <span>Seller</span>
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[75px] sm:max-w-[120px]">
              {product.seller.name}
            </span>
          </div>

          {/* Product Title - NOT truncated, wraps cleanly so title fits well on mobile grid card */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug break-words">
            {product.title}
          </h3>

          {/* Ratings */}
          <div className="flex items-center gap-1 mt-1 text-[11px] sm:text-xs text-slate-600">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-slate-900">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
          {/* Price with strikethrough if discounted */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] leading-none">
              {formatNaira(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Savings tag if deal */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-[10px] sm:text-[11px] font-medium text-emerald-700 mt-0.5">
              Save {formatNaira(product.originalPrice - product.price)}
            </div>
          )}

          {/* Location & View Product link */}
          <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <div className="flex items-center gap-1 truncate text-slate-600 max-w-[65%] sm:max-w-[75%]">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{product.location}</span>
            </div>
            <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
