import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Truck, 
  Store, 
  MessageSquare, 
  Wallet, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  X,
  Store as StoreIcon,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Store as StoreType, PageType } from '../../types';

export type SellerDashboardTab = 
  | 'overview' 
  | 'products' 
  | 'orders' 
  | 'logistics' 
  | 'shop' 
  | 'messages' 
  | 'wallet'
  | 'woocommerce';

interface SellerSidebarProps {
  activeTab: SellerDashboardTab;
  setActiveTab: (tab: SellerDashboardTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  store: StoreType;
  totalProductsCount: number;
  openAddProductModal: () => void;
  onViewPublicStore: () => void;
  unreadMessagesCount: number;
  pendingOrdersCount: number;
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  store,
  totalProductsCount,
  openAddProductModal,
  onViewPublicStore,
  unreadMessagesCount,
  pendingOrdersCount
}) => {
  const navItems: { id: SellerDashboardTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Inventory', icon: Package, badge: totalProductsCount, badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'orders', label: 'Orders & Escrow', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} New` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'logistics', label: 'Logistics & Waybills', icon: Truck },
    { id: 'shop', label: 'Digital Shop Front', icon: Store },
    { id: 'messages', label: 'Buyer Inquiries', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined, badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet },
    { id: 'woocommerce', label: 'Storefront Import', icon: RefreshCw },
  ];

  const handleSelectTab = (tab: SellerDashboardTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-24 left-0 z-50 h-[100dvh] lg:h-[calc(100vh-7rem)] w-72 max-w-[85vw] bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${
          isOpenMobile 
            ? 'translate-x-0' 
            : '-translate-x-full lg:translate-x-0 invisible lg:visible pointer-events-none lg:pointer-events-auto'
        }`}
      >
        <div className="p-5 overflow-y-auto flex-1 no-scrollbar">
          {/* Mobile Close Button & Header */}
          <div className="flex lg:hidden items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                KB
              </span>
              <span className="font-extrabold text-sm text-slate-900">Seller Dashboard</span>
            </div>
            <button
              onClick={() => setIsOpenMobile(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store Identification Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white mb-6 relative overflow-hidden shadow-xs">
            <div className="flex items-center gap-3">
              <img
                src={store.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'}
                alt={store.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shrink-0 bg-slate-800"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white truncate font-['Plus_Jakarta_Sans',sans-serif]">
                    {store.name}
                  </h3>
                  <span className="p-0.5 rounded-full bg-emerald-500 text-white shrink-0" title="Verified MultiVendor">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {store.location}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-bold">
                  <span>★ {store.rating}</span>
                  <span>•</span>
                  <span>{store.salesCount} Verified Sales</span>
                </div>
              </div>
            </div>

            {/* Quick Link to Public Store */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={onViewPublicStore}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>View Public Storefront</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Add Product Button */}
          <button
            onClick={openAddProductModal}
            className="w-full mb-6 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Listing</span>
          </button>

          {/* Navigation Items */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Seller Tools & Tracking
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`seller-nav-${item.id}`}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white text-emerald-800'
                          : item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Store Status: Online</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">24/7 Escrow</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Komback Verified Merchant Portal
          </p>
        </div>
      </aside>
    </>
  );
};
