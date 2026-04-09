import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, TrendingUp, ChevronRight } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

export default function TrendingPage() {
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const q = query(
          collection(db, "articles"),
          where("status", "==", "published"),
          orderBy("views", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        // Algorithm: Score = views / (days_old + 1)
        const now = new Date().getTime();
        const scored = articles.map(article => {
          const created = article.createdAt?.toDate?.()?.getTime() || new Date(article.createdAt).getTime();
          const daysOld = (now - created) / (1000 * 60 * 60 * 24);
          const score = (article.views || 0) / (daysOld + 1);
          return { ...article, score };
        });

        setTrendingArticles(scored.sort((a, b) => b.score - a.score));
      } catch (error) {
        console.error("Error fetching trending articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow pb-12">
        <div className="container-custom">
          {/* Page Header */}
          <div className="flex flex-col gap-4 mb-12">
            <div className="flex items-center gap-3 text-accent">
              <TrendingUp size={32} strokeWidth={3} />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">ट्रेन्डिङ समाचार</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-2xl">
              हाम्रो विशेष एल्गोरिदमद्वारा छानिएका अहिलेका सबैभन्दा लोकप्रिय र चर्चामा रहेका समाचारहरू।
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-[2rem] h-80 animate-pulse shadow-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingArticles.map((article, index) => (
                <Link 
                  key={article.id} 
                  to={`/article/${article.id}`}
                  className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={article.featuredImage} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      #{index + 1} Trending
                    </div>
                  </div>
                  <div className="p-8 flex flex-col gap-4 flex-grow">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                      {article.categoryId}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-3">
                      {article.title}
                    </h2>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(article.createdAt)}</span>
                        <span className="flex items-center gap-1.5 text-primary"><Eye size={14} /> {article.views}</span>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
