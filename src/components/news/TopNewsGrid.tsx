import { Link } from "react-router-dom";
import { Clock, Share2 } from "lucide-react";
import { cn, formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

interface TopNewsGridProps {
  mainArticle: Article;
  sideArticles: Article[];
}

export default function TopNewsGrid({ mainArticle, sideArticles }: TopNewsGridProps) {
  return (
    <section className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Featured Article */}
        <div className="lg:col-span-8 flex flex-col gap-4 group">
          <Link to={`/article/${mainArticle.id}`} className="relative overflow-hidden rounded-2xl aspect-[16/9] shadow-lg">
            <img 
              src={mainArticle.featuredImage} 
              alt={mainArticle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
              <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-wider">
                मुख्य समाचार
              </span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 group-hover:text-primary transition-colors">
                {mainArticle.title}
              </h2>
              <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(mainArticle.createdAt)}</span>
                <span className="flex items-center gap-1.5 hover:text-white cursor-pointer"><Share2 size={14} /> सेयर</span>
              </div>
            </div>
          </Link>
          <p className="text-slate-600 text-lg leading-relaxed line-clamp-3">
            {mainArticle.excerpt}
          </p>
        </div>

        {/* Side List Articles */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
            <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary pl-3">
              ताजा अपडेट
            </h3>
            <Link to="/category/breaking" className="text-xs font-bold text-primary hover:underline">सबै हेर्नुहोस्</Link>
          </div>
          
          <div className="flex flex-col gap-6">
            {sideArticles.map((article) => (
              <Link 
                key={article.id} 
                to={`/article/${article.id}`}
                className="flex gap-4 group"
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-sm">
                  <img 
                    src={article.featuredImage} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                    {article.title}
                  </h4>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={12} /> {formatDate(article.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
