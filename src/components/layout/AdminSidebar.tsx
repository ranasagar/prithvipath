import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut, 
  ChevronLeft, ChevronRight, Menu, Tag, Megaphone, HelpCircle,
  Youtube
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [logoVerticalUrl, setLogoVerticalUrl] = useState("/logo-vertical.png");

  useEffect(() => {
    // Listen for global site settings (logo)
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.logoVerticalUrl) setLogoVerticalUrl(data.logoVerticalUrl);
      }
    }, (error) => {
      console.error("Error in sidebar settings snapshot:", error);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor';

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: "ड्यासबोर्ड", 
      path: isAdmin ? "/admin" : "/editor",
      show: isAdmin || isEditor
    },
    { 
      icon: FileText, 
      label: "समाचारहरू", 
      path: "/admin/articles",
      show: isAdmin || isEditor
    },
    { 
      icon: Tag, 
      label: "विधाहरू", 
      path: "/admin/categories",
      show: isAdmin
    },
    { 
      icon: Megaphone, 
      label: "विज्ञापनहरू", 
      path: "/admin/ads",
      show: isAdmin
    },
    { 
      icon: Users, 
      label: "प्रयोगकर्ताहरू", 
      path: "/admin/users",
      show: isAdmin
    },
    { 
      icon: Youtube, 
      label: "यूट्यूब हब", 
      path: "/admin/youtube",
      show: isAdmin || isEditor
    },
    { 
      icon: Settings, 
      label: "सेटिङहरू", 
      path: "/admin/settings",
      show: isAdmin
    },
    { 
      icon: HelpCircle, 
      label: "सेटअप गाइड", 
      path: "/admin/setup-guide",
      show: isAdmin
    },
  ].filter(item => item.show);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "280px" }}
      className="fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col z-50 shadow-2xl transition-all duration-300 ease-in-out"
    >
      {/* Sidebar Header */}
      <Link 
        to="/" 
        className="p-6 flex items-center justify-between border-b border-white/5 overflow-hidden hover:bg-white/5 transition-colors cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white rounded-xl p-1 flex-shrink-0">
                <img 
                  src={logoVerticalUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true"; }}
                />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-lg font-black text-primary tracking-tighter uppercase leading-none">Prithvi Path</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isCollapsed && (
          <div className="w-10 h-10 bg-white rounded-xl p-1 mx-auto">
            <img 
              src={logoVerticalUrl} 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true"; }}
            />
          </div>
        )}
      </Link>

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation Links */}
      <nav className="flex-grow py-8 px-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={22} className={isActive ? "text-white" : "group-hover:scale-110 transition-transform"} />
              {!isCollapsed && (
                <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60]">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all group overflow-hidden`}
        >
          <LogOut size={22} className="group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">लगआउट</span>}
        </button>
      </div>
    </motion.aside>
  );
}
