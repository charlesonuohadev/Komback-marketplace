import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useMarketplace } from '../context/AppContext';
import { Filter, SlidersHorizontal, Search, MapPin, X, CheckCircle2, RotateCcw, ArrowUpDown } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

interface ProductsPageProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  initialCategory?: string;
  initialQuery?: string;
  initialLocation?: string;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
  onCompare?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onViewProduct,
  wishlistIds,
  onToggleWishlist,
  initialCategory,
  initialQuery,
  initialLocation,
  onQuickView,
  onCompare
}) => {
  const { categories, reference } = useMarketplace();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedState, setSelectedState] = useState<string>(initialLocation || 'All Nigeria');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high' | 'rating'>('latest');
  const [maxPrice, setMaxPrice] = useState<number>(300000000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.categorySlug !== selectedCategory) {
        return false;
      }
      // State / Location match
      if (selectedState !== 'All Nigeria') {
        const stateWord = selectedState.split(' ')[0].toLowerCase();
        if (!item.state.toLowerCase().includes(stateWord) && !item.location.toLowerCase().includes(stateWord)) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesSeller = item.seller.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesSeller) {
          return false;
        }
      }
      // Condition
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
        return false;
      }
      // Verified only
      if (onlyVerified && !item.seller.isVerified) {
        return false;
      }
      // Price
      if (item.price > maxPrice) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, selectedCategory, selectedState, searchQuery, selectedCondition, onlyVerified, maxPrice, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedState('All Nigeria');
    setSearchQuery('');
    setSelectedCondition('all');
    setOnlyVerified(false);
    setMaxPrice(300000000);
    setSortBy('latest');
  };

  const activeCategoryObj = categories.find(c => c.slug === selectedCategory);

  return (
    <div id="komback-products-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Title Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span>Home</span>
            <span>/</span>
            <span>Marketplace Listings</span>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{activeCategoryObj.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {activeCategoryObj ? `${activeCategoryObj.icon} ${activeCategoryObj.name}` : 'All Marketplace Listings'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Showing {filteredProducts.length} verified listings across Nigeria
              </p>
            </div>

            {/* Mobile Filter Toggle & Sort Select */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Filters</span>
              </button>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="latest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid with Sidebar Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">Filter Listings</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Search Keyword
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Categories
              </label>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] text-slate-400">{products.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{cat.itemCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location / State */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Location in Nigeria
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-3" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white cursor-pointer"
                >
                  {reference.states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Item Condition
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {['all', 'Brand New', 'UK Used', 'Foreign Used'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCondition(c)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                      selectedCondition === c
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c === 'all' ? 'All Conditions' : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Sellers Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Sellers Only
                  </span>
                  <p className="text-[10px] text-slate-400">ID & physical business verified</p>
                </div>
              </label>
            </div>

          </aside>

          {/* Product Listings Grid */}
          <main className="lg:col-span-9">
            
            {/* Active Filter Badges */}
            {(selectedCategory !== 'all' || selectedState !== 'All Nigeria' || searchQuery || selectedCondition !== 'all' || onlyVerified) && (
              <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Active Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                    Category: {activeCategoryObj?.name}
                    <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3 ml-1" /></button>
                  </span>
                )}
                {selectedState !== 'All Nigeria' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                    State: {selectedState}
                    <button onClick={() => setSelectedState('All Nigeria')}><X className="w-3 h-3 ml-1" /></button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                    Keyword: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 ml-1" /></button>
                  </span>
                )}
                {onlyVerified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                    🟢 Verified Sellers Only
                    <button onClick={() => setOnlyVerified(false)}><X className="w-3 h-3 ml-1" /></button>
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:underline font-bold ml-auto cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-slate-900">No matching products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search keyword, category, or location filters to see more results.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewProduct={onViewProduct}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onQuickView={onQuickView}
                    onCompare={onCompare}
                  />
                ))}
              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  );
};
