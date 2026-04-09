import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { Search as SearchIcon, Clock, ChevronRight } from "lucide-react";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const queryText = searchParams.get("q") || "";
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Firestore doesn't support full-text search natively without third-party services like Algolia.
        // For this demo, we'll fetch all published articles and filter in memory.
        // In a real app, you'd use a search index.
        const q = query(
          collection(db, "articles"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        const filtered = articles.filter(article => 
          article.title.toLowerCase().includes(queryText.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(queryText.toLowerCase()) ||
          article.content.toLowerCase().includes(queryText.toLowerCase())
        );
        
        setResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (queryText) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [queryText]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow pb-12">
        <div className="container-custom max-w-5xl">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <SearchIcon className="text-primary" size={32} />
                खोज नतिजा: "{queryText}"
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                कुल {results.length} नतिजाहरू फेला परे
              </p>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                खोजिँदैछ...
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {results.map((article) => (
                  <Link 
                    key={article.id} 
                    to={`/article/${article.id}`}
                    className="group bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col md:flex-row gap-6 items-center"
                  >
                    <div className="w-full md:w-48 aspect-video md:aspect-square flex-shrink-0 overflow-hidden rounded-2xl">
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col gap-3 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {article.categoryId}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12} /> {formatDate(article.createdAt)}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                        {article.title}
                      </h2>
                      <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight size={24} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <SearchIcon size={40} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest">कुनै नतिजा फेला परेन</p>
                <Link to="/" className="text-primary font-black uppercase tracking-widest hover:underline">गृहपृष्ठमा फर्कनुहोस्</Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
