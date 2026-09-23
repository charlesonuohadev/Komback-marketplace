import React, { useState } from 'react';
import { Mail, CheckCircle2, Send } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 5000);
  };

  return (
    <section id="komback-newsletter-section" className="py-12 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Heading from Blueprint Page 10 */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
          Don't Miss the Next Great Deal
        </h2>

        {/* Supporting text from Blueprint */}
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Get new products, special offers, and marketplace tips delivered directly to your inbox.
        </p>

        {/* Form from Blueprint */}
        <div className="mt-6 max-w-md mx-auto">
          {subscribed ? (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>You're subscribed! We'll send you the hottest Nigerian deals.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                id="newsletter-email-input"
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                id="newsletter-subscribe-btn"
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
          <p className="text-[11px] text-slate-400 mt-2">
            Zero spam. Unsubscribe at any time with 1 click.
          </p>
        </div>

      </div>
    </section>
  );
};
