import React from 'react';
import { Product } from '../types';
import { X, Star, MapPin, CheckCircle2, ShoppingCart, MessageSquare, Heart, ShieldAlert } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewProductFull: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onChatWithSeller: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onViewProductFull,
  onAddToCart,
  onChatWithSeller,
  isWishlisted,
  onToggleWishlist
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        id="product-quick-view-modal"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Preview</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-200 relative">
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
                {product.badge}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              {/* Seller badge */}
              <div className="flex items-center gap-1.5 mb-1.5">
                {product.seller.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Verified Seller
                  </span>
                )}
                <span className="text-xs text-slate-500">({product.seller.name})</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {product.title}
              </h3>

              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400">({product.reviewsCount} reviews)</span>
                <span className="mx-1.5 text-slate-300">|</span>
                <span className="text-slate-500 font-medium">{product.condition}</span>
              </div>
            </div>

            {/* Price */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {formatNaira(product.price)}
              </div>
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="text-xs text-slate-400 line-through">
                  Original: {formatNaira(product.originalPrice)}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{product.location}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {product.description}
            </p>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="quick-view-add-to-cart-btn"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  id="quick-view-chat-btn"
                  onClick={() => {
                    onChatWithSeller(product);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Seller</span>
                </button>
              </div>

              <button
                id="quick-view-view-full-page-btn"
                onClick={() => {
                  onViewProductFull(product);
                  onClose();
                }}
                className="w-full py-2 text-center text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                View Full Product Page Details & Specifications →
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
