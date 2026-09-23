import React from 'react';
import { PageType } from '../types';
import { ShieldCheck, Lock, AlertTriangle, Phone, Mail, MapPin, Heart } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: PageType) => void;
  openSellModal: () => void;
  onSelectCategory: (categorySlug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  setCurrentPage,
  openSellModal,
  onSelectCategory
}) => {
  return (
    <footer id="komback-footer" className="bg-slate-950 text-slate-400 text-xs">
      
      {/* Crucial Safety Notice from Blueprint Page 17 & 34 */}
      <div className="bg-emerald-950/60 border-b border-emerald-800/40 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Shop Safely:</strong> Never send money outside the recommended Komback payment process or private unverified bank transfers.
            </span>
          </div>
          <button
            onClick={() => setCurrentPage('safety')}
            className="text-emerald-400 hover:text-emerald-300 font-bold underline shrink-0 cursor-pointer"
          >
            Read Buyer Safety Guidelines
          </button>
        </div>
      </div>

      {/* Main 5-Column Footer Grid (Blueprint Page 10, 11) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          
          {/* Column 1: SHOP */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
              SHOP
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => { onSelectCategory('phones-tablets'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Phones & Tablets
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('fashion'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Fashion & Wear
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('electronics'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Electronics & Tech
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('vehicles'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Cars & Vehicles
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('real-estate'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Real Estate & Land
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('beauty'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Beauty & Hair
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('home-office'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Home & Office
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('food'); }} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Food & Groceries
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('products')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
                  All Categories →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: SELL */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
              SELL
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentPage('sell')} className="hover:text-emerald-400 font-bold text-emerald-400 transition-colors cursor-pointer">
                  + Post Free Ad on Komback
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('account')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Seller Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Escrow & Seller Protection
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('blog')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Seller Guide & Playbook
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Seller Verification Badge
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: HELP */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
              HELP
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  FAQ
                </button>
              </li>
              <li>
                <a href="mailto:support@komback.com" className="hover:text-emerald-400 transition-colors">
                  Contact Us: support@komback.com
                </a>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('track-order')} className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-400 font-semibold">
                  Track Order & Waybill
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Trust & Safety
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: COMPANY */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
              COMPANY
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentPage('about-us')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  About Komback
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('blog')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Komback Blog
                </button>
              </li>
              <li>
                <span className="text-slate-500">Careers (We're hiring!)</span>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('safety')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: FOLLOW & CONTACT */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-white font-black text-xs uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
              FOLLOW US
            </h4>
            <div className="flex items-center gap-2 mb-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors">
                FB
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors">
                IG
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors">
                TT
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors">
                YT
              </a>
            </div>

            <div className="text-[11px] text-slate-400 space-y-2">
              <img 
                src="/images/logo.png" 
                alt="KOMBACK" 
                className="h-8 w-auto object-contain brightness-0 invert opacity-95 mb-2"
              />
              <p className="font-bold text-white tracking-wide">KOMBACK NIGERIA</p>
              <p>Buy. Sell. Connect.</p>
              <p className="text-emerald-400 font-semibold">Nigeria's Marketplace for Everything</p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & accepted payment channels in Nigeria */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
          <div>
            © {new Date().getFullYear()} Komback Marketplace Technologies Nigeria Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Supported Payments:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">Paystack</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">Flutterwave</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">Direct Bank Transfer</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">Pay on Delivery</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
