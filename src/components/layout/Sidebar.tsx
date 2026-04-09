import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, TrendingUp, ChevronRight, Mail, Facebook, Twitter, Youtube, Instagram } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";
import AdSlider from "../ads/AdSlider";

export default function Sidebar({ hideMostRead = false }: { hideMostRead?: boolean }) {
  const [mostRead, setMostRead] = useState<Article[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("views", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setMostRead(articles);
    });

    return () => unsubscribe();
  }, []);

  const socialMedia = [
    { name: "Facebook", icon: <Facebook size={18} />, color: "bg-[#1877F2]", count: "२.५ लाख", link: "#" },
    { name: "Twitter", icon: <Twitter size={18} />, color: "bg-[#1DA1F2]", count: "१.२ लाख", link: "#" },
    { name: "YouTube", icon: <Youtube size={18} />, color: "bg-[#FF0000]", count: "५.८ लाख", link: "#" },
    { name: "Instagram", icon: <Instagram size={18} />, color: "bg-[#E4405F]", count: "९५ हजार", link: "#" },
  ];

  return (
    <aside className="flex flex-col gap-12 sticky top-28 pt-4">
      {/* Most Read Section */}
      {!hideMostRead && (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 uppercase tracking-tight">
              धेरै पढिएको
            </h3>
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div className="flex flex-col gap-6">
            {mostRead.map((article, index) => (
              <Link key={article.id} to={`/article/${article.id}`} className="group flex items-start gap-4">
                <span className="text-4xl font-black text-slate-100 group-hover:text-primary transition-colors leading-none">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(article.createdAt)}</span>
                    <span className="flex items-center gap-1"><Eye size={12} /> {article.views}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Social Media Widgets */}
      <div className="flex flex-col gap-8">
        <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 uppercase tracking-tight">
          हामीसँग जोडिनुहोस्
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {socialMedia.map((social) => (
            <a 
              key={social.name} 
              href={social.link} 
              className={`${social.color} text-white p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-slate-200`}
            >
              {social.icon}
              <span className="text-xs font-black uppercase tracking-widest">{social.count}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 text-center">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
          <Mail size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-black text-white tracking-tight">न्यूजलेटर</h3>
          <p className="text-xs font-medium text-slate-400 leading-relaxed">
            ताजा समाचार र अपडेटहरू सिधै तपाईंको इमेलमा प्राप्त गर्नुहोस्।
          </p>
        </div>
        <form className="flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="तपाईंको इमेल..." 
            className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            सदस्य बन्नुहोस्
          </button>
        </form>
      </div>

      {/* Advertisement Placeholder */}
      <AdSlider />
    </aside>
  );
}
