import React, { useState } from 'react';
import { Store, Product } from '../types';
import { useMarketplace } from '../context/AppContext';
import { Store as StoreIcon, Star, CheckCircle2, MapPin, Search, ArrowRight, ShieldCheck, Phone, Mail } from 'lucide-react';

interface StoresPageProps {
  onViewStore: (store: Store) => void;
  openSellModal: () => void;
}

export const StoresPage: React.FC<StoresPageProps> = ({
  onViewStore,
  openSellModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All Nigeria');

  const { stores, reference } = useMarketplace();
  const filteredStores = stores.filter((st) => {
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          st.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          st.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'All Nigeria' || st.state.toLowerCase().includes(selectedState.split(' ')[0].toLowerCase());
    return matchesSearch && matchesState;
  });

  return (
    <div id="komback-stores-directory-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3">
              <StoreIcon className="w-4 h-4" />
              <span>VERIFIED MERCHANT DIRECTORY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
              Top Komback Stores
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Discover registered businesses, trusted Computer Village importers, native fashion houses, and vetted automobile dealers across Nigeria.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-300 border-t border-slate-800 pt-4">
            <span>✓ 100% Physical Address Verification</span>
            <span>✓ CAC Registration Checked</span>
            <span>✓ High Transaction Rating</span>
          </div>
        </div>

        {/* Search & Location Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search stores by brand name, gadget type, fashion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="sm:w-64 relative">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-900 shadow-xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              {reference.states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              onClick={() => onViewStore(store)}
              className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              {/* Cover Image */}
              <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                <img
                  src={store.coverImage}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold">
                  {store.category}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 pt-0 relative flex-1 flex flex-col justify-between">
                <div className="-mt-10 mb-3 flex items-end justify-between">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
                    <img src={store.avatar} alt={store.name} className="w-full h-full object-cover" />
                  </div>
                  {store.isVerified && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Seller</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {store.tagline}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-2xl p-2.5 border border-slate-100 text-xs">
                    <div>
                      <div className="font-extrabold text-amber-500">★ {store.rating.toFixed(1)}</div>
                      <div className="text-[10px] text-slate-400">Rating</div>
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{store.salesCount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Sales</div>
                    </div>
                    <div>
                      <div className="font-extrabold text-emerald-700">{store.totalProducts}</div>
                      <div className="text-[10px] text-slate-400">Products</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{store.location}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Joined in {store.joinedDate}</span>
                  <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Visit Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Callout to open a store */}
        <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-emerald-950 font-['Plus_Jakarta_Sans',sans-serif]">
              Are you a Nigerian Merchant or Business Owner?
            </h3>
            <p className="text-xs text-emerald-800 mt-1 max-w-xl">
              Open your verified merchant storefront on Komback in minutes. Get verified badges, physical store verification, and direct customer chats.
            </p>
          </div>
          <button
            onClick={openSellModal}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors cursor-pointer shrink-0"
          >
            Create Seller Account →
          </button>
        </div>

      </div>
    </div>
  );
};
