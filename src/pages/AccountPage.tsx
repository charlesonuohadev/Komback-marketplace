import React, { useEffect, useState } from 'react';
import { Product, PageType, Store as StoreType } from '../types';
import { useMarketplace } from '../context/AppContext';
import { api } from '../lib/api';
import { AuthPanel } from '../components/AuthPanel';
import { 
  Menu, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  Store,
  Truck,
  Package,
  ShoppingBag,
  MessageSquare,
  Wallet,
  LayoutDashboard
} from 'lucide-react';
import { SellerSidebar, SellerDashboardTab } from '../components/seller/SellerSidebar';
import { SellerOverview } from '../components/seller/SellerOverview';
import { SellerProducts } from '../components/seller/SellerProducts';
import { SellerOrders } from '../components/seller/SellerOrders';
import { SellerLogistics } from '../components/seller/SellerLogistics';
import { SellerShopSettings } from '../components/seller/SellerShopSettings';
import { SellerMessages } from '../components/seller/SellerMessages';
import { SellerWallet } from '../components/seller/SellerWallet';
import { SellerWooCommerce } from '../components/seller/SellerWooCommerce';

interface AccountPageProps {
  products: Product[];
  openSellModal: () => void;
  onViewProduct: (product: Product) => void;
  setCurrentPage: (page: PageType) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onSyncProducts?: (products: Product[]) => void;
  onViewStore?: (store: StoreType) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  products,
  openSellModal,
  onViewProduct,
  setCurrentPage,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSyncProducts,
  onViewStore
}) => {
  const { store: sessionStore, user, authReady, logout, refreshStores } = useMarketplace();

  // Active store — the storefront owned by the signed-in merchant account.
  const [currentStore, setCurrentStore] = useState<StoreType | null>(sessionStore);

  useEffect(() => {
    setCurrentStore(sessionStore);
  }, [sessionStore]);

  // Dashboard counters are read from the database rather than hard-coded.
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    if (!sessionStore) return;
    let cancelled = false;

    (async () => {
      try {
        const [messagesRes, ordersRes] = await Promise.all([
          api.seller.messages(),
          api.orders.sellerOrders(),
        ]);
        if (cancelled) return;
        setUnreadMessages(messagesRes.threads.filter((thread) => thread.unread).length);
        setPendingOrders(
          ordersRes.orders.filter((order) => order.status === 'Escrow Secured').length
        );
      } catch {
        // Badges are non-critical; leave them at zero if the API is unreachable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionStore]);

  // Active dashboard navigation tab
  const [activeTab, setActiveTab] = useState<SellerDashboardTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Local handler fallbacks if parent does not provide
  const handleAddProduct = (newProd: Product) => {
    if (onAddProduct) {
      onAddProduct(newProd);
    }
  };

  const handleUpdateProduct = (updated: Product) => {
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (onDeleteProduct) {
      onDeleteProduct(productId);
    }
  };

  const handleViewPublicStorefront = () => {
    if (onViewStore && currentStore) {
      onViewStore(currentStore);
    } else {
      setCurrentPage('stores');
    }
  };

  const handleUpdateStore = async (updated: StoreType) => {
    try {
      const res = await api.seller.updateStore({
        name: updated.name,
        tagline: updated.tagline,
        description: updated.description,
        location: updated.location,
        state: updated.state,
        phone: updated.phone,
        email: updated.email,
        avatar: updated.avatar,
        coverImage: updated.coverImage,
      });
      setCurrentStore(res.store);
      await refreshStores();
    } catch (err) {
      console.error('[komback] failed to save store settings', err);
    }
  };

  const mobileNavPills: { id: SellerDashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: `Products (${products.length})`, icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'shop', label: 'My Shop', icon: Store },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'woocommerce', label: 'Import', icon: ExternalLink },
  ];

  if (!authReady) {
    return (
      <div className="py-20 text-center text-xs font-bold text-slate-500">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-10 sm:py-14 bg-[#F8FAFC] min-h-screen">
        <AuthPanel intent="seller" />
        <p className="text-center text-xs text-slate-500 mt-4">
          Sign in to manage your storefront, orders, logistics and wallet.
        </p>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="py-10 sm:py-14 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-md mx-auto text-center mb-6 px-4">
          <h2 className="text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Start selling on Komback
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            You are signed in as {user.email}, but this account has no storefront yet. Create one
            below to unlock the seller dashboard.
          </p>
        </div>
        <AuthPanel intent="seller" />
      </div>
    );
  }

  return (
    <div id="komback-seller-dashboard" className="min-h-screen bg-[#F8FAFC] w-full max-w-full overflow-x-hidden">
      {/* Top Seller Bar for Mobile & Compact Navigation */}
      <div className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Seller Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                Seller Hub
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 font-medium truncate hidden sm:inline">
                {currentStore.name}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mt-0.5 capitalize truncate">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'products' && 'Products & Inventory'}
              {activeTab === 'orders' && 'Orders, Waybills & Escrow'}
              {activeTab === 'logistics' && 'Logistics & Handover PIN'}
              {activeTab === 'shop' && 'Digital Shop Settings'}
              {activeTab === 'messages' && 'Buyer Inquiries'}
              {activeTab === 'wallet' && 'Wallet & Bank Payouts'}
              {activeTab === 'woocommerce' && 'Storefront Catalog Import'}
            </h1>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleViewPublicStorefront}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="View Live Public Storefront"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            onClick={openSellModal}
            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Product</span>
            <span className="sm:hidden">Post</span>
          </button>

          <button
            onClick={async () => {
              await logout();
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title={`Sign out of ${user.email}`}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile Swipeable Tab Bar (Underneath Top Bar on Mobile) */}
      <div className="lg:hidden bg-white border-b border-slate-200/80 px-2 sm:px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-1.5 min-w-max">
          {mobileNavPills.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Sticky Sidebar on Left + Content on Right */}
      <div className="flex w-full max-w-full overflow-x-hidden">
        {/* Sidebar */}
        <SellerSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          setIsOpenMobile={setIsMobileSidebarOpen}
          store={currentStore}
          totalProductsCount={products.length}
          openAddProductModal={openSellModal}
          onViewPublicStore={handleViewPublicStorefront}
          unreadMessagesCount={unreadMessages}
          pendingOrdersCount={pendingOrders}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl w-full overflow-x-hidden">
          {activeTab === 'overview' && (
            <SellerOverview
              store={currentStore}
              products={products}
              setActiveTab={setActiveTab}
              openAddProductModal={openSellModal}
              onViewProduct={onViewProduct}
              setCurrentPage={setCurrentPage}
            />
          )}

          {activeTab === 'products' && (
            <SellerProducts
              store={currentStore}
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onViewProduct={onViewProduct}
            />
          )}

          {activeTab === 'orders' && (
            <SellerOrders
              setCurrentPage={setCurrentPage}
              onOpenLogisticsTool={() => setActiveTab('logistics')}
            />
          )}

          {activeTab === 'logistics' && (
            <SellerLogistics
              store={currentStore}
              setCurrentPage={setCurrentPage}
            />
          )}

          {activeTab === 'shop' && (
            <SellerShopSettings
              store={currentStore}
              onUpdateStore={handleUpdateStore}
              onViewPublicStore={handleViewPublicStorefront}
            />
          )}

          {activeTab === 'messages' && (
            <SellerMessages />
          )}

          {activeTab === 'wallet' && (
            <SellerWallet store={currentStore} />
          )}

          {activeTab === 'woocommerce' && (
            <SellerWooCommerce
              products={products}
              onSyncComplete={(synced) => {
                onSyncProducts?.(synced);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};
