import React, { useState } from 'react';
import { Smartphone, Download, Check, Star, ArrowRight, ShieldCheck, Bell, MessageSquare, Zap, MapPin } from 'lucide-react';

export const MobileAppPromo: React.FC = () => {
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const handleDownload = (platform: 'Android' | 'iOS') => {
    setDownloadNotification(`Starting Komback ${platform} APK / App download...`);
    setTimeout(() => setDownloadNotification(null), 4000);
  };

  return (
    <section id="komback-mobile-app-section" className="py-14 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading & Download CTAs from Blueprint */}
          <div className="lg:col-span-7">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>📱 NATIVE MOBILE EXPERIENCE</span>
            </div>

            {/* Main Heading from Blueprint */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Komback in Your Pocket
            </h2>

            {/* Supporting Text from Blueprint */}
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed max-w-xl">
              Shop, sell, chat in real time with sellers, and manage your listings wherever you go with instant push notifications and low-data mobile mode.
            </p>

            {/* Key App Features */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span>Instant price drop alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>Direct WhatsApp & In-app chat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Offline saved searches & caching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Biometric login & Escrow safety</span>
              </div>
            </div>

            {/* Download Buttons (Google Play & App Store as in Blueprint Page 9) */}
            <div className="mt-8">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Download the Komback App
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                {/* Google Play Button */}
                <button
                  id="download-google-play-btn"
                  onClick={() => handleDownload('Android')}
                  className="bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 hover:border-emerald-500 text-white px-5 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-lg"
                >
                  <svg className="w-6 h-6 fill-current text-emerald-400" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.955V2.77c0-.36.095-.7.26-.985l.35-.001v.03zm1.196-.928l10.96 6.328-2.613 2.613-8.347-8.941zm10.96 15.426L4.805 22.64l8.347-8.94 2.613 2.612zm1.096-.633l3.66-2.113a1.99 1.99 0 0 0 0-3.454l-3.66-2.113-2.784 2.84 2.784 2.84z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-400 uppercase leading-none font-semibold">GET IT ON</div>
                    <div className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">Google Play</div>
                  </div>
                </button>

                {/* App Store Button */}
                <button
                  id="download-app-store-btn"
                  onClick={() => handleDownload('iOS')}
                  className="bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 hover:border-emerald-500 text-white px-5 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-lg"
                >
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2 .6-2.65 1.36-.57.65-1.06 1.73-.93 2.76 1.01.08 2.05-.5 2.66-1.25z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-400 uppercase leading-none font-semibold">DOWNLOAD ON THE</div>
                    <div className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">App Store</div>
                  </div>
                </button>
              </div>

              {downloadNotification && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  <span>{downloadNotification}</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Realistic Phone Mockup (Blueprint Page 9) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 sm:w-72 bg-slate-950 p-3.5 rounded-[40px] border-4 border-slate-700 shadow-2xl shadow-emerald-500/20">
              
              {/* Phone Speaker / Dynamic Island */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2"></div>
                <div className="w-8 h-1.5 rounded-full bg-slate-800"></div>
              </div>

              {/* Phone Screen Mockup Content */}
              <div className="bg-slate-900 rounded-[28px] p-3 text-white overflow-hidden border border-slate-800 space-y-3">
                
                {/* Mini App Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center font-black text-xs">
                      K
                    </div>
                    <span className="font-extrabold text-xs tracking-tight">KOMBACK</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px]">Lagos</span>
                  </div>
                </div>

                {/* Mini Search */}
                <div className="bg-slate-800 p-2 rounded-xl text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span>Search 30,000+ items...</span>
                </div>

                {/* Mini Category Chips */}
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-medium text-slate-300">
                  <div className="p-1.5 bg-slate-800 rounded-lg">📱 Phones</div>
                  <div className="p-1.5 bg-slate-800 rounded-lg">🚗 Cars</div>
                  <div className="p-1.5 bg-slate-800 rounded-lg">👗 Wear</div>
                  <div className="p-1.5 bg-slate-800 rounded-lg">💻 Tech</div>
                </div>

                {/* Mini Listing Card */}
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 flex items-center gap-2">
                  <img
                    src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&auto=format&fit=crop&q=80"
                    alt="iPhone"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-emerald-400">🟢 Verified Seller</span>
                    <p className="text-[10px] font-semibold truncate">iPhone 17 Pro Max</p>
                    <p className="text-xs font-black text-white">₦2,150,000</p>
                  </div>
                </div>

                {/* Bottom App Nav */}
                <div className="pt-2 flex items-center justify-around border-t border-slate-800 text-[10px] text-slate-400 font-semibold">
                  <span className="text-emerald-400">Home</span>
                  <span>Search</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">+ SELL</span>
                  <span>Chats</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
