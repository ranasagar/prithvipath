import { useState, useEffect } from "react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { motion } from "motion/react";
import { Info } from "lucide-react";

export default function AboutPage() {
  const [content, setContent] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data().aboutUs || "हाम्रो बारेमा जानकारी उपलब्ध छैन।");
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pb-16 md:pb-24 container-custom">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-white rounded-[3rem] p-10 md:p-20 shadow-sm border border-slate-100"
        >
          <div className="flex flex-col items-center gap-6 text-center mb-12">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
              <Info size={40} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">हाम्रो बारेमा</h1>
            <div className="w-24 h-2 bg-primary rounded-full" />
          </div>

          <div className="prose-nepali whitespace-pre-wrap text-slate-600 leading-relaxed text-lg font-medium">
            {content}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
