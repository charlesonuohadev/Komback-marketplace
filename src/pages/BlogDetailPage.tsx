import React from 'react';
import { BlogPost } from '../types';
import { ArrowLeft, Calendar, Clock, Share2, Tag, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';

interface BlogDetailPageProps {
  article: BlogPost;
  onBack: () => void;
  onSelectArticle: (article: BlogPost) => void;
  allArticles: BlogPost[];
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  article,
  onBack,
  onSelectArticle,
  allArticles
}) => {
  const related = allArticles.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <div id={`blog-detail-page-${article.id}`} className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </button>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            {article.category}
          </span>
        </div>

        {/* Article Header */}
        <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
          
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="font-bold text-slate-900">{article.author.name}</p>
                <p className="text-[11px] text-slate-400">{article.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {article.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {article.readTime}
              </span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 shadow-inner">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Excerpt Lead */}
          <p className="text-base text-slate-800 font-semibold leading-relaxed p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-600">
            {article.excerpt}
          </p>

          {/* Body Content */}
          <div className="text-sm text-slate-700 leading-loose space-y-4 pt-4">
            <p>{article.content}</p>
            
            <p>
              Whether you are in Lagos, Abuja, Ibadan, or Port Harcourt, verified digital marketplaces like Komback provide direct escrow and verified merchant profiles to protect your hard-earned funds. Always check physical store addresses and look for verified seller badges prior to releasing any transaction.
            </p>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2 mt-6">
              <div className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Komback Safety Reminder</span>
              </div>
              <p>
                Always insist on meeting at a safe public landmark or using Komback's official doorstep waybill delivery channels.
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2">
            {article.tags.map(t => (
              <span key={t} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                #{t}
              </span>
            ))}
          </div>

        </article>

        {/* Read Next Section */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-slate-900 mb-6 font-['Plus_Jakarta_Sans',sans-serif]">
              Read Next on Komback
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <div
                  key={r.id}
                  onClick={() => onSelectArticle(r)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">{r.category}</span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 mt-1 line-clamp-2">
                      {r.title}
                    </h4>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <span>{r.readTime}</span>
                    <span>• Read →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
