import { useState, useEffect } from "react";
import NepaliInput from "@/src/components/ui/NepaliInput";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Send } from "lucide-react";

export default function ContactPage() {
  const [settings, setSettings] = useState({
    contactEmail: "",
    contactPhone: "",
    address: "",
    contactUs: ""
  });
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to send");
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pb-16 md:pb-24 container-custom">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">हामीलाई सम्पर्क गर्नुहोस्</h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                {settings.contactUs || "तपाईंका जिज्ञासा, सुझाव वा समाचारका लागि हामीलाई तलको ठेगानामा सम्पर्क गर्न सक्नुहुन्छ। हामी तपाईंको प्रतिक्रियाको प्रतीक्षामा छौँ।"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">कार्यालय</span>
                  <span className="text-sm font-bold text-slate-700">{settings.address || "काठमाडौं, नेपाल"}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">फोन नम्बर</span>
                  <span className="text-sm font-bold text-slate-700">{settings.contactPhone || "+९७७-०१-XXXXXXX"}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">इमेल</span>
                  <span className="text-sm font-bold text-slate-700">{settings.contactEmail || "info@prithvipath.com"}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[3rem] p-6 mobile:p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-8">हामीलाई सन्देश पठाउनुहोस्</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">पूरा नाम</label>
                <NepaliInput 
                  value={formData.name} 
                  onChange={val => setFormData({...formData, name: val})} 
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                  placeholder="तपाईंको नाम" 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">इमेल ठेगाना</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="example@email.com" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">विषय</label>
                <NepaliInput 
                  value={formData.subject} 
                  onChange={val => setFormData({...formData, subject: val})} 
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                  placeholder="सन्देशको विषय" 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">सन्देश</label>
                <NepaliInput 
                  value={formData.message} 
                  onChange={val => setFormData({...formData, message: val})} 
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                  rows={4} 
                  type="textarea"
                  placeholder="यहाँ आफ्नो सन्देश लेख्नुहोस्..." 
                  required 
                />
              </div>
              <button disabled={status === "sending"} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                <Send size={18} /> {status === "sending" ? "पठाउँदै..." : "सन्देश पठाउनुहोस्"}
              </button>
              {status === "success" && <p className="text-green-600 font-bold text-center">सन्देश सफलतापूर्वक पठाइयो!</p>}
              {status === "error" && <p className="text-red-600 font-bold text-center">सन्देश पठाउन असफल भयो।</p>}
            </form>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
