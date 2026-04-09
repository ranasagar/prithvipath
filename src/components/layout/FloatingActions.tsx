import { useState, useEffect } from "react";
import { ArrowUp, List, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";

export default function FloatingActions({ 
  onOpenTopics, 
  categories 
}: { 
  onOpenTopics?: () => void,
  categories?: { id?: string; name: string; slug: string }[]
}) {
  const [show, setShow] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToCategory = (slug: string) => {
    const element = document.getElementById(`category-${slug}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setShowCategories(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 right-8 z-50 flex flex-col gap-4"
        >
          {isHomePage && categories && categories.length > 0 && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCategories(!showCategories)}
                className="p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                <List size={24} />
              </motion.button>
              <AnimatePresence>
                {showCategories && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-4 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                  >
                    {categories.map((cat, index) => (
                      <button
                        key={cat.id || cat.slug || index}
                        onClick={() => scrollToCategory(cat.slug)}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isHomePage && onOpenTopics && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onOpenTopics}
              className="p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              <List size={24} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="p-4 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowUp size={24} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
