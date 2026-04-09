import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, TrendingUp, ChevronRight, Play, ChevronLeft } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import FloatingActions from "@/src/components/layout/FloatingActions";
import MultimediaZone from "@/src/components/news/MultimediaZone";
import LatestPostsBlock from "@/src/components/news/LatestPostsBlock";
import { formatDate } from "@/src/lib/utils";
import CategoryBlock from "@/src/components/news/CategoryBlock";
import AdBanner from "@/src/components/ads/AdBanner";
import { CategoryBlockSkeleton, ArticleSkeleton, Skeleton } from "@/src/components/ui/Skeleton";
import type { Article, Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";

export default function HomePage() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [latestNews, setLatestNews] = useState<Article[]>([]);
  const [videoNews, setVideoNews] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
  const [mostReadNews, setMostReadNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Categories
    const fetchCategories = async () => {
      const q = query(collection(db, "categories"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      const cats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Category))
        .filter(cat => !cat.isHidden);
      setCategories(cats);

      // Fetch articles for each category
      cats.forEach(cat => {
        const artQ = query(
          collection(db, "articles"),
          where("status", "==", "published"),
          where("categoryId", "==", cat.slug),
          orderBy("createdAt", "desc"),
          limit(cat.postCount || 4)
        );
        onSnapshot(artQ, (snap) => {
          setCategoryArticles(prev => ({
            ...prev,
            [cat.slug]: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article))
          }));
        });
      });
    };

    fetchCategories();

    // Featured Slider
    const featuredQ = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      where("isFeatured", "==", true),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubFeatured = onSnapshot(featuredQ, (snapshot) => {
      setFeaturedArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
    });

    // Latest News
    const latestQ = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubLatest = onSnapshot(latestQ, (snapshot) => {
      setLatestNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
      setLoading(false);
    });

    // Video News
    const videoQ = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      where("videoUrl", "!=", ""),
      orderBy("videoUrl"),
      orderBy("createdAt", "desc"),
      limit(4)
    );

    const unsubVideo = onSnapshot(videoQ, (snapshot) => {
      setVideoNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
    });

    // Most Read Algorithm
    const fetchMostRead = async () => {
      const q = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        orderBy("views", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));

      setMostReadNews(articles);
    };

    fetchMostRead();

    return () => {
      unsubFeatured();
      unsubLatest();
      unsubVideo();
    };
  }, []);

  const [mostReadTab, setMostReadTab] = useState<"day" | "week" | "year">("day");

  const filteredMostRead = () => {
    const now = new Date();
    let startDate = new Date();
    if (mostReadTab === "day") startDate.setHours(now.getHours() - 24);
    else if (mostReadTab === "week") startDate.setDate(now.getDate() - 7);
    else if (mostReadTab === "year") startDate.setFullYear(now.getFullYear() - 1);

    const filtered = mostReadNews.filter(a => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return created >= startDate;
    });

    const scored = filtered.map(article => {
      const created = article.createdAt?.toDate?.()?.getTime() || new Date(article.createdAt).getTime();
      const daysOld = (now.getTime() - created) / (1000 * 60 * 60 * 24);
      const score = article.views / (daysOld + 1);
      return { ...article, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  useEffect(() => {
    if (featuredArticles.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredArticles.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-grow pb-12 pt-6 md:pt-15">
          <div className="container-custom">
            {/* Hero Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
              <div className="lg:col-span-8">
                <Skeleton className="aspect-video md:aspect-[16/8] w-full rounded-3xl" />
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                <Skeleton className="h-8 w-40 rounded-xl" />
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
                      <div className="flex-grow flex flex-col gap-2">
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <Skeleton className="h-3 w-3/4 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Section Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 flex flex-col gap-20">
                <CategoryBlockSkeleton />
                <CategoryBlockSkeleton />
                <CategoryBlockSkeleton />
              </div>
              <div className="lg:col-span-4">
                <div className="flex flex-col gap-6">
                  <Skeleton className="h-8 w-32 rounded-xl" />
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow pt-6 md:pt-15 pb-12">
        <div className="container-custom">
          {/* Hero Slider Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            {/* Featured Slider (Left) */}
            <div className="lg:col-span-8 relative group">
              <div className="relative aspect-[16/9] md:aspect-[16/8] overflow-hidden rounded-3xl shadow-2xl bg-slate-900">
                <AnimatePresence mode="wait">
                  {featuredArticles.length > 0 && (
                    <motion.div
                      key={featuredArticles[currentSlide].id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <Link to={`/article/${featuredArticles[currentSlide].id}`} className="block w-full h-full group">
                        <motion.img
                          src={featuredArticles[currentSlide].featuredImage}
                          alt={featuredArticles[currentSlide].title}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 md:p-12 flex flex-col justify-end gap-4">
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500"></div>
                          <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative z-10 bg-accent text-white text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full w-fit uppercase tracking-widest"
                          >
                            विशेष समाचार
                          </motion.span>
                          <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative z-10 text-2xl md:text-5xl font-black text-white leading-tight tracking-tight group-hover:text-primary transition-colors"
                          >
                            {featuredArticles[currentSlide].title}
                          </motion.h2>
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="relative z-10 flex items-center gap-6 text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest"
                          >
                            <span className="flex items-center gap-2"><Clock size={16} className="text-primary" /> {formatDate(featuredArticles[currentSlide].createdAt)}</span>
                            <span className="flex items-center gap-2"><Eye size={16} className="text-primary" /> {featuredArticles[currentSlide].views} पटक हेरिएको</span>
                          </motion.div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Slider Controls */}
                <div className="absolute bottom-8 right-8 flex gap-2 z-10">
                  <button onClick={prevSlide} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-primary transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextSlide} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-primary transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-8 left-8 flex gap-2 z-10">
                  {featuredArticles.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Most Read Algorithm (Right) */}
            <div className="lg:col-span-4 flex flex-col gap-6 pt-4 md:pt-0">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900 border-l-4 border-accent pl-4 uppercase tracking-tight">
                  धेरै पढिएको
                </h3>
                <Link to="/trending" className="text-accent hover:text-accent/80 transition-colors">
                  <TrendingUp size={20} />
                </Link>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(["day", "week", "year"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMostReadTab(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mostReadTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    {tab === "day" ? "आज" : tab === "week" ? "यो हप्ता" : "यो वर्ष"}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-6">
                {filteredMostRead().map((article, index) => (
                  <Link key={article.id} to={`/article/${article.id}`} className="group flex items-start gap-4">
                    <div className="text-4xl font-black text-slate-100 group-hover:text-primary/20 transition-colors leading-none pt-1">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {formatDate(article.createdAt)}
                        </span>
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <Eye size={10} /> {article.views}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {filteredMostRead().length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    कुनै समाचार भेटिएन
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 flex flex-col gap-10">
              <LatestPostsBlock initialArticles={latestNews} />

              {/* Dynamic Categories (First 2) */}
              {categories.slice(0, 2).map((cat) => (
                <div key={cat.id} id={`category-${cat.slug}`}>
                  <CategoryBlock
                    category={cat}
                    articles={categoryArticles[cat.slug] || []}
                  />
                </div>
              ))}

              {/* Mid-page Ad Banner */}
              <AdBanner position="homepage_mid" className="my-6" />
            </div>

            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="sticky top-24"
              >
                <Sidebar hideMostRead={true} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Multimedia Zone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <MultimediaZone articles={videoNews} />
        </motion.div>

        {/* Remaining Dynamic Categories */}
        <div className="container-custom mt-10">
          <div className="flex flex-col gap-10">
            {categories.slice(2).map((cat) => (
              <motion.div
                key={cat.id}
                id={`category-${cat.slug}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <CategoryBlock
                  category={cat}
                  articles={categoryArticles[cat.slug] || []}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <FloatingActions categories={categories.map(c => ({ id: c.id, name: c.nameNepali, slug: c.slug }))} />
    </motion.div>
  );
}
