import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, where, orderBy, limit, getDocs, startAfter, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Article } from "@/src/types";
import NepaliInput from "@/src/components/ui/NepaliInput";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { Link } from "react-router-dom";
import { Clock, Eye, Calendar, ChevronRight, Search, ArrowUp, MessageCircle } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type TimeRange = "day" | "week" | "year";

export default function LatestNewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TimeRange) || "day";
  const [activeTab, setActiveTab] = useState<TimeRange>(initialTab);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchArticles = useCallback(async (range: TimeRange, isLoadMore = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const now = new Date();
      let startDate = new Date();

      if (range === "day") {
        startDate.setHours(now.getHours() - 24);
      } else if (range === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (range === "year") {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // We query without the createdAt where clause to avoid needing a composite index
      // that might not exist, and filter in memory.
      let q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc"),
        limit(100) // Fetch a larger batch to filter from
      );

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      let fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

      // Filter by date in memory
      fetchedArticles = fetchedArticles.filter(a => {
        const articleDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
        return articleDate >= startDate;
      });

      // For Weekly and Yearly, apply trending algorithm
      if (range !== "day") {
        fetchedArticles = fetchedArticles.map(a => ({
          ...a,
          score: (a.views || 0) + ((a.commentCount || 0) * 5)
        })).sort((a: any, b: any) => b.score - a.score);
      }

      if (isLoadMore) {
        setArticles(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newArticles = fetchedArticles.filter(a => !existingIds.has(a.id));
          return [...prev, ...newArticles];
        });
      } else {
        setArticles(fetchedArticles);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 100);
    } catch (err) {
      console.error("Error fetching latest news:", err);
    } finally {
      setLoading(false);
    }
  }, [lastDoc, loading]);

  useEffect(() => {
    setArticles([]);
    setLastDoc(null);
    setHasMore(true);
    fetchArticles(activeTab);
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const lastArticleRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchArticles(activeTab, true);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, activeTab, fetchArticles]);

  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow pb-12">
        <div className="container-custom">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">ताजा समाचार</h1>
                <p className="text-slate-500 font-medium">भर्खरैका र महत्वपूर्ण समाचारहरू</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                  <NepaliInput 
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    placeholder="खोज्नुहोस्..."
                    className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
                  {(["day", "week", "year"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setActiveTab(range)}
                      className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === range 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {range === "day" ? "आज" : range === "week" ? "यो हप्ता" : "यो वर्ष"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    ref={index === filteredArticles.length - 1 ? lastArticleRef : null}
                    className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all flex flex-col"
                  >
                    <Link to={`/article/${article.id}`} className="relative aspect-[16/10] overflow-hidden block">
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </Link>
                    
                    <div className="p-8 flex flex-col gap-4 flex-grow">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {article.categoryId}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12} /> {formatDate(article.createdAt)}
                        </span>
                      </div>

                      <Link to={`/article/${article.id}`}>
                        <h2 className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                      </Link>

                      <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>

                      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Eye size={12} /> {article.views}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={12} /> {article.commentCount || 0}</span>
                        </div>
                        <Link to={`/article/${article.id}`} className="text-primary hover:translate-x-1 transition-transform">
                          <ChevronRight size={20} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && filteredArticles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <Calendar size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">कुनै समाचार भेटिएन</h3>
                <p className="text-slate-500 font-medium">
                  {searchQuery ? `"${searchQuery}" को लागि कुनै परिणाम भेटिएन।` : "यस अवधिमा कुनै समाचार प्रकाशित भएको छैन।"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
