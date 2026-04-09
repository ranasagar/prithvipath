import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut, 
  Plus, Eye, Clock, TrendingUp, Search, Bell, 
  CheckCircle, AlertCircle, Send, Database, Menu
} from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, addDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import { seedDatabase, dummyCategories } from "@/src/lib/seedData";
import type { Article } from "@/src/types";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AlertModal from "@/src/components/ui/AlertModal";
import CategorySelectionModal from "@/src/components/admin/CategorySelectionModal";
import { motion, AnimatePresence } from "motion/react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedMessage, setSeedMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: "",
    message: "",
    type: 'success'
  });
  const [stats, setStats] = useState({
    totalViews: 0,
    liveUsers: 42, // Mocked live users
    pendingDrafts: 0,
    publishedToday: 0
  });
  const [quickDraft, setQuickDraft] = useState({ title: "", category: "politics" });

  const handleSeed = async () => {
    setShowCategoryModal(true);
  };

  const confirmSeed = async (selectedCategories: string[]) => {
    setShowCategoryModal(false);
    setSeeding(true);
    setSeedProgress(0);
    setSeedMessage("सुरु गर्दै...");
    
    try {
      const result = await seedDatabase(selectedCategories, (progress, message) => {
        setSeedProgress(progress);
        setSeedMessage(message);
      });
      
      setSeeding(false);
      if (result.success) {
        setAlertInfo({
          show: true,
          title: "सफलता!",
          message: "डेटाबेस सफलतापूर्वक सीड गरियो!",
          type: 'success'
        });
      } else {
        setAlertInfo({
          show: true,
          title: "त्रुटि!",
          message: `डेटाबेस सीड गर्दा समस्या आयो: ${result.error}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Critical error during seeding:", err);
      setSeeding(false);
      setAlertInfo({
        show: true,
        title: "क्रिटिकल त्रुटि!",
        message: `क्रिटिकल त्रुटि: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error'
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user || (user.role !== 'admin' && user.role !== 'editor')) return;

    const q = query(
      collection(db, "articles"), 
      orderBy("createdAt", "desc"), 
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRecent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      const updates = allRecent.filter(a => a.isBreaking || a.isFeatured).slice(0, 5);
      setRecentArticles(updates);
      
      let views = 0;
      let drafts = 0;
      allRecent.forEach(a => {
        views += a.views || 0;
        if (a.status === "draft") drafts++;
      });
      setStats(prev => ({ ...prev, totalViews: views, pendingDrafts: drafts }));
    }, (error) => {
      console.error("Error in articles snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "articles");
      }
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleQuickDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraft.title) return;
    
    try {
      await addDoc(collection(db, "articles"), {
        ...quickDraft,
        content: "",
        excerpt: "",
        authorId: user?.uid,
        authorName: user?.displayName,
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

      {/* Main Content */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? "80px" : "280px" }}
        className="flex-grow p-8 transition-all duration-300 ease-in-out"
      >
        {/* Modals */}
        <CategorySelectionModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onConfirm={confirmSeed}
          categories={dummyCategories as any}
        />

        <AlertModal
          isOpen={alertInfo.show}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
        />

        {/* Seeding Progress Overlay */}
        <AnimatePresence>
          {seeding && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl flex flex-col gap-8"
              >
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Database size={40} />
                </div>
                <div className="flex flex-col gap-2 text-center">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">डेटा सीडिङ हुँदैछ</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{seedMessage}</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border-4 border-slate-50">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${seedProgress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">प्रगति</span>
                    <span className="text-sm font-black text-primary font-mono">{Math.round(seedProgress)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  <p className="text-[0.65rem] font-bold text-orange-700 uppercase tracking-wider leading-tight">
                    कृपया यो विन्डो बन्द नगर्नुहोस्। एआईले सामग्री सिर्जना गर्दैछ।
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">नमस्ते, {user?.displayName}!</h1>
            <p className="text-sm font-medium text-slate-500">आजको समाचार र अपडेटहरू यहाँ छन्।</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="खोज्नुहोस्..." 
                className="bg-white border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all"
              />
            </div>
            <button className="relative p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-primary transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              <Database size={20} /> {seeding ? "सीडिङ..." : "डमी डेटा थप्नुहोस्"}
            </button>
            <Link to="/admin/editor" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus size={20} /> नयाँ समाचार
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Eye size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">{(stats.totalViews).toLocaleString('ne-NP')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">कुल भ्युज</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">{(stats.liveUsers).toLocaleString('ne-NP')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">लाइभ प्रयोगकर्ता</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">{(stats.pendingDrafts).toLocaleString('ne-NP')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">पेन्डिङ ड्राफ्ट</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900">१२</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">आज प्रकाशित</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Articles */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">ताजा तथा विशेष अपडेटहरू</h3>
              <Link to="/admin/articles" className="text-primary text-sm font-bold hover:underline">सबै हेर्नुहोस्</Link>
            </div>
            <div className="flex flex-col gap-6">
              {recentArticles.map((article) => (
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
              ))}
            </div>
          </div>

          {/* Quick Draft Widget */}
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

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-primary" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">सूचना</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    सर्भर मेन्टेनेन्स आज राति १० बजेदेखि हुनेछ।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
