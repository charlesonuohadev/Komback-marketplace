import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Heart, 
  ShoppingCart, 
  User, 
  PlusCircle, 
  ShieldCheck, 
  Menu, 
  X,
  Store,
  Flame,
  Layers,
  ChevronDown,
  Sparkles,
  Info,
  Truck
} from 'lucide-react';
import { PageType } from '../types';
import { useMarketplace } from '../context/AppContext';

interface HeaderProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  selectedLocation?: string;
  setSelectedLocation?: (location: string) => void;
  selectedState?: string;
  setSelectedState?: (state: string) => void;
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string, category?: string, location?: string) => void;
  wishlistCount: number;
  cartCount: number;
  openSellModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  selectedLocation,
  setSelectedLocation,
  selectedState,
  setSelectedState,
  selectedCategory = 'all',
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onSearch,
  wishlistCount,
  cartCount,
  openSellModal
}) => {
  const { categories, reference } = useMarketplace();
  const activeLocation = selectedLocation || selectedState || 'All Nigeria';
  const handleLocationChange = (loc: string) => {
    if (setSelectedLocation) setSelectedLocation(loc);
    if (setSelectedState) setSelectedState(loc);
  };

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedCat, setSelectedCat] = useState(selectedCategory);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setSearchQuery) setSearchQuery(localSearch);
    if (setSelectedCategory) setSelectedCategory(selectedCat);
    onSearch(localSearch, selectedCat === 'all' ? undefined : selectedCat, activeLocation);
  };

  return (
    <header id="komback-main-header" className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      
      {/* 1. Top Bar: Clean, uncluttered, no-wrap banner */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left notice */}
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
            <span className="font-semibold text-emerald-400 whitespace-nowrap">🇳🇬 Nigeria's Marketplace</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-300 truncate">
              Buy, Sell & Connect across all 36 States & FCT
            </span>
          </div>

          {/* Right quick actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-slate-300 shrink-0">
            <button 
              id="header-safety-btn"
              onClick={() => setCurrentPage('safety')}
              className="hover:text-emerald-300 flex items-center gap-1 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Trust & Safety</span>
            </button>
            <span className="hidden sm:inline text-slate-600">|</span>
            <button 
              id="header-track-order-btn"
              onClick={() => setCurrentPage('track-order')} 
              className="hidden sm:inline hover:text-white transition-colors cursor-pointer text-xs"
            >
              Track Orders
            </button>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline font-medium text-emerald-300 text-xs">Currency: NGN (₦)</span>
          </div>

        </div>
      </div>

      {/* 2. Main Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Official Logo */}
          <div className="flex items-center shrink-0">
            <button 
              id="komback-logo-btn"
              onClick={() => setCurrentPage('home')}
              className="flex items-center group focus:outline-hidden cursor-pointer py-0.5"
            >
              <img 
                src="/images/logo.png" 
                alt="KOMBACK" 
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </button>
          </div>

          {/* Desktop Search Bar (Tablet & Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-2">
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center bg-slate-100 border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 rounded-xl overflow-hidden transition-all">
              <select
                id="header-category-select"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 py-2.5 pl-3 pr-2 border-r border-slate-300 focus:outline-hidden cursor-pointer shrink-0"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 flex items-center">
                <input
                  id="header-global-search-input"
                  type="text"
                  placeholder="Search phones, cars, fashion, electronics, solar..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-transparent py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                />
                {localSearch && (
                  <button 
                    type="button" 
                    onClick={() => setLocalSearch('')}
                    className="p-1 mr-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                id="header-search-submit-btn"
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Location Selector (Nigeria State Filter) */}
          <div className="relative">
            <button
              id="header-location-dropdown-btn"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
              title="Filter by Nigerian State / Market Hub"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="max-w-[70px] sm:max-w-[110px] truncate">{activeLocation.replace('State', '').trim()}</span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </button>

            {isLocationOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Select State / City</span>
                  <button onClick={() => setIsLocationOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {reference.states.map((st) => (
                    <button
                      key={st}
                      id={`location-opt-${st.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        handleLocationChange(st);
                        setIsLocationOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors cursor-pointer ${
                        activeLocation === st ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span>{st}</span>
                      {activeLocation === st && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Wishlist (Visible on tablet & desktop; mobile has it in bottom nav) */}
            <button
              id="header-wishlist-btn"
              onClick={() => setCurrentPage('wishlist')}
              className={`hidden md:flex relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                currentPage === 'wishlist' ? 'bg-slate-100 text-rose-600' : ''
              }`}
              title="Saved Items / Wishlist"
            >
              <Heart className={`w-5 h-5 ${currentPage === 'wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Account (Visible on tablet & desktop; mobile has it in bottom nav) */}
            <button
              id="header-account-btn"
              onClick={() => setCurrentPage('account')}
              className={`hidden md:flex p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors items-center gap-1 cursor-pointer ${
                currentPage === 'account' ? 'bg-slate-100 text-emerald-700' : ''
              }`}
              title="My Account"
            >
              <User className="w-5 h-5" />
              <span className="hidden xl:inline text-xs font-semibold">Account</span>
            </button>

            {/* Cart Button (Always visible with badge) */}
            <button
              id="header-cart-btn"
              onClick={() => setCurrentPage('cart')}
              className={`relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                currentPage === 'cart' ? 'bg-slate-100 text-emerald-700' : ''
              }`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* + SELL Button (Visible on sm+ screens; mobile has prominent center button in bottom nav) */}
            <button
              id="header-sell-cta-btn"
              onClick={openSellModal}
              className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer ring-2 ring-emerald-400/20 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-emerald-100 stroke-[2.5]" />
              <span className="tracking-wide">+ SELL</span>
            </button>

            {/* Mobile menu drawer toggle button */}
            <button
              id="header-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer"
              title="Explore Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
            </button>

          </div>
        </div>

        {/* 3. Mobile Dedicated Search Bar (Clean, spacious, full-width) */}
        <div className="lg:hidden mt-2 pt-0.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-slate-100 border border-slate-200/90 rounded-2xl overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <div className="pl-3.5 text-emerald-600 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="mobile-search-input"
              type="text"
              placeholder="Search phones, cars, solar, laptops..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-transparent py-2.5 px-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="mobile-search-submit-btn"
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-xs shrink-0 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* 4. Mobile Expanded Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
            
            {/* Quick Navigation Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button 
                onClick={() => { setCurrentPage('products'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-800 text-left border border-slate-100 transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>All Categories</span>
              </button>
              <button 
                onClick={() => { setCurrentPage('deals'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-800 text-left border border-slate-100 transition-colors cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Flash Deals</span>
              </button>
              <button 
                onClick={() => { setCurrentPage('stores'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-800 text-left border border-slate-100 transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Verified Stores</span>
              </button>
              <button 
                onClick={() => { setCurrentPage('safety'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-800 text-left border border-slate-100 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Buyer Safety</span>
              </button>
              <button 
                onClick={() => { setCurrentPage('track-order'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-900 text-left border border-emerald-200 transition-colors cursor-pointer font-bold"
              >
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Track Orders</span>
              </button>
              <button 
                onClick={() => { setCurrentPage('about-us'); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-800 text-left border border-slate-100 transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 text-emerald-600" />
                <span>About Us</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

