import React from 'react';
import { BlogPost } from '../types';
import { BookOpen, Clock, ArrowRight, Calendar } from 'lucide-react';
import { useMarketplace } from '../context/AppContext';

interface BlogSectionProps {
  onSelectArticle: (article: BlogPost) => void;
  onViewAllBlog: () => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  onSelectArticle,
  onViewAllBlog
}) => {
  const { blogPosts } = useMarketplace();

  return (
    <section id="komback-blog-section" className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                From the Komback Blog
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Market insights, tech buying guides, side hustle playbooks, and safety tips for Nigerian commerce.
            </p>
          </div>

          <button
            id="read-more-blog-top-btn"
            onClick={onViewAllBlog}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer"
          >
            <span>Read More on Komback Blog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4 Articles Grid (as specified in Blueprint page 10) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              id={`blog-card-${post.id}`}
              onClick={() => onSelectArticle(post)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Article Featured Image */}
                <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Article Content Preview */}
                <div className="p-4">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Author & Read More link */}
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-medium text-slate-700 truncate max-w-[110px]">
                    {post.author.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Read</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA from Blueprint Page 10 */}
        <div className="mt-8 text-center">
          <button
            id="read-more-blog-bottom-btn"
            onClick={onViewAllBlog}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 text-xs font-bold bg-white shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <span>Read More on Komback Blog →</span>
          </button>
        </div>

      </div>
    </section>
  );
};
