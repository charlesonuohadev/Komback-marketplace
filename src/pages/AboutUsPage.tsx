import React from 'react';
import { PageType } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  PhoneCall, 
  Mail, 
  Award,
  CheckCircle2,
  Clock,
  HelpCircle
} from 'lucide-react';

interface AboutUsPageProps {
  setCurrentPage: (page: PageType) => void;
  openSellModal?: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ setCurrentPage, openSellModal }) => {
  return (
    <div id="komback-about-us-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-4">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>ABOUT KOMBACK NIGERIA</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-tight">
              Empowering Safe & Trusted Commerce Across Nigeria
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed font-normal">
              KOMBACK is Nigeria’s modern multi-vendor marketplace and classifieds platform, purpose-built to connect verified buyers and merchants across all 36 States and the Federal Capital Territory.
            </p>
          </div>
        </div>

        {/* Core Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="font-black text-xl text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Our Mission
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To eliminate fraud and friction in Nigerian online trade by providing verified seller credentials, escrow protections, transparent pricing, and instant seller communication tools for everyday Nigerians.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="font-black text-xl text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Our Vision
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To be West Africa's most trustworthy and accessible digital trading ecosystem where anyone—from Computer Village merchants to Aba fashion makers—can scale their business nationwide.
            </p>
          </div>
        </div>

        {/* Why Komback is Different */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <h2 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mb-6">
            The Komback Standard
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Physical Store Verification</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                We physically verify prominent merchant addresses across major trading markets including Ikeja Computer Village, Alaba, Wuse II Abuja, and Trade Fair Complex.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Zero Listing Commission</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Individuals and MSMEs can list their gadgets, cars, fashion items, and services at ₦0 listing fee, keeping prices affordable for everyday consumers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Live In-App Chat</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with sellers in real time to ask questions, negotiate terms, request live video proof, and arrange local pickup safely.
              </p>
            </div>
          </div>
        </div>

        {/* Nationwide Footprint */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Pan-Nigerian Presence</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
              Serving All 36 Nigerian States & FCT
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Headquartered in Lagos with verified merchant clusters in Abuja, Port Harcourt, Ibadan, Enugu, Kano, and Benin City.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('safety')}
              className="px-5 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              Trust & Safety Rules
            </button>
            <button
              onClick={() => setCurrentPage('products')}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contact / Help info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80">
            <HelpCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-900">Have Questions?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">Our support and verification team is available 24/7</p>
            <a href="mailto:support@komback.com" className="text-xs font-bold text-emerald-600 hover:underline">
              support@komback.com
            </a>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80">
            <PhoneCall className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-900">Customer Helpline</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">Mon - Sat: 8:00 AM – 7:00 PM WAT</p>
            <span className="text-xs font-bold text-slate-900">+234 1 800 KOMBACK</span>
          </div>
        </div>

      </div>
    </div>
  );
};
