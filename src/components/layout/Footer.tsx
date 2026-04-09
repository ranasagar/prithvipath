import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

export default function Footer() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    logoUrl: "/logo.png",
    siteName: "पृथ्वी पथ मिडिया",
    siteDescription: "हामी सत्य, तथ्य र निष्पक्ष समाचार सम्प्रेषणका लागि प्रतिबद्ध छौं। समाजका हरेक पक्षलाई समेट्दै हामी तपाईंलाई सुसूचित गराउने प्रयासमा छौं।",
    contactEmail: "info@prithvipath.com",
    contactPhone: "+९७७-१-४XXXXXX",
    address: "काठमाडौं, नेपाल",
    facebookUrl: "#",
    twitterUrl: "#",
    instagramUrl: "#",
    youtubeUrl: "#",
    footerText: "",
    copyrightText: "",
    developerText: ""
  });

  useEffect(() => {
    // Listen for global site settings
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        setSettings(prev => ({ ...prev, ...doc.data() }));
      }
    }, (error) => {
      console.error("Error in footer settings snapshot:", error);
    });
    return () => unsub();
  }, []);

  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & About */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-xl p-1 flex-shrink-0">
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain transition-transform group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true"; }}
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-primary tracking-tight leading-none">
                  {settings.siteName.split(" ")[0]} <span className="text-white">{settings.siteName.split(" ").slice(1).join(" ")}</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">
                  {settings.siteName} - सत्य, तथ्य र निष्पक्ष
                </p>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              {settings.siteDescription}
            </p>
            <div className="flex gap-4">
              <a href={settings.facebookUrl} target="_blank" className="bg-slate-800 p-2 rounded-full hover:bg-primary transition-colors"><Facebook size={18} /></a>
              <a href={settings.twitterUrl} target="_blank" className="bg-slate-800 p-2 rounded-full hover:bg-primary transition-colors"><Twitter size={18} /></a>
              <a href={settings.instagramUrl} target="_blank" className="bg-slate-800 p-2 rounded-full hover:bg-primary transition-colors"><Instagram size={18} /></a>
              <a href={settings.youtubeUrl} target="_blank" className="bg-slate-800 p-2 rounded-full hover:bg-primary transition-colors"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-l-4 border-primary pl-3">मुख्य विधा</h3>
            <ul className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-400">
              <li><Link to="/category/national" className="hover:text-white transition-colors">राष्ट्रिय</Link></li>
              <li><Link to="/category/politics" className="hover:text-white transition-colors">राजनीति</Link></li>
              <li><Link to="/category/economy" className="hover:text-white transition-colors">अर्थतन्त्र</Link></li>
              <li><Link to="/category/sports" className="hover:text-white transition-colors">खेलकुद</Link></li>
              <li><Link to="/category/entertainment" className="hover:text-white transition-colors">मनोरञ्जन</Link></li>
              <li><Link to="/category/lifestyle" className="hover:text-white transition-colors">जीवनशैली</Link></li>
              <li><Link to="/category/international" className="hover:text-white transition-colors">अन्तर्राष्ट्रिय</Link></li>
              <li><Link to="/category/video" className="hover:text-white transition-colors">भिडियो</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-l-4 border-primary pl-3">हाम्रो बारेमा</h3>
            <ul className="flex flex-col gap-4 text-sm font-medium text-slate-400">
              <li><Link to="/about" className="hover:text-white transition-colors">हाम्रो बारेमा</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">सम्पर्क</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">गोपनीयता नीति</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">नियम र सर्तहरू</Link></li>
              {user && (
                <li><Link to="/admin" className="text-primary font-bold hover:underline transition-colors">ड्यासबोर्ड</Link></li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-l-4 border-primary pl-3">सम्पर्क</h3>
            <ul className="flex flex-col gap-4 text-sm font-medium text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary flex-shrink-0 mt-1" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary flex-shrink-0" />
                <span>{settings.contactPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary flex-shrink-0" />
                <span>{settings.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <p>{settings.copyrightText || `© २०२६ ${settings.siteName}। ${settings.footerText || "सर्वाधिकार सुरक्षित।"}`}</p>
          <p>विकास: <span className="text-slate-400">{settings.developerText || "AI Studio Build"}</span></p>
        </div>
      </div>
    </footer>
  );
}
