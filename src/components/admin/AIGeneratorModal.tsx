import { useState, useEffect } from "react";
import { Sparkles, X, Loader2, Save, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase";
import { generateAINews } from "@/src/services/aiNewsService";
import type { Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function AIGeneratorModal({ isOpen, onClose, onSuccess }: AIGeneratorModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    title: string;
    excerpt: string;
    content: string;
    sourceUrls?: string[];
    imageUrl?: string;
    districts?: string[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      const q = query(collection(db, "categories"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      const uniqueCats = Array.from(new Map(cats.map(c => [c.slug, c])).values());
      setCategories(uniqueCats);
      if (uniqueCats.length > 0) setSelectedCategory(uniqueCats[0].slug);
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setGeneratedData(null);
    
    try {
      const cat = categories.find(c => c.slug === selectedCategory);
      if (!cat) throw new Error("Category not found");
      
      const result = await generateAINews(cat.nameEnglish || cat.slug, cat.nameNepali);
      setGeneratedData(result as any);
    } catch (err) {
      console.error(err);
      setError("समाचार सिर्जना गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!generatedData || !auth.currentUser) return;
    
    try {
      const cat = categories.find(c => c.slug === selectedCategory);
      
      await addDoc(collection(db, "articles"), {
        title: generatedData.title,
        excerpt: generatedData.excerpt,
        content: generatedData.content,
        categoryId: selectedCategory,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Admin",
        status,
        featuredImage: (generatedData as any).imageUrl || `https://picsum.photos/seed/${selectedCategory}-${Date.now()}/1200/800`,
        views: 0,
        isBreaking: false,
        isFeatured: false,
        districts: generatedData.districts || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceUrls: generatedData.sourceUrls || []
      });
      
      onSuccess(status === 'published' ? "समाचार सफलतापूर्वक प्रकाशित गरियो।" : "समाचार ड्राफ्टमा सुरक्षित गरियो।");
      onClose();
      setGeneratedData(null);
    } catch (err) {
      console.error(err);
      setError("समाचार सुरक्षित गर्न सकिएन।");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl sm:max-w-4xl bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 text-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0">
              <Sparkles size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">AI समाचार सिर्जना</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-1 sm:line-clamp-2">ताजा र ट्रेन्डिङ समाचारहरू स्वचालित रूपमा तयार पार्नुहोस्।</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 sm:p-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8">
          {!generatedData ? (
            <div className="max-w-xl mx-auto py-12 text-center space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">समाचारको विधा छान्नुहोस्</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                        selectedCategory === cat.slug 
                        ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/10" 
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                      }`}
                    >
                      {cat.nameNepali}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedCategory}
                className="w-full bg-slate-900 text-white py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">खोज्दै र लेख्दै...</span>
                    <span className="sm:hidden">तयार पार्दै...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">AI समाचार तयार पार्नुहोस्</span>
                    <span className="sm:hidden">समाचार तयार</span>
                  </>
                )}
              </button>
              
              <p className="text-xs sm:text-sm font-medium text-slate-400">
                * यसले गुगल सर्च प्रयोग गरेर आजका ताजा समाचारहरू खोज्नेछ र नेपालीमा लेख्नेछ।
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                  <CheckCircle2 size={14} /> सिर्जना गरिएको समाचार
                </div>
                {(generatedData as any).imageUrl && (
                  <div className="relative aspect-video overflow-hidden rounded-[2rem] shadow-xl mb-6">
                    <img 
                      src={(generatedData as any).imageUrl} 
                      alt="AI Generated" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <h3 className="text-3xl font-black text-slate-900 leading-tight">{generatedData.title}</h3>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-600 font-medium leading-relaxed">
                  {generatedData.excerpt}
                </div>
                <div className="prose-nepali whitespace-pre-wrap">
                  {generatedData.content}
                </div>

                {generatedData.districts && generatedData.districts.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100 space-y-2">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                      <CheckCircle2 size={14} /> सम्बद्ध जिल्लाहरू
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedData.districts.map((district, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          {district}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {generatedData.sourceUrls && generatedData.sourceUrls.length > 0 && (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                    <Globe size={14} /> स्रोतहरू (Sources)
                  </div>
                  <ul className="space-y-1">
                    {generatedData.sourceUrls.map((url, i) => (
                      <li key={i} className="text-xs font-medium text-blue-500 truncate">
                        <a href={url} target="_blank" rel="noreferrer" className="hover:underline">{url}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedData && (
          <div className="p-4 sm:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <button 
              onClick={() => setGeneratedData(null)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-4 rounded-lg sm:rounded-2xl font-bold text-xs sm:text-base text-slate-500 hover:bg-slate-100 transition-colors"
            >
              फेरि प्रयास
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => handleSave('draft')}
                className="flex-1 sm:flex-none px-3 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-2xl font-bold text-xs sm:text-base text-slate-900 bg-white border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-1 sm:gap-2"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">ड्राफ्टमा राख्नुहोस्</span><span className="sm:hidden">ड्राफ्ट</span>
              </button>
              <button 
                onClick={() => handleSave('published')}
                className="flex-1 sm:flex-none px-3 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-2xl font-black text-xs sm:text-base text-white bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-2"
              >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">प्रकाशित गर्नुहोस्</span><span className="sm:hidden">प्रकाशित</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
