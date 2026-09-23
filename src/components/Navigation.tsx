import React from 'react';
import { PageType } from '../types';
import { Sparkles, Store, Flame, Layers, Info } from 'lucide-react';

interface NavigationProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  openSellModal?: () => void;
  onSelectCategory?: (categorySlug: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  setCurrentPage
}) => {
  return (
    <nav id="komback-subnav" className="bg-white border-b border-slate-200 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-2.5 text-sm font-medium">
          
          <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-8 overflow-x-auto no-scrollbar">
            
            {/* Categories */}
            <button
              id="nav-categories-btn"
              onClick={() => setCurrentPage('products')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentPage === 'products' 
                  ? 'text-emerald-700 bg-emerald-50 font-bold shadow-2xs' 
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>All Categories</span>
            </button>

            {/* Deals */}
            <button
              id="nav-deals-btn"
              onClick={() => setCurrentPage('deals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentPage === 'deals' 
                  ? 'text-emerald-700 bg-emerald-50 font-bold shadow-2xs' 
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Flash Deals</span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                HOT
              </span>
            </button>

            {/* Stores */}
            <button
              id="nav-stores-btn"
              onClick={() => setCurrentPage('stores')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentPage === 'stores' || currentPage === 'store-detail'
                  ? 'text-emerald-700 bg-emerald-50 font-bold shadow-2xs' 
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Verified Stores</span>
            </button>

            {/* New Arrivals */}
            <button
              id="nav-new-arrivals-btn"
              onClick={() => setCurrentPage('products')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>New Arrivals</span>
            </button>

            {/* About Us */}
            <button
              id="nav-about-us-btn"
              onClick={() => setCurrentPage('about-us')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentPage === 'about-us'
                  ? 'text-emerald-700 bg-emerald-50 font-bold shadow-2xs'
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
              }`}
            >
              <Info className="w-4 h-4 text-emerald-600" />
              <span>About Us</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
