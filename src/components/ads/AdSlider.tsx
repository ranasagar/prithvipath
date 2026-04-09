import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import type { Ad } from "@/src/types";

export default function AdSlider() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "ads"), 
      where("position", "==", "sidebar"),
      where("isActive", "==", true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      setAds(docs);
    }, (error) => {
      console.error("Error fetching ads:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) {
    return (
      <div className="bg-slate-50 rounded-[2.5rem] p-8 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 aspect-square">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">विज्ञापनको लागि</span>
        <h3 className="text-xl font-black text-slate-900 leading-tight">हामीलाई सम्पर्क गर्नुहोस्</h3>
        <a href="/contact" className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-primary/20">
          सम्पर्क पृष्ठ
        </a>
      </div>
    );
  }

  return (
    <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-xl bg-slate-100 group">
      <AnimatePresence mode="wait">
        <motion.a
          key={currentIndex}
          href={ads[currentIndex].linkUrl || "#"}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 block"
        >
          <img 
            src={ads[currentIndex].imageUrl} 
            alt={ads[currentIndex].title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <span className="text-white font-bold text-sm drop-shadow-md line-clamp-2">
              {ads[currentIndex].title}
            </span>
          </div>
        </motion.a>
      </AnimatePresence>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white/80 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
        Advertisement
      </div>
      
      {/* Indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
          {ads.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
