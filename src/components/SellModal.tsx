import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { X, Camera, CheckCircle2, MapPin, Tag, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { useMarketplace } from '../context/AppContext';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (newProduct: Product) => void;
}

const QUICK_CATEGORIES = ['Phones & Tablets', 'Vehicles', 'Electronics', 'Fashion', 'Real Estate', 'Home & Furniture'];
const QUICK_LOCATIONS = ['Ikeja, Lagos', 'Lekki, Lagos', 'Wuse 2, Abuja', 'Port Harcourt', 'Ibadan', 'Onitsha'];
const QUICK_CONDITIONS = ['Brand New', 'Used (Clean)', 'Tokunbo', 'Refurbished'];

export const SellModal: React.FC<SellModalProps> = ({
  isOpen,
  onClose,
  onAddProduct
}) => {
  const { categories } = useMarketplace();

  if (!isOpen) return null;

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState('Brand New');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter an ad title');
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
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid price greater than ₦0');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Please enter your location');
      return;
    }

    const imageList = photos.length > 0 ? photos : [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    ];

    // Canonical category matching aligned with Home Hero categories
    const matchedCategory = categories.find(
      (c) => c.slug === category || c.name.toLowerCase() === category.toLowerCase()
    );
    const categoryName = matchedCategory ? matchedCategory.name : (category.trim() || 'General Items');
    const categorySlug = matchedCategory ? matchedCategory.slug : 'other';

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      title: title.trim(),
      price: numPrice,
      originalPrice: isNegotiable ? numPrice * 1.15 : undefined,
      category: categoryName,
      categorySlug: categorySlug,
      location: location.trim(),
      state: location.includes(',') ? location.split(',')[1].trim() : 'Lagos',
      images: imageList,
      description: description.trim() || `${title.trim()} available for inspection.`,
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
      inStock: true,
      createdAt: 'Just now'
    };

    onAddProduct(newProduct);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Post an Ad</h3>
            <p className="text-[11px] text-slate-500">Sell fast to buyers across Nigeria</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Ad Published Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your listing is now live in the marketplace feed with your verified seller contact info.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-600/30 cursor-pointer mt-4"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Photos ({photos.length}/8)</label>
                  <span className="text-[10px] text-primary-600 font-semibold">First is cover</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-4 gap-2">
                  {photos.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-primary-300 hover:border-primary-500 bg-primary-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-primary-600" />
                      <span className="text-[10px] font-bold text-primary-700">+ Add</span>
                    </button>
                  )}
                  {photos.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 px-1 py-0.2 bg-black/75 text-white text-[8px] font-black rounded uppercase">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. iPhone 13 Pro Max 256GB"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Category (Dropdown select aligned with Home Hero categories) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <div className="relative">
                  <select
                    id="modal-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select Category *</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {categories.slice(0, 6).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.slug)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                        category === cat.slug
                          ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold'
                          : 'border-slate-200 hover:border-primary-400 bg-white text-slate-600'
                      }`}
                    >
                      {cat.icon} {cat.name.split('&')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (Manual text input + quick chips) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Type area or city (e.g. Computer Village Ikeja, Lagos)"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200 hover:border-primary-400 bg-white text-slate-600"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Negotiable */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price (₦) *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₦</span>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNegotiable(!isNegotiable)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 ${
                      isNegotiable ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isNegotiable && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>Negotiable</span>
                  </button>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCondition(cond)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border ${
                        condition === cond ? 'bg-primary-600 text-white border-primary-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details, condition, reason for selling..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Note */}
              <p className="text-[11px] text-slate-400">
                ✓ Uses your verified seller account info automatically.
              </p>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-primary-600/30 cursor-pointer mt-2"
              >
                Post Ad Now
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
