import React from 'react';
import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { PageType } from '../types';

interface MobileBottomNavProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  openSellModal: () => void;
  wishlistCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  setCurrentPage,
  openSellModal,
  wishlistCount
}) => {
  return (
    <div id="komback-mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        
        {/* 1. Home */}
        <button
          id="mobile-nav-home-btn"
          onClick={() => setCurrentPage('home')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Search / Browse */}
        <button
          id="mobile-nav-search-btn"
          onClick={() => setCurrentPage('products')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'products' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        {/* 3. Prominent + SELL Button (Highlighted Floating Pill) */}
        <button
          id="mobile-nav-sell-btn"
          onClick={openSellModal}
          className="flex flex-col items-center justify-center -mt-5 bg-emerald-600 active:scale-95 text-white p-3 rounded-full shadow-lg shadow-emerald-600/40 ring-4 ring-white cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span className="sr-only">Sell</span>
        </button>

        {/* 4. Wishlist */}
        <button
          id="mobile-nav-wishlist-btn"
          onClick={() => setCurrentPage('wishlist')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'wishlist' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className={`w-5 h-5 ${currentPage === 'wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
          {wishlistCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-rose-500 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Wishlist</span>
        </button>

        {/* 5. Account */}
        <button
          id="mobile-nav-account-btn"
          onClick={() => setCurrentPage('account')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'account' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Account</span>
        </button>

      </div>
    </div>
  );
};
