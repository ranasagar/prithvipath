import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Eye, EyeOff, GripVertical, Settings,
  Save, AlertCircle
} from "lucide-react";
import { collection, doc, getDoc, setDoc, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import AlertModal from "@/src/components/ui/AlertModal";
import type { Navigation, MenuItem, Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";

export default function AdminMenu() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menu, setMenu] = useState<Navigation | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [alert, setAlert] = useState({ show: false, title: "", message: "", type: 'success' as 'success' | 'error' });
  const [newItem, setNewItem] = useState({
    label: "",
    type: "link" as "category" | "link" | "page" | "custom",
    url: "",
    categoryId: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Primary Menu
      const menuDoc = await getDoc(doc(db, "navigation", "primary"));
      if (menuDoc.exists()) {
        setMenu({ id: "primary", ...menuDoc.data() } as Navigation);
      } else {
        // Create default menu
        const defaultMenu: Navigation = {
          id: "primary",
          name: "Primary Navigation",
          location: "primary",
          items: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "navigation", "primary"), defaultMenu);
        setMenu(defaultMenu);
      }

      // Fetch Categories
      const q = query(collection(db, "categories"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(cats);
    };

    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!newItem.label) return;

    const item: MenuItem = {
      id: `item-${Date.now()}`,
      label: newItem.label,
      type: newItem.type,
      url: newItem.type === "custom" ? newItem.url : undefined,
      categoryId: newItem.type === "category" ? newItem.categoryId : undefined,
      order: (menu?.items.length || 0) + 1,
      isVisible: true
    };

    setMenu(prev => prev ? { ...prev, items: [...prev.items, item] } : null);
    setNewItem({ label: "", type: "link", url: "", categoryId: "" });
  };

  const handleDeleteItem = (id: string) => {
    setMenu(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== id) } : null);
  };

  const handleToggleVisibility = (id: string) => {
    setMenu(prev => prev ? {
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, isVisible: !i.isVisible } : i)
    } : null);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!menu) return;
    const items = [...menu.items];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    items.forEach((item, idx) => item.order = idx + 1);
    setMenu({ ...menu, items });
  };

  const handleSave = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      menu.updatedAt = new Date().toISOString();
      await setDoc(doc(db, "navigation", menu.id), menu);
      setAlert({
        show: true,
        title: "सफलता!",
        message: "मेनु सफलतापूर्वक सुरक्षित गरियो।",
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setAlert({
        show: true,
        title: "त्रुटि!",
        message: "मेनु सुरक्षित गर्दा त्रुटि भयो।",
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className="flex-1">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 py-4 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-3 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black text-slate-900">मेनु संपादन (Menu Editor)</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={20} /> सुरक्षित गर्नुहोस्
          </button>
        </header>

        <AlertModal
          isOpen={alert.show}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
        />

        <div className="p-8 max-w-6xl mx-auto">
          {/* Add New Item */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Plus size={20} className="text-primary" /> नयाँ मेनु आइटम थप्नुहोस्
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <input
                type="text"
                placeholder="मेनु आइटम नाम"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />

              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="link">सामान्य लिङ्क</option>
                <option value="category">श्रेणी</option>
                <option value="custom">कस्टम URL</option>
              </select>

              {newItem.type === "custom" && (
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              )}

              {newItem.type === "category" && (
                <select
                  value={newItem.categoryId}
                  onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">श्रेणी छान्नुहोस्</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.nameNepali}</option>
                  ))}
                </select>
              )}

              <button
                onClick={handleAddItem}
                disabled={!newItem.label || (newItem.type === "category" && !newItem.categoryId)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> थप्नुहोस्
              </button>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6">मेनु आइटमहरू</h3>

            {menu && menu.items.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {menu.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-primary/30 hover:bg-primary/2 transition-all"
                      draggable
                      onDragStart={() => setDraggedId(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedId && draggedId !== item.id) {
                          const fromIndex = menu.items.findIndex(i => i.id === draggedId);
                          handleReorder(fromIndex, index);
                        }
                        setDraggedId(null);
                      }}
                    >
                      <GripVertical size={20} className="text-slate-300 cursor-grab active:cursor-grabbing" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.type === "category"
                            ? `श्रेणी: ${categories.find(c => c.slug === item.categoryId)?.nameNepali || "अज्ञात"}`
                            : item.type === "custom"
                            ? `लिङ्क: ${item.url}`
                            : "सामान्य लिङ्क"}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleVisibility(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isVisible ? "text-green-600 bg-green-50" : "text-slate-300 bg-slate-100"
                        }`}
                        title={item.isVisible ? "छुप्नु" : "देखाउनु"}
                      >
                        {item.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium">अभी कुनै मेनु आइटम छैन। ऊपर नयाँ आइटम थप्नुहोस्।</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 text-sm text-blue-800 flex items-start gap-3">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-2">मेनु संपादन सुझाभाउ:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>ड्र्याग गरीएर पुनः क्रमबद्ध गर्नुहोस्</strong> - आइटमहरूलाई क्रमबद्ध गर्न ड्र्याग ह्यान्डल प्रयोग गर्नुहोस्</li>
                <li>• <strong>दृश्यमान टिपाल</strong> - आইको क्लिक गरेर मेनु आइटम लुकाउनु वा देखाउनु</li>
                <li>• <strong>स्वचालित अद्यतन</strong> - हेडरमा सुरक्षित गर्नुहोस् बटन क्लिक गरेर परिवर्तनहरू लागू गर्नुहोस्</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
