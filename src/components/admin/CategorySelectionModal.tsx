import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Database } from "lucide-react";

interface Category {
  nameNepali: string;
  nameEnglish: string;
  slug: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedCategories: string[]) => void;
  categories: Category[];
}

export default function CategorySelectionModal({ isOpen, onClose, onConfirm, categories }: Props) {
  const [selected, setSelected] = useState<string[]>(categories.map(c => c.slug));

  const toggleCategory = (slug: string) => {
    setSelected(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl flex flex-col gap-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">श्रेणीहरू छान्नुहोस्</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                    selected.includes(cat.slug)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                  }`}
                >
                  {cat.nameNepali}
                </button>
              ))}
            </div>

            <button
              onClick={() => onConfirm(selected)}
              disabled={selected.length === 0}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Database size={20} /> डमी डेटा थप्नुहोस्
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
