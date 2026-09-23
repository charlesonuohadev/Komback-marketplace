import React from 'react';
import { CheckCircle2, TrendingUp, ShieldCheck, ArrowRight, PlusCircle, Sparkles } from 'lucide-react';

interface HeroProps {
  onSearch: (query: string, category?: string, location?: string) => void;
  onSelectPopularTag: (tag: string) => void;
  openSellModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSelectPopularTag,
  openSellModal
}) => {
  const popularTags = [
    'iPhone',
    'Toyota Cars',
    'Sneakers',
    'Laptops',
    'Lekki Houses',
    'Fashion',
    'Solar Inverters',
    'PlayStation 5'
  ];

  const handleScrollToCategories = () => {
    const el = document.getElementById('komback-quick-categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="komback-hero-section" className="relative bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white overflow-hidden py-7 sm:py-14 md:py-20">
      {/* Decorative ambient background elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 text-center">
        
        {/* Sub-badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-semibold mb-3.5 sm:mb-5 shadow-xs">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>KOMBACK • Nigeria's Verified Marketplace</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif] leading-tight max-w-4xl mx-auto">
          Buy & Sell Almost Anything in <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy decoration-2">Nigeria</span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-2.5 sm:mt-4 text-xs sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Discover verified deals from sellers across all 36 States & FCT, or list your items in minutes and connect with ready buyers today.
        </p>

        {/* Action CTAs: 2 side-by-side buttons on mobile for native app ergonomics */}
        <div className="mt-5 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 max-w-md mx-auto">
          <button
            id="hero-explore-categories-btn"
            onClick={handleScrollToCategories}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <span>Explore Categories</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>

          <button
            id="hero-post-ad-btn"
            onClick={openSellModal}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-slate-800 hover:bg-slate-750 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>+ Post Free Ad</span>
          </button>
        </div>

        {/* Popular Trending Keywords: Horizontal swipe rail on mobile */}
        <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-center gap-1.5 sm:gap-2 text-xs max-w-3xl mx-auto">
          <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 mb-1 sm:mb-0">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Popular:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 sm:flex-wrap justify-start sm:justify-center">
            {popularTags.map((tag) => (
              <button
                key={tag}
                id={`hero-popular-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectPopularTag(tag)}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-800/90 hover:bg-emerald-500 hover:text-white active:scale-95 text-slate-300 text-[11px] sm:text-xs font-medium border border-slate-700/60 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Micro-Trust badges */}
        <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-slate-800/80 grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-8 text-[10px] sm:text-xs text-slate-300">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-center sm:text-left">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">100% Verified</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">Escrow Protection</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-center sm:text-left">
            <span className="text-emerald-400 font-bold text-xs sm:text-sm">₦0 Fee</span>
            <span className="font-medium">Free To Sell</span>
          </div>
        </div>

      </div>
    </section>
  );
};
