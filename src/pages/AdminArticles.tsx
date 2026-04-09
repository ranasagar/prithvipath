import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { 
  Plus, Eye, Search, Bell, Edit, Trash2, ExternalLink, FileText, Sparkles, Star
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import AlertModal from "@/src/components/ui/AlertModal";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AIGeneratorModal from "@/src/components/admin/AIGeneratorModal";
import { motion } from "motion/react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";

export default function AdminArticles() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: "",
    message: "",
    type: 'success'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user || (user.role !== 'admin' && user.role !== 'editor')) return;

    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(docs);
    }, (error) => {
      console.error("Error in articles snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "articles");
      }
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteDoc(doc(db, "articles", deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
      setAlertInfo({
        show: true,
        title: "सफलता!",
        message: "समाचार सफलतापूर्वक हटाइयो।",
        type: 'success'
      });
    } catch (err) {
      console.error("Error deleting article:", err);
      setAlertInfo({
        show: true,
        title: "त्रुटि!",
        message: "समाचार हटाउन सकिएन।",
        type: 'error'
      });
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.categoryId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <ConfirmModal
          isOpen={deleteConfirm.show}
          title="समाचार हटाउनुहोस्"
          message="के तपाईं यो समाचार हटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता लिन सकिने छैन।"
          confirmText="हटाउनुहोस्"
          cancelText="रद्द गर्नुहोस्"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null })}
        />

        <AlertModal
          isOpen={alertInfo.show}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
        />

        <AIGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSuccess={(message) => setAlertInfo({
            show: true,
            title: "सफलता!",
            message,
            type: 'success'
          })}
        />

        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">समाचारहरू</h1>
            <p className="text-sm font-medium text-slate-500">सबै समाचारहरू यहाँबाट व्यवस्थापन गर्नुहोस्।</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
              <NepaliInput 
                placeholder="समाचार खोज्नुहोस्..." 
                value={searchTerm}
                onChange={(val) => setSearchTerm(val)}
                className="bg-white border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setIsAIModalOpen(true)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
                >
                  <Sparkles size={20} /> AI समाचार
                </button>
              )}
              <Link to="/admin/editor" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <Plus size={20} /> नयाँ समाचार
              </Link>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">समाचार</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">विधा</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">अवस्था</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">भ्युज</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">मिति</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">कार्य</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr key={article.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                        <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-900 line-clamp-1">{article.title}</span>
                        <div className="flex gap-2">
                          {article.isBreaking && <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">ताजा</span>}
                          {article.isFeatured && <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">विशेष</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{article.categoryId}</span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      article.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {article.status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-1 text-slate-500 font-mono text-xs font-bold">
                      <Eye size={12} /> {article.views || 0}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-slate-400">{formatDate(article.createdAt)}</span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, "articles", article.id!), { isFeatured: !article.isFeatured });
                          } catch (error) {
                            console.error("Error toggling featured status:", error);
                          }
                        }}
                        className={`p-2 transition-colors ${article.isFeatured ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 hover:text-blue-600'}`}
                        title={article.isFeatured ? "विशेषबाट हटाउनुहोस्" : "विशेषमा राख्नुहोस्"}
                      >
                        <Star size={18} className={article.isFeatured ? "fill-current" : ""} />
                      </button>
                      <Link 
                        to={`/article/${article.id}`} 
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <Link 
                        to={`/admin/editor/${article.id}`} 
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(article.id!)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredArticles.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                <FileText size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">कुनै समाचार भेटिएन</p>
            </div>
          )}
        </div>
      </motion.main>
    </div>
  );
}
