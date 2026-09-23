import React, { useState, useRef } from 'react';
import { Product, PageType } from '../types';
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  X, 
  CheckCircle2, 
  MapPin, 
  Tag, 
  Check, 
  AlertCircle,
  Eye,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { useMarketplace } from '../context/AppContext';
import { generateUniqueId, generateProductSlug } from '../utils/slug';

interface SellPageProps {
  onAddProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  setCurrentPage: (page: PageType) => void;
}

const QUICK_CATEGORIES = [
  'Phones & Tablets',
  'Vehicles & Cars',
  'Electronics & Laptops',
  'Fashion & Clothes',
  'Real Estate & Rent',
  'Home & Furniture',
  'Beauty & Hair',
  'Services & Jobs'
];

const QUICK_LOCATIONS = [
  'Ikeja, Lagos',
  'Lekki, Lagos',
  'Wuse 2, Abuja',
  'Garki, Abuja',
  'Port Harcourt, Rivers',
  'Ibadan, Oyo',
  'Onitsha, Anambra',
  'Kano Central'
];

const QUICK_CONDITIONS = [
  'Brand New',
  'Used (Clean)',
  'Tokunbo (Foreign Used)',
  'Refurbished'
];

export const SellPage: React.FC<SellPageProps> = ({
  onAddProduct,
  onViewProduct,
  setCurrentPage
}) => {
  const { categories } = useMarketplace();
  // Mobile App Form States
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState('Brand New');
  const [description, setDescription] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishedProduct, setPublishedProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle image upload from file or camera
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesList = e.target.files;
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList.item(i);
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              setPhotos((prev) => [...prev, reader.result as string].slice(0, 8));
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetForm = () => {
    setPhotos([]);
    setTitle('');
    setCategory('');
    setLocation('');
    setPrice('');
    setIsNegotiable(true);
    setCondition('Brand New');
    setDescription('');
    setErrorMsg(null);
  };

  // Submit and create ad
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!title.trim()) {
      setErrorMsg('Please enter an ad title');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    if (!category.trim()) {
      setErrorMsg('Please specify a category');
      return;
    }

    if (!price.trim()) {
      setErrorMsg('Please enter your price in Naira');
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMsg('Please enter a valid price greater than ₦0');
      return;
    }

    if (!location.trim()) {
      setErrorMsg('Please enter your location');
      return;
    }

    // Default placeholder image if seller didn't upload photo
    const imageList = photos.length > 0 ? photos : [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    ];

    // Determine canonical category name and slug aligned with Home Hero categories
    const matchedCategory = categories.find(
      (c) => c.slug === category || c.name.toLowerCase() === category.toLowerCase()
    );
    const categoryName = matchedCategory ? matchedCategory.name : (category.trim() || 'General Items');
    const categorySlug = matchedCategory ? matchedCategory.slug : 'other';

    const productId = `prod-${Date.now()}`;
    const uniqueId = generateUniqueId();
    const productSlug = generateProductSlug(title.trim(), productId, uniqueId);

    const newProduct: Product = {
      id: productId,
      slug: productSlug,
      uniqueId: uniqueId,
      title: title.trim(),
      price: numericPrice,
      originalPrice: isNegotiable ? numericPrice * 1.15 : undefined,
      category: categoryName,
      categorySlug: categorySlug,
      location: location.trim(),
      state: location.includes(',') ? location.split(',')[1].trim() : 'Lagos',
      images: imageList,
      seller: {
        id: 'seller-me',
        name: 'My Store Account',
        isVerified: true,
        rating: 5.0,
        salesCount: 12,
        location: location.trim(),
        phone: '+234 800 000 0000',
        joinedYear: '2025',
        responseRate: '100%'
      },
      rating: 5.0,
      reviewsCount: 1,
      condition: (condition === 'Brand New' || condition === 'Foreign Used' || condition === 'Nigerian Used' || condition === 'Refurbished' ? condition : 'Brand New') as any,
      description: description.trim() || `${title.trim()} in excellent condition. Available for inspection and immediate pickup/delivery.`,
      inStock: true,
      createdAt: 'Just now'
    };

    onAddProduct(newProduct);
    setPublishedProduct(newProduct);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="komback-sell-page" className="min-h-screen bg-slate-50 md:py-6 pb-28">
      {/* Mobile App Container */}
      <div className="max-w-xl mx-auto bg-white min-h-screen md:min-h-0 md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden">
        
        {/* App Bar / Top Navigation (Mobile App style) */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="sell-back-button"
              type="button"
              onClick={() => setCurrentPage('home')}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Post an Ad</h1>
              <p className="text-[11px] text-slate-500">Sell to millions of buyers in Nigeria</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6">

          {/* 1. Photos Section (Mobile App Grid) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Photos <span className="text-slate-400 font-normal">({photos.length}/8)</span>
              </label>
              <span className="text-[11px] text-primary-600 font-semibold">First photo is cover</span>
            </div>

            {/* Hidden native file input */}
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />

            {/* Photo Thumbnails & Upload Button Grid */}
            <div className="grid grid-cols-4 gap-2.5">
              {/* Add Photo Button */}
              {photos.length < 8 && (
                <button
                  id="add-photo-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-primary-300 hover:border-primary-500 bg-primary-50/50 hover:bg-primary-50 active:scale-95 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-primary-700">+ Add</span>
                </button>
              )}

              {/* Uploaded Photos */}
              {photos.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={src} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  
                  {/* Cover Badge on first image */}
                  {index === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/75 text-white text-[9px] font-black rounded uppercase tracking-wide">
                      Cover
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            {photos.length === 0 && (
              <p className="text-[11px] text-slate-400 mt-2">
                Tap "+ Add" to upload clear photos from your phone camera or gallery.
              </p>
            )}
          </div>

          {/* 2. Ad Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ad Title <span className="text-red-500">*</span>
            </label>
            <input
              id="sell-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 13 Pro Max 256GB Sierra Blue"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          {/* 3. Category (Dropdown Select aligned with Home Hero categories) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="sell-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-semibold text-slate-900 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a Category *</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {/* Quick Category Chips for One-Tap Selection */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    category === cat.slug
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {cat.icon} {cat.name.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Location (Manual Input + Quick Suggestion Chips) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="sell-location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Type your area, city or market (e.g. Computer Village Ikeja, Lagos)"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>
            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    location.toLowerCase() === loc.toLowerCase()
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Price & Negotiable */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Price (₦) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">₦</span>
                <input
                  id="sell-price-input"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full pl-8 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-bold text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Negotiable Toggle Pill */}
              <button
                type="button"
                onClick={() => setIsNegotiable(!isNegotiable)}
                className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isNegotiable 
                    ? 'bg-primary-50 text-primary-700 border-primary-300'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${
                  isNegotiable ? 'bg-primary-600' : 'bg-slate-300'
                }`}>
                  {isNegotiable && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>Negotiable</span>
              </button>
            </div>
          </div>

          {/* 6. Condition (Quick Tap Pills or Custom) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Item Condition
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {QUICK_CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                    condition === cond
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Or type custom condition (e.g. Minor scratches, Fairly Used)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* 7. Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="sell-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details: condition, reason for selling, accessories included..."
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
            />
          </div>

          {/* Seller account note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
            <span>Posting from your verified seller account. Your contact details will automatically be attached to this listing.</span>
          </div>

          {/* Desktop Submit Button (Visible only on md+) */}
          <div className="hidden md:block pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-primary-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Post Ad Now</span>
            </button>
          </div>

        </form>

        {/* 📱 Sticky Mobile Bottom Post Action Bar (Native App Style) */}
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Price</span>
              <span className="text-base font-extrabold text-slate-900 leading-none">
                {price ? `₦${Number(price).toLocaleString('en-NG')}` : '₦0'}
              </span>
            </div>
            <button
              id="mobile-submit-post-ad-btn"
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 px-5 rounded-xl bg-primary-600 active:scale-95 text-white font-black text-sm shadow-md shadow-primary-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Post Ad Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* Success Modal Sheet */}
      {publishedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 text-center shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Your Ad is Now Live!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your listing has been published to Komback and is visible to buyers across Nigeria.
            </p>

            {/* Product card summary */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-left">
              <img 
                src={publishedProduct.images[0]} 
                alt={publishedProduct.title} 
                className="w-14 h-14 rounded-lg object-cover bg-slate-200 shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">{publishedProduct.title}</h4>
                <p className="text-xs font-black text-primary-600 mt-0.5">
                  ₦{publishedProduct.price.toLocaleString('en-NG')}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{publishedProduct.location}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onViewProduct(publishedProduct);
                  setPublishedProduct(null);
                }}
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-primary-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>View Live Listing</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishedProduct(null);
                  handleResetForm();
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                + Post Another Item
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishedProduct(null);
                  setCurrentPage('home');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer py-1"
              >
                Back to Marketplace Home
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
