import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Eye, MapPin, ChevronRight } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { motion } from "motion/react";
import { ArticleSkeleton } from "@/src/components/ui/Skeleton";

export default function DistrictPage() {
  const { districtName } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!districtName) return;

    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      where("districts", "array-contains", districtName),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching district articles:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [districtName]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pb-12 pt-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 flex flex-col gap-12">
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ArticleSkeleton />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow pb-12">
        <div className="container-custom">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
            <Link to="/" className="hover:text-primary transition-colors">गृहपृष्ठ</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-900">{districtName} जिल्ला</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8">
              <div className="flex flex-col gap-12">
                <div className="flex flex-col gap-4">
                  <h1 className="text-5xl font-black text-slate-900 flex items-center gap-4">
                    <MapPin size={40} className="text-primary" /> {districtName}
                  </h1>
                  <div className="h-1 w-32 bg-primary rounded-full"></div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    {districtName} जिल्लाका ताजा समाचारहरू
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {articles.length > 0 ? (
                    articles.map((article) => (
                      <motion.div 
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="group grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                      >
                        <div className="md:col-span-5 relative aspect-[16/10] overflow-hidden rounded-[2rem] shadow-xl">
                          <Link to={`/article/${article.id}`}>
                            <img 
                              src={article.featuredImage} 
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </Link>
                        </div>
                        <div className="md:col-span-7 flex flex-col gap-4">
                          <Link to={`/article/${article.id}`}>
                            <h2 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                              {article.title}
                            </h2>
                          </Link>
                          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {formatDate(article.createdAt)}</span>
                            <span className="flex items-center gap-2"><Eye size={14} className="text-primary" /> {article.views} पटक हेरिएको</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-black uppercase tracking-widest">यस जिल्लामा कुनै समाचार भेटिएन।</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
