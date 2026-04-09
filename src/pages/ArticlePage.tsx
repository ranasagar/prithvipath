import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Share2, Facebook, Twitter, Mail, ChevronRight, User, Eye, MessageCircle, ArrowRight, Send, ChevronUp, MapPin } from "lucide-react";
import { doc, getDoc, updateDoc, collection, query, where, limit, getDocs, addDoc, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import Sidebar from "@/src/components/layout/Sidebar";
import { formatDate, getCategoryColor } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import NepaliInput from "@/src/components/ui/NepaliInput";
import AdBanner from "@/src/components/ads/AdBanner";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/lib/auth";
import { ArticleSkeleton } from "@/src/components/ui/Skeleton";

interface Comment {
  id: string;
  articleId: string;
  userName: string;
  content: string;
  createdAt: any;
  isPinned?: boolean;
}

export default function ArticlePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { scrollYProgress, scrollY } = useScroll();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const unsub = scrollY.on("change", (latest) => {
      setShowScrollTop(latest > 500);
    });
    return () => unsub();
  }, [scrollY]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const [article, setArticle] = useState<Article | null>(null);
  const [nextArticle, setNextArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'related' | 'trending'>('related');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchArticleData = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Article;
          const currentArticle = { id: docSnap.id, ...data };
          setArticle(currentArticle);
          
          // Increment views (wrap in try-catch so permission errors don't stop the rest of the loader)
          try {
            await updateDoc(docRef, {
              views: (data.views || 0) + 1
            });
          } catch (viewError) {
            console.warn("Could not increment view count (insufficient permissions or offline).", viewError);
          }

          // Fetch related articles
          const q = query(
            collection(db, "articles"),
            where("categoryId", "==", data.categoryId),
            where("status", "==", "published"),
            limit(4)
          );
          const relatedSnap = await getDocs(q);
          const related = relatedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Article))
            .filter(a => a.id !== id)
            .slice(0, 3);
          setRelatedArticles(related);

          // Fetch next article in same category
          const nextQ = query(
            collection(db, "articles"),
            where("categoryId", "==", data.categoryId),
            where("status", "==", "published"),
            where("createdAt", "<", data.createdAt),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const nextSnap = await getDocs(nextQ);
          if (!nextSnap.empty) {
            setNextArticle({ id: nextSnap.docs[0].id, ...nextSnap.docs[0].data() } as Article);
          } else {
            // Fallback to newest if no older posts
            const newestQ = query(
              collection(db, "articles"),
              where("categoryId", "==", data.categoryId),
              where("status", "==", "published"),
              orderBy("createdAt", "desc"),
              limit(1)
            );
            const newestSnap = await getDocs(newestQ);
            if (!newestSnap.empty && newestSnap.docs[0].id !== id) {
              setNextArticle({ id: newestSnap.docs[0].id, ...newestSnap.docs[0].data() } as Article);
            } else {
              setNextArticle(null);
            }
          }

          // Fetch trending articles (Most Read algorithm)
          const trendingQ = query(
            collection(db, "articles"),
            where("status", "==", "published"),
            orderBy("views", "desc"),
            limit(10)
          );
          const trendingSnap = await getDocs(trendingQ);
          const trending = trendingSnap.docs
            .map(doc => {
              const d = doc.data();
              const createdAt = new Date(d.createdAt).getTime();
              const now = new Date().getTime();
              const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
              const score = (d.views || 0) / (daysOld + 1);
              return { id: doc.id, ...d, score } as Article & { score: number };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
          setTrendingArticles(trending);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();

    // Fetch comments
    const commentsQ = query(
      collection(db, "comments"),
      where("articleId", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsubComments = onSnapshot(commentsQ, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      // Sort pinned comments first, then by date
      fetchedComments.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0; // The query already sorts by createdAt desc
      });
      setComments(fetchedComments);
    });

    window.scrollTo(0, 0);
    return () => unsubComments();
  }, [id]);

  const handlePinComment = async (commentId: string, currentPinnedStatus: boolean) => {
    if (!user || user.role === 'user') return; // Only admin/editor can pin
    try {
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, { isPinned: !currentPinnedStatus });
    } catch (error) {
      console.error("Error pinning comment:", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentName.trim() || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "comments"), {
        articleId: id,
        userName: commentName.trim(),
        content: commentText.trim(),
        createdAt: serverTimestamp()
      });
      
      // Increment commentCount
      const docRef = doc(db, "articles", id);
      await updateDoc(docRef, {
        commentCount: (article?.commentCount || 0) + 1
      });

      setCommentName("");
      setCommentText("");
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pt-8 pb-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 flex flex-col gap-12">
              <ArticleSkeleton />
            </div>
            <div className="lg:col-span-4 hidden lg:block">
               <div className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
  
  if (!article) return <div className="min-h-screen flex items-center justify-center">समाचार भेटिएन।</div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Reading Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-[#005187] to-accent z-[100] origin-left shadow-lg shadow-primary/20"
        style={{ scaleX }}
      />

      <AnimatePresence mode="wait">
        <motion.main 
          key={id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-grow pt-4 pb-12"
        >
        <div className="container-custom">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
            <Link to="/" className="hover:text-primary transition-colors">गृहपृष्ठ</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link to={`/category/${article.categoryId}`} className="hover:text-primary transition-colors">{article.categoryId}</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-900 line-clamp-1">{article.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 flex flex-col gap-12">
              {/* Headline Section */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <span className={`${getCategoryColor(article.categoryId)} text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-xl shadow-primary/20`}>
                    {article.categoryId}
                  </span>
                  <div className="h-px flex-grow bg-slate-100"></div>
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                  {article.title}
                </h1>
                
                <div className="flex flex-wrap items-center justify-between gap-8 py-10 border-y border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white shadow-2xl">
                      {article.authorPhoto ? (
                        <img src={article.authorPhoto} alt={article.authorName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <Link to={`/profile/${article.authorId}`} className="text-lg font-black text-slate-900 tracking-tight hover:text-primary transition-colors">{article.authorName}</Link>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">पृथ्वी पथ</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">पृथ्वी पथ मिडिया</span>
                        <button className="text-[9px] font-black text-primary uppercase tracking-widest border-b-2 border-primary/20 hover:border-primary transition-all">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                      <span className="flex items-center gap-2.5"><Clock size={18} className="text-primary" /> {formatDate(article.createdAt)}</span>
                      <span className="flex items-center gap-2.5"><Eye size={18} className="text-primary" /> {article.views} पटक हेरिएको</span>
                    </div>
                    {article.editHistory && article.editHistory.length > 0 && (
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        अन्तिम सम्पादन: {formatDate(article.editHistory[article.editHistory.length - 1].updatedAt)} 
                        (द्वारा <Link to={`/profile/${article.editHistory[article.editHistory.length - 1].updatedBy}`} className="hover:text-primary transition-colors">{article.editHistory[article.editHistory.length - 1].updatedByName}</Link>)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div 
                className="relative aspect-[16/9] overflow-hidden shadow-2xl group"
                style={{ borderRadius: 'var(--app-category-hero-radius, 2rem)' }}
              >
                <img 
                  src={article.featuredImage} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div 
                  className="absolute inset-0 ring-1 ring-inset ring-black/10"
                  style={{ borderRadius: 'var(--app-category-hero-radius, 2rem)' }}
                ></div>
              </div>

              {/* Content Section */}
              <div className="flex flex-col md:flex-row gap-12 lg:gap-16 relative items-start">
                {/* Floating Social Share (Glass Bar) */}
                <aside className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:relative md:bottom-auto md:left-auto md:w-20 flex-shrink-0 md:sticky md:top-32 z-[60]">
                  <div className="flex flex-row md:flex-col gap-3 glass-share-bar px-6 py-4 md:px-3">
                    <button 
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                      className="bg-[#1877F2]/10 text-[#1877F2] p-3 rounded-2xl hover:scale-110 hover:bg-[#1877F2] hover:text-white transition-all flex items-center justify-center"
                    >
                      <Facebook size={20} />
                    </button>
                    <button 
                      onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${article.title}`, '_blank')}
                      className="bg-[#1DA1F2]/10 text-[#1DA1F2] p-3 rounded-2xl hover:scale-110 hover:bg-[#1DA1F2] hover:text-white transition-all flex items-center justify-center"
                    >
                      <Twitter size={20} />
                    </button>
                    <button 
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + " - " + window.location.href)}`, '_blank')}
                      className="bg-[#25D366]/10 text-[#25D366] p-3 rounded-2xl hover:scale-110 hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center"
                    >
                      <MessageCircle size={20} />
                    </button>
                    <button 
                      onClick={() => window.open(`viber://forward?text=${encodeURIComponent(article.title + " - " + window.location.href)}`, '_blank')}
                      className="flex-1 md:flex-none bg-[#7360F2] text-white p-5 rounded-2xl shadow-xl hover:scale-110 transition-transform hover:shadow-indigo-500/20 flex items-center justify-center"
                      title="Share on Viber"
                    >
                      <Send size={20} />
                    </button>
                    <button 
                      onClick={() => navigator.share({ title: article.title, url: window.location.href })}
                      className="flex-1 md:flex-none bg-primary text-white p-5 rounded-2xl shadow-xl hover:scale-110 transition-transform hover:shadow-primary/20 flex items-center justify-center"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </aside>

                <div className="flex-grow min-w-0 flex flex-col gap-16">
                  <div className="prose-nepali max-w-none">
                    <div className="p-10 bg-slate-50 rounded-3xl border-l-8 border-primary mb-12 italic text-2xl font-black text-slate-900 leading-relaxed shadow-sm">
                      {article.excerpt}
                    </div>
                    <div 
                      className="article-content-body"
                      dangerouslySetInnerHTML={{ __html: article.content }} 
                    />
                  </div>

                  {/* Tags & Districts */}
                  <div className="flex flex-col gap-6 py-12 border-t border-slate-100">
                    {article.districts && article.districts.length > 0 && (
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4 flex items-center gap-2">
                          <MapPin size={12} className="text-primary" /> जिल्लाहरू:
                        </span>
                        {article.districts.map(district => (
                          <Link 
                            key={district} 
                            to={`/district/${district}`} 
                            className="bg-primary/5 text-primary px-6 py-2.5 rounded-full text-xs font-black hover:bg-primary hover:text-white transition-all uppercase tracking-widest shadow-sm flex items-center gap-2"
                          >
                            <MapPin size={10} /> {district}
                          </Link>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">विधा:</span>
                      <Link to={`/category/${article.categoryId}`} className="bg-slate-50 text-slate-600 px-6 py-2.5 rounded-full text-xs font-black hover:bg-primary hover:text-white transition-all uppercase tracking-widest shadow-sm">
                        {article.categoryId}
                      </Link>
                    </div>
                  </div>

                  {/* Article Bottom Ad */}
                  <AdBanner position="article_bottom" className="mb-8" />

                  {/* Comments Section */}
                  <div className="bg-slate-50 p-8 md:p-12 rounded-4xl border border-slate-100 flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">प्रतिक्रिया दिनुहोस्</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">तपाईंको विचार व्यक्त गर्नुहोस्</p>
                    </div>

                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">तपाईंको नाम</label>
                          <NepaliInput 
                            value={commentName}
                            onChange={(val) => setCommentName(val)}
                            placeholder="नाम लेख्नुहोस्"
                            className="w-full bg-white border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">प्रतिक्रिया</label>
                        <NepaliInput 
                          value={commentText}
                          onChange={(val) => setCommentText(val)}
                          placeholder="यहाँ लेख्नुहोस्..."
                          rows={4}
                          type="textarea"
                          className="w-full bg-white border-none rounded-3xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm resize-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-primary transition-all w-fit shadow-xl shadow-slate-200 disabled:opacity-50"
                      >
                        <Send size={18} />
                        {isSubmitting ? "पठाउँदै..." : "पठाउनुहोस्"}
                      </button>
                    </form>

                    {/* Comments List */}
                    <div className="flex flex-col gap-8 pt-8 border-t border-slate-200">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">सबै प्रतिक्रियाहरू ({comments.length})</h4>
                      <div className="flex flex-col gap-6">
                        {comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className={`p-6 rounded-3xl shadow-sm border flex gap-4 relative ${comment.isPinned ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-100'}`}>
                              {comment.isPinned && (
                                <div className="absolute -top-3 -right-3 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                                  <MapPin size={14} className="fill-current" />
                                </div>
                              )}
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 flex-shrink-0">
                                <User size={24} />
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-slate-900">{comment.userName}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {comment.createdAt ? formatDate(comment.createdAt) : "भर्खरै"}
                                    </span>
                                  </div>
                                  {user && (user.role === 'admin' || user.role === 'editor') && (
                                    <button 
                                      onClick={() => handlePinComment(comment.id, !!comment.isPinned)}
                                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-colors ${comment.isPinned ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                    >
                                      {comment.isPinned ? 'अनपिन' : 'पिन'}
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">कुनै प्रतिक्रिया छैन</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Read Next Section */}
                  <div className="py-12 border-t border-slate-100 mt-12 flex flex-col gap-10">
                    <div className="flex flex-col items-center gap-6 text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">अर्को समाचार पढ्नुहोस्</span>
                      <div className="flex items-center gap-4 p-1 bg-slate-100 rounded-full">
                        <button 
                          onClick={() => setActiveTab('related')}
                          className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'related' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          सम्बन्धित
                        </button>
                        <button 
                          onClick={() => setActiveTab('trending')}
                          className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'trending' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          ट्रेन्डिङ
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {(activeTab === 'related' ? relatedArticles : trendingArticles).slice(0, 4).map((item) => (
                        <Link key={item.id} to={`/article/${item.id}`} className="group flex gap-4 p-4 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                            <img src={item.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>{formatDate(item.createdAt)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Eye size={10} /> {item.views}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="flex justify-center pt-12 flex-col items-center gap-6 overflow-hidden">
                      {nextArticle ? (
                        <Link 
                          to={`/article/${nextArticle.id}`} 
                          className="group relative flex flex-col items-center gap-6 text-center max-w-2xl p-12 rounded-[3.5rem] bg-slate-50 hover:bg-white hover:shadow-[0_40px_80px_-15px_rgba(0,114,181,0.15)] transition-all duration-700 border border-transparent hover:border-primary/10"
                        >
                          <motion.div 
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/30 z-10"
                          >
                            अर्को समाचार
                          </motion.div>
                          
                          <div className="relative aspect-[16/6] w-full overflow-hidden rounded-4xl grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-20 group-hover:opacity-40">
                            <img src={nextArticle.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                          </div>

                          <div className="flex flex-col items-center gap-4 relative z-10 -mt-12">
                            <h4 className="text-2xl md:text-4xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight px-4">
                              {nextArticle.title}
                            </h4>
                            <div className="flex items-center gap-3 text-primary font-black text-sm uppercase tracking-widest mt-4">
                              पढ्न जारी राख्नुहोस् <ArrowRight size={20} className="group-hover:translate-x-3 transition-all duration-500" />
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <Link to="/trending" className="text-sm font-black text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-3">
                          सबै ट्रेन्डिङ हेर्नुहोस् <ArrowRight size={18} />
                        </Link>
                      )}
                      
                      <motion.div
                        animate={{ y: [0, 20, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="mt-8"
                      >
                         <ArrowRight size={48} className="text-primary hidden md:block rotate-90 opacity-20" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </div>
          </div>
        </div>
      </motion.main>
      </AnimatePresence>

      <Footer />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
