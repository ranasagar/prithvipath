import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { transliterate, fetchSuggestions } from "@/src/lib/nepaliTransliteration";
import { 
  Save, Eye, ArrowLeft, Image as ImageIcon, 
  Settings, Globe, Clock, Tag, LayoutDashboard,
  CheckCircle, AlertCircle, Trash2, Send, FileText, Languages, ChevronDown, MapPin, X, PanelRightClose, PanelRightOpen
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { createNotification } from "@/src/lib/notifications";
import { useAuth } from "@/src/lib/auth";
import { UNIQUE_DISTRICTS } from "@/src/constants/districts";
import type { Article, ArticleStatus } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";

import NepaliInput from "@/src/components/ui/NepaliInput";

import AlertModal from "@/src/components/ui/AlertModal";
import ConfirmModal from "@/src/components/ui/ConfirmModal";

export default function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [logoUrl, setLogoUrl] = useState("https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true");
  const [districtSearch, setDistrictSearch] = useState("");
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    title: "",
    message: "",
    type: 'success' as 'success' | 'error'
  });
  const [confirmInfo, setConfirmInfo] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    // Listen for global site settings (logo)
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists() && doc.data().logoUrl) {
        setLogoUrl(doc.data().logoUrl);
      }
    }, (error) => {
      console.error("Error in editor settings snapshot:", error);
    });
    return () => unsub();
  }, []);
  
  const [categories, setCategories] = useState<{ id: string; slug: string; nameNepali: string }[]>([]);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        slug: doc.data().slug,
        nameNepali: doc.data().nameNepali 
      }));
      const uniqueCats = Array.from(new Map(cats.map(c => [c.slug, c])).values());
      if (uniqueCats.length > 0) {
        setCategories(uniqueCats);
      } else {
        setCategories([
          { id: "politics", slug: "politics", nameNepali: "राजनीति" },
          { id: "desh", slug: "desh", nameNepali: "देश" },
          { id: "pradesh", slug: "pradesh", nameNepali: "प्रदेश" },
          { id: "bishwo", slug: "bishwo", nameNepali: "विश्व" },
          { id: "sports", slug: "sports", nameNepali: "खेलकुद" },
          { id: "entertainment", slug: "entertainment", nameNepali: "मनोरञ्जन" },
          { id: "economy", slug: "economy", nameNepali: "अर्थ" },
          { id: "tech", slug: "tech", nameNepali: "प्रविधि" },
        ]);
      }
    }, (error) => {
      console.error("Error in editor categories snapshot:", error);
    });
    return () => unsubscribe();
  }, []);
  const [article, setArticle] = useState<Partial<Article>>({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "politics",
    status: "draft",
    featuredImage: "https://picsum.photos/seed/news/1200/800",
    views: 0,
    isBreaking: false,
    isFeatured: false,
    districts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id) {
      const fetchArticle = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, "articles", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
          }
        } catch (err) {
          console.error("Error fetching article:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    }
  }, [id]);

  const toggleDistrict = (district: string) => {
    setArticle(prev => {
      const districts = prev.districts || [];
      if (districts.includes(district)) {
        return { ...prev, districts: districts.filter(d => d !== district) };
      } else {
        return { ...prev, districts: [...districts, district] };
      }
    });
  };

  const filteredDistricts = UNIQUE_DISTRICTS.filter(d => 
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const handleSave = async (status: ArticleStatus = "draft") => {
    if (!article.title) {
      setAlertInfo({ show: true, title: "त्रुटि!", message: "कृपया शीर्षक राख्नुहोस्।", type: 'error' });
      return;
    }
    
    setSaving(true);
    try {
      const articleData: any = {
        ...article,
        status,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        // Append to edit history
        const newEditLog = {
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || "unknown",
          updatedByName: user?.displayName || "Unknown"
        };
        articleData.editHistory = [...(article.editHistory || []), newEditLog];
        await updateDoc(doc(db, "articles", id), articleData);
      } else {
        articleData.authorId = user?.uid;
        articleData.authorName = user?.displayName;
        const docRef = await addDoc(collection(db, "articles"), articleData);
        
        // Create notification for new published article
        if (status === "published") {
          await createNotification({
            title: "नयाँ समाचार",
            message: `${article.title} - भर्खरै प्रकाशित भएको छ।`,
            type: "success",
            role: "all",
            link: `/article/${docRef.id}`
          });
        }
        
        navigate(`/admin/editor/${docRef.id}`);
      }
      setAlertInfo({
        show: true,
        title: "सफलता!",
        message: "समाचार सफलतापूर्वक सुरक्षित गरियो।",
        type: 'success'
      });
    } catch (err) {
      console.error("Error saving article:", err);
      setAlertInfo({
        show: true,
        title: "त्रुटि!",
        message: "बचत गर्दा समस्या आयो।",
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "articles", id));
      navigate("/admin/articles");
    } catch (err) {
      console.error("Error deleting article:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "समाचार मेटाउन सकिएन।", type: 'error' });
    }
  };

  const handleDelete = () => {
    if (!id) return;
    setConfirmInfo({
      show: true,
      title: "समाचार मेटाउनुहोस्",
      message: "के तपाईं यो समाचार मेटाउन चाहनुहुन्छ?",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeDelete();
      }
    });
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleContentChange = (content: string) => {
    setArticle(prev => {
      const newArticle = { ...prev, content };
      
      // Auto-generate excerpt if empty
      if (!prev.excerpt || prev.excerpt.trim() === "") {
        const plainText = content.replace(/<[^>]*>/g, '').slice(0, 200);
        newArticle.excerpt = plainText;
      }
      
      return newArticle;
    });
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Editor Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 py-4 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/admin/articles" className="p-3 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 bg-slate-50 rounded-xl p-1 hidden md:block">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {id ? "समाचार सम्पादन" : "नयाँ समाचार थप्नुहोस्"}
            </h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {article.status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-3 rounded-2xl transition-all ${isSidebarCollapsed ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}
            title={isSidebarCollapsed ? "सेटिङहरू देखाउनुहोस्" : "सेटिङहरू लुकाउनुहोस्"}
          >
            {isSidebarCollapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
          </button>
          {id && (
            <button 
              onClick={handleDelete}
              className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            ड्राफ्ट सुरक्षित गर्नुहोस्
          </button>
          <button 
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={18} /> प्रकाशित गर्नुहोस्
          </button>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        <AlertModal 
          isOpen={alertInfo.show}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        />
        <ConfirmModal
          isOpen={confirmInfo.show}
          title={confirmInfo.title}
          message={confirmInfo.message}
          onConfirm={confirmInfo.onConfirm}
          onCancel={() => setConfirmInfo({ ...confirmInfo, show: false })}
        />
        {/* Main Editor Area */}
        <main className="flex-grow overflow-y-auto p-12 lg:p-20 bg-slate-50">
          <div className="max-w-4xl mx-auto flex flex-col gap-12">
            {/* Title Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-primary" /> समाचारको शीर्षक (Title)
              </label>
              <NepaliInput 
                value={article.title || ""}
                onChange={(val) => setArticle({ ...article, title: val })}
                placeholder="यहाँ समाचारको शीर्षक लेख्नुहोस्..."
                className="w-full bg-transparent border-none text-4xl md:text-6xl font-black text-slate-900 placeholder:text-slate-200 outline-none resize-none leading-tight tracking-tight"
                type="textarea"
                rows={2}
              />
            </div>

            {/* Excerpt Input */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-primary" /> सारांश (Excerpt)
              </label>
              <NepaliInput 
                value={article.excerpt || ""}
                onChange={(val) => setArticle({ ...article, excerpt: val })}
                placeholder="समाचारको छोटो सारांश यहाँ लेख्नुहोस्..."
                className="w-full bg-white border border-slate-100 rounded-[2rem] p-8 text-lg font-medium text-slate-600 outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                type="textarea"
                rows={3}
              />
            </div>

            {/* Content Editor with Nepali Transliteration */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-primary" /> मुख्य सामग्री (Content)
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">नेपाली अनुवाद समर्थित</span>
              </label>
              <NepaliInput 
                value={article.content || ""}
                onChange={handleContentChange}
                placeholder="समाचारको मुख्य सामग्री यहाँ लेख्नुहोस्... (अङ्ग्रेजीमा लेखेपछि नेपालीमा स्वचालित अनुवाद हुन्छ)"
                className="w-full bg-white border border-slate-100 rounded-[2rem] p-8 text-lg font-medium text-slate-600 outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                type="textarea"
                rows={12}
              />
            </div>
          </div>
        </main>

        {/* Sidebar Settings */}
        <AnimatePresence initial={false}>
          {!isSidebarCollapsed && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white border-l border-slate-100 flex flex-col overflow-hidden"
            >
              <div className="w-96 p-10 flex flex-col gap-10 overflow-y-auto h-full">
                <div className="flex flex-col gap-8">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Settings size={20} className="text-primary" /> सेटिङहरू
                  </h3>

                  {/* Featured Image */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">मुख्य फोटो (URL)</label>
                      <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">1200 x 800 px</span>
                    </div>
                    <div className="relative group">
                      <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
                        {article.featuredImage ? (
                          <img src={article.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={32} className="text-slate-300" />
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={article.featuredImage}
                        onChange={(e) => setArticle({ ...article, featuredImage: e.target.value })}
                        placeholder="https://..."
                        className="mt-4 w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-[9px] text-slate-400 mt-2 font-medium italic">
                        * राम्रो रेस्पोन्सिभको लागि 1200x800 पिक्सेलको फोटो प्रयोग गर्नुहोस्।
                      </p>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">विधा (Category)</label>
                    <select 
                      value={article.categoryId}
                      onChange={(e) => setArticle({ ...article, categoryId: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>{cat.nameNepali}</option>
                      ))}
                    </select>
                  </div>

                  {/* District Selection */}
                  <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} className="text-primary" /> जिल्ला (Districts)
                    </label>
                    
                    {/* Selected Districts */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {article.districts?.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                          {d}
                          <button onClick={() => toggleDistrict(d)} className="hover:text-accent">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="relative">
                      <NepaliInput 
                        value={districtSearch}
                        onChange={(val) => setDistrictSearch(val)}
                        placeholder="जिल्ला खोज्नुहोस्..."
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {districtSearch && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                          {filteredDistricts.length > 0 ? (
                            filteredDistricts.map(d => (
                              <button
                                key={d}
                                onClick={() => {
                                  toggleDistrict(d);
                                  setDistrictSearch("");
                                }}
                                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition-colors ${article.districts?.includes(d) ? 'font-black text-primary' : 'text-slate-600'}`}
                              >
                                {d}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-xs text-slate-400">कुनै जिल्ला भेटिएन</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Views Count */}
                  <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Eye size={12} className="text-primary" /> हेरिएको संख्या (Views)
                    </label>
                    <input 
                      type="number" 
                      value={article.views || 0}
                      onChange={(e) => setArticle({ ...article, views: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">ताजा समाचार (Breaking)</span>
                      <input 
                        type="checkbox" 
                        checked={article.isBreaking}
                        onChange={(e) => setArticle({ ...article, isBreaking: e.target.checked })}
                        className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-primary relative transition-all cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-5"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">विशेष समाचार (Featured)</span>
                      <input 
                        type="checkbox" 
                        checked={article.isFeatured}
                        onChange={(e) => setArticle({ ...article, isFeatured: e.target.checked })}
                        className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-primary relative transition-all cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-5"
                      />
                    </label>
                  </div>

                  {/* Video URL */}
                  <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">भिडियो लिङ्क (YouTube)</label>
                    <input 
                      type="text" 
                      value={article.videoUrl || ""}
                      onChange={(e) => setArticle({ ...article, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="mt-auto p-8 bg-slate-50 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Clock size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">अन्तिम पटक सम्पादन:</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{new Date(article.updatedAt || "").toLocaleString('ne-NP')}</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
