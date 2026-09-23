import React from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  MessageSquare, 
  Star, 
  HeadphonesIcon,
  Shield,
  ArrowRight
} from 'lucide-react';

interface WhyKombackProps {
  onLearnMore?: () => void;
}

export const WhyKomback: React.FC<WhyKombackProps> = ({ onLearnMore }) => {
  const trustPoints = [
    {
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 bg-emerald-100',
      title: 'Verified Sellers',
      description: 'Shop from trusted Nigerian businesses & individual sellers who have completed national ID and business verification.'
    },
    {
      icon: ShieldCheck,
      iconColor: 'text-blue-600 bg-blue-100',
      title: 'Secure Shopping',
      description: 'Protect your account, personal data, and payment information with encrypted checkout and fraud monitoring.'
    },
    {
      icon: Truck,
      iconColor: 'text-amber-600 bg-amber-100',
      title: 'Delivery Options',
      description: 'Find sellers offering same-day door delivery, nationwide interstate waybills, or safe verified local pickup.'
    },
    {
      icon: MessageSquare,
      iconColor: 'text-purple-600 bg-purple-100',
      title: 'Seller Messaging',
      description: 'Communicate directly and negotiate prices with sellers in real time using our built-in secure instant chat.'
    },
    {
      icon: Star,
      iconColor: 'text-yellow-600 bg-yellow-100',
      title: 'Customer Reviews',
      description: 'Make informed buying decisions with genuine ratings and verified purchase reviews from shoppers across Nigeria.'
    },
    {
      icon: HeadphonesIcon,
      iconColor: 'text-rose-600 bg-rose-100',
      title: 'Customer Support',
      description: 'Dedicated Nigerian customer care team ready to assist with dispute resolution, order inquiries, and safety.'
    }
  ];

  return (
    <section id="komback-why-shop-section" className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading from Blueprint */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>TRUST & INTEGRITY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Shop with Confidence
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            We've built modern trust infrastructure to make buying and selling in Nigeria seamless, transparent, and secure.
          </p>
        </div>

        {/* 6 Grid items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                id={`trust-point-${idx}`}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className={`p-3 rounded-xl shrink-0 ${item.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
