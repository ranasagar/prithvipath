import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { 
  Plus, Trash2, Edit2, Save, X, GripVertical, 
  LayoutDashboard, FileText, Users, Settings, Tag
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import AlertModal from "@/src/components/ui/AlertModal";
import ConfirmModal from "@/src/components/ui/ConfirmModal";

interface Category {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  slug: string;
  order: number;
  homepageStyle?: "grid" | "featured_list" | "cards" | "alternating" | "magazine" | "masonry" | "overlay";
  postCount?: number;
  isHidden?: boolean;
}

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, title: "", message: "", type: 'success' as 'success' | 'error' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null as string | null });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;

    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    }, (error) => {
      console.error("Error in categories snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "categories");
      }
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm(cat);
  };

  const handleSave = async () => {
    if (!editForm.nameNepali || !editForm.slug) return;
    
    try {
      if (editingId === 'new') {
        await addDoc(collection(db, "categories"), {
          ...editForm,
          order: categories.length
        });
      } else if (editingId) {
        await setDoc(doc(db, "categories", editingId), editForm, { merge: true });
      }
      setEditingId(null);
      setIsAdding(false);
      setAlertInfo({ show: true, title: "सफलता!", message: "विधा सुरक्षित गरियो।", type: 'success' });
    } catch (err) {
      console.error("Error saving category:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "बचत गर्दा समस्या आयो।", type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete({ show: true, id });
  };

  const confirmDeleteCategory = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteDoc(doc(db, "categories", confirmDelete.id));
      setConfirmDelete({ show: false, id: null });
      setAlertInfo({ show: true, title: "सफलता!", message: "विधा हटाइयो।", type: 'success' });
    } catch (err) {
      console.error("Error deleting category:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "हटाउन सकिएन।", type: 'error' });
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
        <AlertModal 
          isOpen={alertInfo.show} 
          title={alertInfo.title} 
          message={alertInfo.message} 
          type={alertInfo.type} 
          onClose={() => setAlertInfo({ ...alertInfo, show: false })} 
        />
        <ConfirmModal 
          isOpen={confirmDelete.show} 
          title="विधा हटाउनुहोस्" 
          message="के तपाईं यो विधा हटाउन निश्चित हुनुहुन्छ?" 
          confirmText="हटाउनुहोस्"
          cancelText="रद्द गर्नुहोस्"
          onConfirm={confirmDeleteCategory} 
          onCancel={() => setConfirmDelete({ show: false, id: null })} 
        />

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">विधाहरू (Categories)</h1>
              <p className="text-slate-500 font-medium">समाचारका विधाहरू व्यवस्थापन गर्नुहोस्</p>
            </div>
            <button 
              onClick={() => {
                setEditingId('new');
                setEditForm({ nameNepali: "", nameEnglish: "", slug: "", order: categories.length });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <Plus size={18} /> नयाँ विधा
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">क्रम</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">नेपाली नाम</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">होमपेज शैली</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">संख्या</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">होमपेजमा लुकाउने</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">कार्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isAdding && editingId === 'new' && (
                    <tr className="bg-primary/5">
                      <td className="px-8 py-6">
                        <input 
                          type="number" 
                          value={editForm.order} 
                          onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) })}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <NepaliInput 
                          value={editForm.nameNepali} 
                          onChange={(val) => setEditForm({ ...editForm, nameNepali: val })}
                          placeholder="नेपाली नाम"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="text" 
                          value={editForm.slug} 
                          onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                          placeholder="slug"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={editForm.homepageStyle || "grid"} 
                          onChange={(e) => setEditForm({ ...editForm, homepageStyle: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                        >
                          <option value="grid">Grid (2x2)</option>
                          <option value="featured_list">Featured + List</option>
                          <option value="cards">Cards (4x1)</option>
                          <option value="alternating">Alternating Row</option>
                          <option value="magazine">Magazine</option>
                          <option value="masonry">Masonry</option>
                          <option value="overlay">Overlay</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="number" 
                          value={editForm.postCount || 4} 
                          onChange={(e) => setEditForm({ ...editForm, postCount: parseInt(e.target.value) })}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="checkbox" 
                          checked={editForm.isHidden || false} 
                          onChange={(e) => setEditForm({ ...editForm, isHidden: e.target.checked })}
                          className="w-5 h-5 accent-primary"
                        />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={handleSave} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Save size={18} /></button>
                          <button onClick={() => { setEditingId(null); setIsAdding(false); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        {editingId === cat.id ? (
                          <input 
                            type="number" 
                            value={editForm.order} 
                            onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) })}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-400">#{cat.order}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editingId === cat.id ? (
                          <NepaliInput 
                            value={editForm.nameNepali} 
                            onChange={(val) => setEditForm({ ...editForm, nameNepali: val })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-900">{cat.nameNepali}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editingId === cat.id ? (
                          <input 
                            type="text" 
                            value={editForm.slug} 
                            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-sm text-slate-500 font-mono">{cat.slug}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editingId === cat.id ? (
                          <select 
                            value={editForm.homepageStyle || "grid"} 
                            onChange={(e) => setEditForm({ ...editForm, homepageStyle: e.target.value as any })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm"
                          >
                            <option value="grid">Grid (2x2)</option>
                            <option value="featured_list">Featured + List</option>
                            <option value="cards">Cards (4x1)</option>
                            <option value="alternating">Alternating Row</option>
                            <option value="magazine">Magazine</option>
                            <option value="masonry">Masonry</option>
                            <option value="overlay">Overlay</option>
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {cat.homepageStyle || "grid"}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editingId === cat.id ? (
                          <input 
                            type="number" 
                            value={editForm.postCount || 4} 
                            onChange={(e) => setEditForm({ ...editForm, postCount: parseInt(e.target.value) })}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-400">{cat.postCount || 4}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editingId === cat.id ? (
                          <input 
                            type="checkbox" 
                            checked={editForm.isHidden || false} 
                            onChange={(e) => setEditForm({ ...editForm, isHidden: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                          />
                        ) : (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${cat.isHidden ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {cat.isHidden ? 'लुकाइएको' : 'देखिने'}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingId === cat.id ? (
                            <>
                              <button onClick={handleSave} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Save size={18} /></button>
                              <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                              <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
