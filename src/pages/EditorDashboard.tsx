import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Plus, Eye, Clock, TrendingUp, Search, Bell, 
  CheckCircle, AlertCircle, Send
} from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import { motion } from "motion/react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";

export default function EditorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    pendingDrafts: 0,
    publishedToday: 0
  });
  const [quickDraft, setQuickDraft] = useState({ title: "", category: "politics" });

  useEffect(() => {
    if (authLoading || !user || user.role !== 'editor') return;

    // Fetch only articles by this editor
    const q = query(
      collection(db, "articles"), 
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc"), 
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const myArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setRecentArticles(myArticles);
      
      let views = 0;
      let drafts = 0;
      myArticles.forEach(a => {
        views += a.views || 0;
        if (a.status === "draft") drafts++;
      });
      setStats(prev => ({ ...prev, totalViews: views, pendingDrafts: drafts }));
    }, (error) => {
      console.error("Error in editor articles snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "articles");
      }
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleQuickDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraft.title || !user) return;
    
    try {
      await addDoc(collection(db, "articles"), {
        ...quickDraft,
        content: "",
        excerpt: "",
        authorId: user.uid,
        authorName: user.displayName,
        status: "draft",
        featuredImage: "https://picsum.photos/seed/draft/800/600",
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setQuickDraft({ title: "", category: "politics" });
      alert("ड्राफ्ट सुरक्षित गरियो!");
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? "80px" : "280px" }}
        className="flex-grow p-8 transition-all duration-300 ease-in-out"
      >
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">नमस्ते, {user?.displayName}!</h1>
            <p className="text-sm font-medium text-slate-500">तपाईंका समाचार र अपडेटहरू यहाँ छन्।</p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/admin/editor" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus size={20} /> नयाँ समाचार
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Eye size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">{(stats.totalViews).toLocaleString('ne-NP')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">तपाईंका समाचारको कुल भ्युज</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">{(stats.pendingDrafts).toLocaleString('ne-NP')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">तपाईंका पेन्डिङ ड्राफ्ट</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">{(recentArticles.filter(a => a.status === 'published').length).toLocaleString('ne-NP')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">कुल प्रकाशित</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">तपाईंका पछिल्ला समाचारहरू</h3>
              <Link to="/admin/articles" className="text-primary text-sm font-bold hover:underline">सबै हेर्नुहोस्</Link>
            </div>
            <div className="flex flex-col gap-6">
              {recentArticles.length > 0 ? recentArticles.map((article) => (
                <div key={article.id} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                      <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{article.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{article.categoryId}</span>
                        <span>•</span>
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      article.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {article.status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}
                    </span>
                    <Link to={`/admin/editor/${article.id}`} className="p-2 text-slate-400 hover:text-primary transition-all">
                      <FileText size={18} />
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                  कुनै समाचार भेटिएन।
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Send size={24} className="text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tight">क्विक ड्राफ्ट</h3>
              </div>
              <form onSubmit={handleQuickDraft} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">शीर्षक</label>
                  <input 
                    type="text" 
                    value={quickDraft.title}
                    onChange={(e) => setQuickDraft({ ...quickDraft, title: e.target.value })}
                    placeholder="समाचारको शीर्षक..." 
                    className="w-full bg-white/10 border-none rounded-2xl py-4 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">विधा</label>
                  <select 
                    value={quickDraft.category}
                    onChange={(e) => setQuickDraft({ ...quickDraft, category: e.target.value })}
                    className="w-full bg-white/10 border-none rounded-2xl py-4 px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    <option value="politics" className="bg-slate-900">राजनीति</option>
                    <option value="desh" className="bg-slate-900">देश</option>
                    <option value="sports" className="bg-slate-900">खेलकुद</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-2"
                >
                  ड्राफ्ट सुरक्षित गर्नुहोस्
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
