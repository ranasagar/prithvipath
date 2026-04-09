import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

interface CategorySectionProps {
  title: string;
  slug: string;
  articles: Article[];
  variant?: "grid" | "list" | "featured";
}

export default function CategorySection({ title, slug, articles, variant = "grid" }: CategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="py-12 border-t border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 border-l-4 border-primary pl-4">
          {title}
        </h2>
        <Link 
          to={`/category/${slug}`} 
          className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
        >
          सबै हेर्नुहोस् <ArrowRight size={16} />
        </Link>
      </div>

      {variant === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article) => (
            <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
                <img 
                  src={article.featuredImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(article.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {variant === "featured" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <Link to={`/article/${articles[0].id}`} className="group flex flex-col gap-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-xl">
                <img 
                  src={articles[0].featuredImage} 
                  alt={articles[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {articles[0].title}
                </h3>
                <p className="text-slate-600 leading-relaxed line-clamp-3">
                  {articles[0].excerpt}
                </p>
              </div>
            </Link>
          </div>
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.slice(1, 5).map((article) => (
              <Link key={article.id} to={`/article/${article.id}`} className="group flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-sm">
                  <img 
                    src={article.featuredImage} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
