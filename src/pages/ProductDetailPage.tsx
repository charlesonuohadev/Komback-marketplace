import React, { useEffect, useState } from 'react';
import { Product, Store, Review } from '../types';
import { api } from '../lib/api';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  ShoppingCart, 
  MessageSquare, 
  Heart, 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  Share2, 
  ArrowLeft, 
  Store as StoreIcon, 
  Check, 
  Sparkles,
  Phone,
  Shield,
  ArrowRight
} from 'lucide-react';
import { formatNaira } from '../utils/formatters';
import { ProductCard } from '../components/ProductCard';
import { getProductPermalink } from '../utils/slug';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onChatWithSeller: (product: Product) => void;
  onViewStore: (store: Store) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onBack,
  onViewProduct,
  onAddToCart,
  onBuyNow,
  onChatWithSeller,
  onViewStore,
  isWishlisted,
  onToggleWishlist
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copyNotification, setCopyNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  
  // Reviews live in PostgreSQL and are scoped to this listing.
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReviewsLoading(true);

    (async () => {
      try {
        const res = await api.catalog.reviews(product.id);
        if (!cancelled) {
          setUserReviews(res.reviews);
          setReviewError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setReviewError(err instanceof Error ? err.message : 'Could not load reviews');
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const permalink = getProductPermalink(product);

  const handleShare = () => {
    const fullUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${permalink}`
      : permalink;
    navigator.clipboard?.writeText(fullUrl);
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 3000);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !newReviewAuthor.trim()) return;

    try {
      const res = await api.catalog.addReview(product.id, {
        author: newReviewAuthor.trim(),
        comment: newReviewText.trim(),
        rating: newReviewRating,
      });

      setUserReviews(prev => [res.review, ...prev]);
      setNewReviewText('');
      setNewReviewAuthor('');
      setReviewError(null);
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 4000);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not submit your review');
    }
  };

  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, 4);

  return (
    <div id={`product-detail-page-${product.id}`} className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            id="product-detail-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-mono font-medium border border-slate-200">
              <span className="text-slate-400">Permalink:</span>
              <span className="text-emerald-700 font-bold">{permalink}</span>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copyNotification ? 'Link Copied!' : 'Share Product'}</span>
            </button>
          </div>
        </div>

        {/* Main Product Layout following Blueprint Pages 15, 16, 33 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Gallery & Previews */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Primary Large Image Display */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden aspect-4/3 relative shadow-xs">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />

              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-rose-500 text-white text-xs font-bold shadow-md">
                  {product.badge}
                </span>
              )}

              <button
                onClick={(e) => onToggleWishlist(product, e)}
                className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md shadow-md cursor-pointer transition-transform active:scale-90 ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white/90 text-slate-700 hover:text-rose-600'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Carousel */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx ? 'border-emerald-600 shadow-md ring-2 ring-emerald-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Specifications & Details Tabs */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs mt-6 space-y-6">
              
              {/* Tab Nav */}
              <div className="flex items-center gap-4 border-b border-slate-200 pb-3 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'description' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  DESCRIPTION
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'specs' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  FEATURES & SPECS
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'reviews' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  BUYER REVIEWS ({userReviews.length})
                </button>
              </div>

              {/* Tab 1: Description */}
              {activeTab === 'description' && (
                <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                  <p>{product.description}</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h5 className="font-bold text-slate-900 mb-2">Item Summary:</h5>
                    <ul className="space-y-1.5 text-slate-600">
                      <li>• <strong>Condition:</strong> {product.condition}</li>
                      <li>• <strong>Category:</strong> {product.category}</li>
                      <li>• <strong>Item Location:</strong> {product.location}, {product.state}</li>
                      <li>• <strong>Listed Date:</strong> {product.createdAt}</li>
                      <li>• <strong>Warranty / Guarantee:</strong> 100% Genuine with Seller Return Policy</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Specs & Key Features */}
              {activeTab === 'specs' && (
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Key Highlights</h5>
                  {product.features && product.features.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Standard manufacturer specifications apply.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Reviews (Blueprint Page 16 & 17) */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviewsLoading && (
                      <p className="text-xs font-bold text-slate-500">Loading buyer reviews…</p>
                    )}
                    {reviewError && !reviewsLoading && (
                      <p className="text-xs font-bold text-rose-600">{reviewError}</p>
                    )}
                    {!reviewsLoading && userReviews.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No written reviews yet for this listing. Be the first to review it.
                      </p>
                    )}
                    {userReviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-900">{rev.author}</span>
                            <span className="text-[11px] text-slate-400 ml-2">📍 {rev.location}</span>
                          </div>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified Purchase</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-700 italic">"{rev.comment}"</p>
                        {rev.sellerReply && (
                          <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                            <span className="font-bold text-emerald-700">Seller Reply: </span>
                            {rev.sellerReply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReview} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-900 uppercase">Write a Verified Review</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Your Name (e.g. Samuel O.)"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-xs text-slate-500">Rating:</span>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="text-xs font-bold text-amber-600 bg-transparent focus:outline-hidden cursor-pointer"
                        >
                          <option value={5}>★★★★★ (5 Stars)</option>
                          <option value={4}>★★★★☆ (4 Stars)</option>
                          <option value={3}>★★★☆☆ (3 Stars)</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Share details of your purchase experience, packaging, and delivery..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    ></textarea>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Post Review
                    </button>
                    {reviewSubmitted && (
                      <span className="text-xs text-emerald-600 font-bold ml-3">Review published!</span>
                    )}
                  </form>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Actions, Delivery, Seller Card & Safety from Blueprint */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Top Product Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              
              {/* Verified Seller & Location Badge (Blueprint Page 15, 16, 33) */}
              <div className="flex items-center justify-between text-xs">
                {product.seller.isVerified ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Verified Seller</span>
                  </div>
                ) : (
                  <span className="text-slate-500 font-semibold">Individual Seller</span>
                )}
                <div className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{product.location}</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <span className="font-extrabold text-slate-900">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400">({product.reviewsCount} customer reviews)</span>
                <span className="text-slate-300">•</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                  {product.condition}
                </span>
              </div>

              {/* Price Display */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Price in Nigeria:</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    {formatNaira(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatNaira(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <Sparkles className="w-3 h-3" />
                    <span>You save {formatNaira(product.originalPrice - product.price)} ({product.badge})</span>
                  </div>
                )}
              </div>

              {/* ACTIONS: Buy Now, Add to Cart, Chat with Seller, Wishlist (Blueprint Page 16 & 33) */}
              <div className="space-y-2.5 pt-2">
                
                {/* 🛒 Buy Now */}
                <button
                  id="product-action-buy-now-btn"
                  onClick={() => onBuyNow(product)}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  <span>🛒 Buy Now</span>
                </button>

                {/* Add to Cart */}
                <button
                  id="product-action-add-to-cart-btn"
                  onClick={() => onAddToCart(product)}
                  className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Add to Cart</span>
                </button>

                {/* 💬 Chat with Seller & ♡ Wishlist */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="product-action-chat-seller-btn"
                    onClick={() => onChatWithSeller(product)}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>💬 Chat with Seller</span>
                  </button>

                  <button
                    id="product-action-wishlist-toggle-btn"
                    onClick={(e) => onToggleWishlist(product, e)}
                    className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{isWishlisted ? 'Saved in Wishlist' : '♡ Wishlist'}</span>
                  </button>
                </div>

              </div>

            </div>

            {/* DELIVERY (Blueprint Page 16 & 33) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                DELIVERY & SHIPPING
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">🚚 Delivery Available</span>
                    <p className="text-slate-500 text-[11px]">Same-day dispatch within {product.state} & 2-3 days nationwide waybill</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">📍 Delivering to your location</span>
                    <p className="text-slate-500 text-[11px]">Doorstep delivery, office delivery or terminal pickup point</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SELLER CARD (Blueprint Page 16 & 33) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                  SELLER INFORMATION
                </h4>
                <span className="text-[10px] text-slate-400">Member since {product.seller.joinedYear}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center overflow-hidden">
                  {product.seller.avatar ? (
                    <img src={product.seller.avatar} alt={product.seller.name} className="w-full h-full object-cover" />
                  ) : (
                    product.seller.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-bold text-sm text-slate-900">{product.seller.name}</h5>
                    {product.seller.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-bold text-amber-500">★ {product.seller.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span>{product.seller.salesCount.toLocaleString()} sales</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Response rate: <strong className="text-emerald-700">{product.seller.responseRate}</strong>
                </span>
                <button
                  id="view-store-profile-btn"
                  onClick={() => onViewStore({
                    id: product.seller.id,
                    name: product.seller.name,
                    tagline: 'Verified Marketplace Merchant',
                    isVerified: product.seller.isVerified,
                    rating: product.seller.rating,
                    salesCount: product.seller.salesCount,
                    location: product.seller.location,
                    state: product.state,
                    avatar: product.seller.avatar || '',
                    coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&auto=format&fit=crop&q=80',
                    category: product.category,
                    description: 'Top verified seller on Komback marketplace.',
                    phone: product.seller.phone || '+234 800 000 0000',
                    email: 'merchant@komback.com',
                    joinedDate: product.seller.joinedYear,
                    badges: ['Verified Merchant', '7-Day Return Policy'],
                    totalProducts: 24
                  })}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SAFETY & SHOP SAFELY (Blueprint Page 17, 34) */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>SAFETY & VERIFICATION</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed font-semibold">
                🛡️ <strong>Shop Safely:</strong> Never send money outside the recommended Komback payment process. Avoid private bank transfers without escrow verification.
              </p>
              <ul className="text-[11px] text-amber-800 space-y-1 pt-1">
                <li>• Inspect item condition thoroughly during meetup or delivery.</li>
                <li>• Check warranty receipts and serial/IMEI numbers before final signoff.</li>
              </ul>
            </div>

          </div>

        </div>

        {/* Related Products from Category */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                More from {product.category}
              </h3>
              <span className="text-xs text-slate-500">Similar recommendations in Nigeria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onViewProduct={onViewProduct}
                  isWishlisted={false}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
