import React, { useState, useEffect } from 'react';
import { Product, Store, BlogPost, PageType } from './types';
import { useMarketplace } from './context/AppContext';
import { api } from './lib/api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChatModal } from './components/ChatModal';
import { SellModal } from './components/SellModal';
import { QuickViewModal } from './components/QuickViewModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { StoresPage } from './pages/StoresPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { DealsPage } from './pages/DealsPage';
import { BlogPage } from './pages/BlogPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { SafetyPage } from './pages/SafetyPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { SellPage } from './pages/SellPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { getPathForPage, parsePath, navigateTo } from './utils/navigation';
import { findProductBySlugOrId } from './utils/slug';
import { SeoHead } from './components/SeoHead';

export function App() {
  const {
    products,
    stores,
    blogPosts,
    loading,
    error,
    cart,
    cartCount: totalCartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    wishlistIds,
    toggleWishlist,
    user,
    store,
    setProducts,
    refreshProducts,
    refreshStores,
  } = useMarketplace();

  // Navigation & Page State - Initialized directly from current URL pathname
  const initialRoute = typeof window !== 'undefined' ? parsePath(window.location.pathname) : { page: 'home' as PageType };

  const [currentPage, setCurrentPage] = useState<PageType>(initialRoute.page);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [seoPath, setSeoPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Deep links are resolved once the catalog has arrived from PostgreSQL.
  useEffect(() => {
    const slugOrId = initialRoute.productSlug || initialRoute.productId;
    if (slugOrId && !selectedProduct && products.length > 0) {
      setSelectedProduct(findProductBySlugOrId(products, slugOrId) ?? null);
    }
  }, [initialRoute.productId, initialRoute.productSlug, products, selectedProduct]);

  useEffect(() => {
    if (initialRoute.storeId && !selectedStore && stores.length > 0) {
      setSelectedStore(stores.find((s) => s.id === initialRoute.storeId) ?? null);
    }
  }, [initialRoute.storeId, stores, selectedStore]);

  useEffect(() => {
    if (initialRoute.articleId && !selectedArticle && blogPosts.length > 0) {
      setSelectedArticle(blogPosts.find((b) => b.id === initialRoute.articleId) ?? null);
    }
  }, [initialRoute.articleId, blogPosts, selectedArticle]);

  // Search & Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialRoute.categorySlug || 'all');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Nigeria');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [chatStore, setChatStore] = useState<Store | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize browser URL bar and History permalink whenever route/page changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = getPathForPage(currentPage, {
      product: selectedProduct,
      store: selectedStore,
      article: selectedArticle,
      categorySlug: selectedCategory,
    });

    if (window.location.pathname !== path) {
      navigateTo(path);
    }
    setSeoPath(path);
  }, [currentPage, selectedProduct, selectedStore, selectedArticle, selectedCategory]);

  // Handle browser Back / Forward buttons (popstate events)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePath(window.location.pathname);
      setCurrentPage(parsed.page);
      if (parsed.productId || parsed.productSlug) {
        const slugOrId = parsed.productSlug || parsed.productId || '';
        const prod = findProductBySlugOrId(products, slugOrId) || null;
        setSelectedProduct(prod);
      }
      if (parsed.storeId) {
        const str = stores.find((s) => s.id === parsed.storeId) || null;
        setSelectedStore(str);
      }
      if (parsed.articleId) {
        const art = blogPosts.find((b) => b.id === parsed.articleId) || null;
        setSelectedArticle(art);
      }
      if (parsed.categorySlug) {
        setSelectedCategory(parsed.categorySlug);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, stores, blogPosts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewStore = (store: Store) => {
    setSelectedStore(store);
    setCurrentPage('store-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (article: BlogPost) => {
    setSelectedArticle(article);
    setCurrentPage('blog-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string, category?: string, location?: string) => {
    if (query !== undefined) setSearchQuery(query);
    if (category) setSelectedCategory(category);
    if (location) setSelectedLocation(location);
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleWishlist = async (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const wishlisted = await toggleWishlist(product);
    showToast(
      wishlisted
        ? `Saved "${product.title}" to Wishlist!`
        : `Removed "${product.title}" from Wishlist`
    );
  };

  const handleAddToCart = async (product: Product, quantity = 1) => {
    await addToCart(product, quantity);
    showToast(`Added "${product.title}" to Cart!`);
  };

  const handleBuyNow = async (product: Product) => {
    await handleAddToCart(product, 1);
    setCurrentPage('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQuantity = async (productId: string, delta: number) => {
    await updateCartQuantity(productId, delta);
  };

  const handleRemoveFromCart = async (productId: string) => {
    await removeFromCart(productId);
    showToast('Item removed from cart');
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleOpenChat = (product?: Product, store?: Store) => {
    setChatProduct(product || null);
    setChatStore(store || null);
    setIsChatModalOpen(true);
  };

  const handleQuickView = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  /**
   * Publishing a listing writes straight through to PostgreSQL. Only signed-in
   * merchants with a storefront can publish.
   */
  const handleAddUserProduct = async (newProduct: Product) => {
    if (!user || !store) {
      showToast('Sign in with a merchant account to publish a listing.');
      setCurrentPage('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const res = await api.seller.createProduct({
        title: newProduct.title,
        price: newProduct.price,
        originalPrice: newProduct.originalPrice,
        description: newProduct.description,
        features: newProduct.features,
        images: newProduct.images,
        condition: newProduct.condition,
        category: newProduct.categorySlug || newProduct.category,
        location: newProduct.location,
        state: newProduct.state,
        inStock: newProduct.inStock,
        isDeal: newProduct.isDeal,
        isTrending: newProduct.isTrending,
      });
      setProducts((prev) => [res.product, ...prev]);
      showToast(`Your listing "${res.product.title}" is now LIVE!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not publish your listing');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const res = await api.seller.updateProduct(updatedProduct.id, {
        title: updatedProduct.title,
        price: updatedProduct.price,
        originalPrice: updatedProduct.originalPrice,
        description: updatedProduct.description,
        features: updatedProduct.features,
        images: updatedProduct.images,
        condition: updatedProduct.condition,
        category: updatedProduct.categorySlug || updatedProduct.category,
        location: updatedProduct.location,
        state: updatedProduct.state,
        inStock: updatedProduct.inStock,
      });
      setProducts((prev) => prev.map((p) => (p.id === res.product.id ? res.product : p)));
      showToast(`Updated "${res.product.title}"!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update the listing');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.seller.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Listing removed from store');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove the listing');
    }
  };

  const handleSyncProducts = async () => {
    try {
      const res = await api.seller.syncWooCommerce();
      await Promise.all([refreshProducts(), refreshStores()]);
      showToast(`Synchronized ${res.synced} items from komback.com`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  const handleOpenSell = () => {
    setCurrentPage('sell');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="komback-app-root" className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-['Inter',sans-serif] selection:bg-emerald-600 selection:text-white pb-16 md:pb-0">
      <SeoHead path={seoPath} />

      {/* Database connectivity banner */}
      {error && (
        <div className="bg-rose-600 text-white text-xs font-bold px-4 py-2.5 text-center">
          {error}
        </div>
      )}
      {loading && !error && (
        <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 text-center">
          Loading marketplace data…
        </div>
      )}
      
      {/* 1. Header (Blueprint Page 5, 6, 29) */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={handleSearch}
        wishlistCount={wishlistIds.length}
        cartCount={totalCartCount}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        openSellModal={handleOpenSell}
      />

      {/* 2. Navigation Bar (Blueprint Page 6, 30) */}
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Page Routing Switch */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            products={products}
            onViewProduct={handleViewProduct}
            onViewStore={handleViewStore}
            onSelectArticle={handleSelectArticle}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onSelectCategory={handleSelectCategory}
            onSearch={handleSearch}
            openSellModal={handleOpenSell}
            setCurrentPage={setCurrentPage}
            onQuickView={handleQuickView}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            onViewProduct={handleViewProduct}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            initialCategory={selectedCategory}
            initialQuery={searchQuery}
            initialLocation={selectedLocation}
            onQuickView={handleQuickView}
          />
        )}

        {currentPage === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            allProducts={products}
            onBack={() => setCurrentPage('products')}
            onViewProduct={handleViewProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onChatWithSeller={(p) => handleOpenChat(p)}
            onViewStore={handleViewStore}
            isWishlisted={wishlistIds.includes(selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {currentPage === 'product-detail' && !selectedProduct && (
          <div className="max-w-4xl mx-auto py-16 px-4 text-center">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xs max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 text-2xl">
                🔍
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                Listing Not Found
              </h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                This item may have been purchased, archived by the seller, or the URL might have a typo.
              </p>
              <button
                onClick={() => setCurrentPage('products')}
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Browse All Marketplace Listings
              </button>
            </div>
          </div>
        )}

        {currentPage === 'track-order' && (
          <TrackOrderPage
            setCurrentPage={setCurrentPage}
            onViewProduct={handleViewProduct}
            sampleProduct={selectedProduct || products[0]}
          />
        )}

        {currentPage === 'stores' && (
          <StoresPage
            onViewStore={handleViewStore}
            openSellModal={handleOpenSell}
          />
        )}

        {currentPage === 'store-detail' && selectedStore && (
          <StoreDetailPage
            store={selectedStore}
            allProducts={products}
            onBack={() => setCurrentPage('stores')}
            onViewProduct={handleViewProduct}
            onChatWithStore={(s) => handleOpenChat(undefined, s)}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {currentPage === 'deals' && (
          <DealsPage
            products={products}
            onViewProduct={handleViewProduct}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {currentPage === 'blog' && (
          <BlogPage
            onSelectArticle={handleSelectArticle}
          />
        )}

        {currentPage === 'blog-detail' && selectedArticle && (
          <BlogDetailPage
            article={selectedArticle}
            onBack={() => setCurrentPage('blog')}
            onSelectArticle={handleSelectArticle}
            allArticles={blogPosts}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            cart={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onViewProduct={handleViewProduct}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'wishlist' && (
          <WishlistPage
            products={products}
            wishlistIds={wishlistIds}
            onViewProduct={handleViewProduct}
            onToggleWishlist={handleToggleWishlist}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'account' && (
          <AccountPage
            products={products}
            openSellModal={handleOpenSell}
            onViewProduct={handleViewProduct}
            setCurrentPage={setCurrentPage}
            onAddProduct={handleAddUserProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onSyncProducts={handleSyncProducts}
            onViewStore={handleViewStore}
          />
        )}

        {currentPage === 'sell' && (
          <SellPage
            onAddProduct={handleAddUserProduct}
            onViewProduct={handleViewProduct}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'safety' && (
          <SafetyPage
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'about-us' && (
          <AboutUsPage
            setCurrentPage={setCurrentPage}
            openSellModal={handleOpenSell}
          />
        )}
      </main>

      {/* 16. Footer (Blueprint Page 10, 11, 31) */}
      <Footer
        setCurrentPage={setCurrentPage}
        openSellModal={handleOpenSell}
        onSelectCategory={handleSelectCategory}
      />

      {/* 📱 5-Button Mobile Bottom Navigation (Blueprint Page 12) */}
      <MobileBottomNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        openSellModal={handleOpenSell}
        wishlistCount={wishlistIds.length}
      />

      {/* Interactive Modals */}
      {/* 1. Real-time Seller Chat Modal (Blueprint Page 16, 33) */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        product={chatProduct}
        store={chatStore}
      />

      {/* 2. + SELL Listing Wizard Modal */}
      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onAddProduct={handleAddUserProduct}
      />

      {/* 3. Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onViewProductFull={handleViewProduct}
        onAddToCart={handleAddToCart}
        onChatWithSeller={(p) => handleOpenChat(p)}
        isWishlisted={quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Notification Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default App;
