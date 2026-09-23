import React from 'react';
import { ArrowRight, Trophy } from 'lucide-react';

interface FeaturedCategoriesProps {
  onSelectCategory: (categorySlug: string) => void;
}

export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({
  onSelectCategory
}) => {
  // Top categories from blueprint
  const featured = [
    {
      slug: 'phones-tablets',
      name: 'Phones & Tablets',
      icon: '📱',
      ctaText: 'Shop Phones & Tablets →',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
      description: 'Brand new & UK Used iPhones, Samsung, Pixels & accessories',
      badge: 'High Demand'
    },
    {
      slug: 'vehicles',
      name: 'Cars & Vehicles',
      icon: '🚗',
      ctaText: 'Find Your Next Car →',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
      description: 'Tokunbo & Nigerian used cars with customs clearance',
      badge: 'Verified Dealers'
    },
    {
      slug: 'fashion',
      name: 'Fashion & Native Wear',
      icon: '👗',
      ctaText: 'Shop Fashion & Style →',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80',
      description: 'Bespoke Senator attires, Agbada, designer sneakers & bags',
      badge: 'Trending Styles'
    },
    {
      slug: 'real-estate',
      name: 'Real Estate & Property',
      icon: '🏠',
      ctaText: 'Find Your Property →',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      description: 'Duplexes, apartments, shortlets & verified title lands',
      badge: 'Checked Titles'
    },
    {
      slug: 'electronics',
      name: 'Electronics & Laptops',
      icon: '💻',
      ctaText: 'Shop Laptops & Tech →',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      description: 'MacBooks, Dell XPS, Solar Inverters, 4K TVs & Audio',
      badge: 'Warranty Guaranteed'
    },
    {
      slug: 'beauty',
      name: 'Beauty & Luxury Hair',
      icon: '💄',
      ctaText: 'Shop Beauty & Hair →',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      description: 'Bone straight wigs, raw virgin bundles, perfumes & skincare',
      badge: '100% Human Hair'
    }
  ];

  return (
    <section id="komback-featured-categories" className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Trophy className="w-5 h-5" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Featured Categories
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Explore our most active trading hubs with thousands of verified listings
            </p>
          </div>
        </div>

        {/* 6 Category Spotlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item) => (
            <div
              key={item.slug}
              id={`featured-cat-card-${item.slug}`}
              onClick={() => onSelectCategory(item.slug)}
              className="group relative rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 cursor-pointer h-72 flex flex-col justify-end p-6"
            >
              {/* Background Image with Gradient */}
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

              {/* Top Badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold">
                  {item.badge}
                </span>
              </div>

              {/* Content */}
              <div className="relative z-10 text-white">
                <div className="text-2xl mb-1">{item.icon}</div>
                <h3 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-emerald-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                  {item.description}
                </p>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                    <span>{item.ctaText}</span>
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-emerald-500 flex items-center justify-center text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
