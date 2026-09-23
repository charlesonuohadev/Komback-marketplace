import React from 'react';
import { Product, Store, BlogPost, PageType } from '../types';
import { Hero } from '../components/Hero';
import { QuickCategories } from '../components/QuickCategories';
import { TrendingNow } from '../components/TrendingNow';
import { DealsNearYou } from '../components/DealsNearYou';
import { TodaysDeals } from '../components/TodaysDeals';
import { TopStores } from '../components/TopStores';
import { WhyKomback } from '../components/WhyKomback';
import { SellBanner } from '../components/SellBanner';
import { CustomerReviews } from '../components/CustomerReviews';
import { MobileAppPromo } from '../components/MobileAppPromo';
import { BlogSection } from '../components/BlogSection';
import { Newsletter } from '../components/Newsletter';

interface HomePageProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onViewStore: (store: Store) => void;
  onSelectArticle: (article: BlogPost) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onSelectCategory: (categorySlug: string) => void;
  onSearch: (query: string, category?: string, location?: string) => void;
  openSellModal: () => void;
  setCurrentPage: (page: PageType) => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
  onCompare?: (product: Product, e: React.MouseEvent) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onViewProduct,
  onViewStore,
  onSelectArticle,
  wishlistIds,
  onToggleWishlist,
  onSelectCategory,
  onSearch,
  openSellModal,
  setCurrentPage,
  onQuickView,
  onCompare
}) => {
  return (
    <div id="komback-home-page" className="w-full">
      {/* 3. Hero Section */}
      <Hero
        onSearch={onSearch}
        onSelectPopularTag={(tag) => onSearch(tag)}
        openSellModal={openSellModal}
      />

      {/* 4. Quick Categories */}
      <QuickCategories
        onSelectCategory={onSelectCategory}
        onViewAllCategories={() => setCurrentPage('products')}
      />

      {/* 5. 🔥 Trending Now */}
      <TrendingNow
        products={products}
        onViewProduct={onViewProduct}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        onViewAllTrending={() => setCurrentPage('products')}
        onQuickView={onQuickView}
      />

      {/* 6. 📍 Deals Near You */}
      <DealsNearYou
        products={products}
        onViewProduct={onViewProduct}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        onExploreCity={(city) => onSearch('', undefined, city)}
        onQuickView={onQuickView}
      />

      {/* 7. 🔥 Today's Best Deals */}
      <TodaysDeals
        products={products}
        onViewProduct={onViewProduct}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        onViewAllDeals={() => setCurrentPage('deals')}
        onQuickView={onQuickView}
      />

      {/* 8. 🏪 Top Komback Stores */}
      <TopStores
        onViewStore={onViewStore}
        onViewAllStores={() => setCurrentPage('stores')}
      />

      {/* 9. 🛡️ Why Shop on Komback? */}
      <WhyKomback
        onLearnMore={() => setCurrentPage('safety')}
      />

      {/* 10. 💰 Sell on Komback */}
      <SellBanner
        openSellModal={openSellModal}
      />

      {/* 11. ❤️ Customer Reviews */}
      <CustomerReviews />

      {/* 13. 📱 Komback Mobile App */}
      <MobileAppPromo />

      {/* 14. 📰 From the Komback Blog */}
      <BlogSection
        onSelectArticle={onSelectArticle}
        onViewAllBlog={() => setCurrentPage('blog')}
      />

      {/* 15. Newsletter */}
      <Newsletter />
    </div>
  );
};
