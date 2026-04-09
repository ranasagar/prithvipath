import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Megaphone, Image as ImageIcon, Link as LinkIcon, Check, X } from "lucide-react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import { motion } from "motion/react";
import type { Ad, AdPosition } from "@/src/types";

export default function AdminAds() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  
  const [formData, setFormData] = useState<Partial<Ad>>({
    title: "",
    imageUrl: "",
    linkUrl: "",
    position: "sidebar",
    isActive: true
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;

    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      setAds(docs);
    }, (error) => {
      console.error("Error fetching ads:", error);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleOpenModal = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setFormData(ad);
    } else {
      setEditingAd(null);
      setFormData({
        title: "",
        imageUrl: "",
        linkUrl: "",
        position: "sidebar",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl) return;

    try {
      if (editingAd && editingAd.id) {
        await updateDoc(doc(db, "ads", editingAd.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, "ads"), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving ad:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("के तपाईं यो विज्ञापन हटाउन निश्चित हुनुहुन्छ?")) {
      try {
        await deleteDoc(doc(db, "ads", id));
      } catch (error) {
        console.error("Error deleting ad:", error);
      }
    }
  };

  const toggleActive = async (ad: Ad) => {
    if (!ad.id) return;
    try {
      await updateDoc(doc(db, "ads", ad.id), {
        isActive: !ad.isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error toggling ad status:", error);
    }
  };

  const positionLabels: Record<AdPosition, string> = {
    sidebar: "साइडबार (Sidebar)",
    homepage_mid: "गृहपृष्ठ मध्य (Homepage Mid)",
    article_bottom: "लेखको तल (Article Bottom)",
    header: "हेडर (Header)"
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">विज्ञापन व्यवस्थापन</h1>
            <p className="text-sm font-medium text-slate-500">पोर्टलमा देखिने विज्ञापनहरू प्रबन्ध गर्नुहोस्।</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Plus size={20} /> नयाँ विज्ञापन
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-slate-100">
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${ad.isActive ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                    {ad.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {positionLabels[ad.position]}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4 flex-grow">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{ad.title}</h3>
                {ad.linkUrl && (
                  <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline truncate">
                    <LinkIcon size={12} /> {ad.linkUrl}
                  </a>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                  <button 
                    onClick={() => toggleActive(ad)}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${ad.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    {ad.isActive ? 'निष्क्रिय गर्नुहोस्' : 'सक्रिय गर्नुहोस्'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenModal(ad)} className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(ad.id!)} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {ads.length === 0 && (
            <div className="col-span-full p-20 text-center flex flex-col items-center gap-4 bg-white rounded-[2rem] border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                <Megaphone size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">कुनै विज्ञापन भेटिएन</p>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-black text-slate-900">{editingAd ? 'विज्ञापन सम्पादन' : 'नयाँ विज्ञापन'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">शीर्षक</label>
                  <NepaliInput 
                    value={formData.title}
                    onChange={(val) => setFormData({...formData, title: val})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="विज्ञापनको शीर्षक"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">फोटो URL</label>
                    <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                      {formData.position === 'sidebar' ? '300 x 250 px' : 
                       formData.position === 'header' ? '728 x 90 px' : 
                       '970 x 250 px'}
                    </span>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-32 h-32 bg-slate-100 rounded-2xl flex-shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-grow">
                      <input 
                        type="text" 
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="https://..."
                      />
                      <p className="text-[9px] text-slate-400 font-medium italic">
                        * {formData.position === 'sidebar' ? 'साइडबारको लागि ३००x२५० पिक्सेल' : 
                           formData.position === 'header' ? 'हेडरको लागि ७२८x९० पिक्सेल' : 
                           'ब्यानरको लागि ९७०x२५० पिक्सेल'} उपयुक्त हुन्छ।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">लिङ्क URL (क्लिक गर्दा जाने ठाउँ)</label>
                  <input 
                    type="text" 
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">स्थान (Position)</label>
                  <select 
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value as AdPosition})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="sidebar">साइडबार (Sidebar)</option>
                    <option value="homepage_mid">गृहपृष्ठ मध्य (Homepage Mid)</option>
                    <option value="article_bottom">लेखको तल (Article Bottom)</option>
                    <option value="header">हेडर (Header)</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-primary' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">सक्रिय छ?</span>
                </label>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  रद्द गर्नुहोस्
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.title || !formData.imageUrl}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50"
                >
                  सुरक्षित गर्नुहोस्
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.main>
    </div>
  );
}
