import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import type { Ad, AdPosition } from "@/src/types";

interface AdBannerProps {
  position: AdPosition;
  className?: string;
}

export default function AdBanner({ position, className = "" }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "ads"), 
      where("position", "==", position),
      where("isActive", "==", true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      setAds(docs);
    }, (error) => {
      console.error("Error fetching ads:", error);
    });

    return () => unsubscribe();
  }, [position]);

  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden rounded-[2rem] shadow-sm bg-slate-100 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.a
          key={currentIndex}
          href={ads[currentIndex].linkUrl || "#"}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="block w-full h-full"
        >
          <img 
            src={ads[currentIndex].imageUrl} 
            alt={ads[currentIndex].title} 
            className="w-full h-full object-cover"
          />
        </motion.a>
      </AnimatePresence>
      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-white/90 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">
        Ad
      </div>
    </div>
  );
}
