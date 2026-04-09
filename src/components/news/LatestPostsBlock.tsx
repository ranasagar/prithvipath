import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, MessageCircle, ChevronRight } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { subDays } from "date-fns";

export default function LatestPostsBlock({ initialArticles }: { initialArticles: Article[] }) {
  const [filter, setFilter] = useState<"day" | "week" | "year">("day");
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filter === "day") {
      setArticles(initialArticles.slice(0, 5));
      return;
    }

    const fetchTrending = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startDate: Date;
        if (filter === "week") startDate = subDays(now, 7);
        else startDate = subDays(now, 365);

        const q = query(
          collection(db, "articles"),
          where("status", "==", "published"),
          where("createdAt", ">=", startDate.toISOString()),
          limit(100) // Fetch more to sort by algorithm
        );

        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

        // Algorithm: Score = views + (commentCount * 5)
        const scored = fetched.map(a => ({
          ...a,
          score: (a.views || 0) + ((a.commentCount || 0) * 5)
        }));

        setArticles(scored.sort((a, b) => b.score - a.score).slice(0, 5));
      } catch (err) {
        console.error("Error fetching trending:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [filter, initialArticles]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">ताजा समाचार</h3>
          <div className="h-1 w-12 bg-primary rounded-full"></div>
        </div>
        
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {(["day", "week", "year"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                filter === f 
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f === "day" ? "आज" : f === "week" ? "हप्ता" : "वर्ष"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          articles.map((article) => (
            <Link key={article.id} to={`/article/${article.id}`} className="group flex items-center gap-5 p-3 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
              <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-md">
                <img 
                  src={article.featuredImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-base font-black text-slate-900 group-hover:text-primary leading-tight line-clamp-2 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {formatDate(article.createdAt)}</span>
                  <span className="flex items-center gap-1.5"><Eye size={12} className="text-primary" /> {article.views}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle size={12} className="text-primary" /> {article.commentCount || 0}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-50">
        <Link 
          to={`/latest?tab=${filter}`} 
          className="flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:gap-4 transition-all"
        >
          सबै हेर्नुहोस् <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
