import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useMarketplace } from '../context/AppContext';

interface QuickCategoriesProps {
  onSelectCategory: (categorySlug: string) => void;
  onViewAllCategories: () => void;
}

export const QuickCategories: React.FC<QuickCategoriesProps> = ({
  onSelectCategory,
  onViewAllCategories
}) => {
  const { categories } = useMarketplace();

  return (
    <section id="komback-quick-categories" className="py-5 sm:py-8 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Shop by Category
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Explore thousands of products and verified services across Nigeria
            </p>
          </div>
          <button
            id="quick-cats-view-all-top-btn"
            onClick={onViewAllCategories}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group cursor-pointer shrink-0"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Categories Grid - 4 columns on mobile for an app grid experience */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`quick-cat-btn-${cat.slug}`}
              onClick={() => onSelectCategory(cat.slug)}
              className="flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 transition-all group cursor-pointer text-center active:scale-95"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white shadow-2xs border border-slate-100 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform mb-1.5">
                {cat.icon}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-1 break-all sm:break-normal">
                {cat.name}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                {cat.itemCount.toLocaleString()} ads
              </span>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
