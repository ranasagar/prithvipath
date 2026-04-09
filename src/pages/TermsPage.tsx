import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { motion } from "motion/react";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const [content, setContent] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        setContent(doc.data().termsContent || "नियम र सर्तहरू उपलब्ध छैनन्।");
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pb-20">
        <div className="container-custom max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-12"
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-12">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <FileText size={32} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">नियम र सर्तहरू</h1>
              <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Terms & Conditions</p>
            </div>

            <div className="prose prose-slate max-w-none prose-lg prose-nepali whitespace-pre-wrap text-slate-700 leading-relaxed">
              {content}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
