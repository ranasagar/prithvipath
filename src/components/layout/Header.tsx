import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, User, Clock, TrendingUp, Bell, CheckCircle, AlertCircle, Info, LogOut, LayoutDashboard, MessageCircle, Youtube as YoutubeIcon } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import type { Notification, Article } from "@/src/types";

import NepaliInput from "@/src/components/ui/NepaliInput";
import AdBanner from "@/src/components/ads/AdBanner";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState("");
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Real-time notifications listener
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = allNotifs.filter(n => {
        if (n.role === 'all') return true;
        if (user && n.role === user.role) return true;
        if (user && n.recipientId === user.uid) return true;
        return false;
      });
      setNotifications(filtered.slice(0, 20));
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unread = notifications.filter(n => !n.isRead);
      unread.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const [logoUrl, setLogoUrl] = useState("https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true");

  useEffect(() => {
    // Listen for global site settings (logo, corner radius)
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        
        // Apply dynamic corner radius
        const radius = data.cornerRadius ?? 24;
        document.documentElement.style.setProperty('--app-radius', `${radius}px`);
        
        const catRadius = data.categoryHeroRadius ?? 40;
        document.documentElement.style.setProperty('--app-category-hero-radius', `${catRadius}px`);

        const speed = data.tickerSpeed ?? 40;
        document.documentElement.style.setProperty('--ticker-speed', `${speed}s`);
      }
    }, (error) => {
      console.error("Error in header settings snapshot:", error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      const engDate = now.toLocaleDateString('en-US', options);
      const nepDate = now.toLocaleDateString('ne-NP', options);
      setCurrentDate(`${nepDate} | ${engDate}`);
    };
    updateDate();

    // Fetch trending news for ticker (based on algorithm)
    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("views", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      if (articles.length === 0) {
        // Fallback to featured if no breaking news
        const featuredQ = query(
          collection(db, "articles"),
          where("status", "==", "published"),
          where("isFeatured", "==", true),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        onSnapshot(featuredQ, (featuredSnapshot) => {
          setTrendingArticles(featuredSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
        }, (error) => {
          console.error("Error in featured articles snapshot:", error);
        });
      } else {
        // Algorithm: Score = views / (days_old + 1)^1.5
        const now = new Date().getTime();
        const scored = articles.map(article => {
          const created = article.createdAt?.toDate?.()?.getTime() || new Date(article.createdAt).getTime();
          const daysOld = Math.max(0, (now - created) / (1000 * 60 * 60 * 24));
          const score = (article.views || 0) / Math.pow(daysOld + 1, 1.5);
          return { ...article, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        setTrendingArticles(scored.slice(0, 10));
      }
    }, (error) => {
      console.error("Error in breaking news snapshot:", error);
    });

    return () => unsubscribe();
  }, []);

  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ 
        id: doc.id,
        name: doc.data().nameNepali, 
        slug: doc.data().slug 
      }));
      const uniqueCats = Array.from(new Map(cats.map(c => [c.slug, c])).values());
      if (uniqueCats.length > 0) {
        setCategories(uniqueCats);
      } else {
        // Fallback to defaults if none in DB
        setCategories([
          { id: "politics", name: "राजनीति", slug: "politics" },
          { id: "desh", name: "देश", slug: "desh" },
          { id: "pradesh", name: "प्रदेश", slug: "pradesh" },
          { id: "bishwo", name: "विश्व", slug: "bishwo" },
          { id: "sports", name: "खेलकुद", slug: "sports" },
          { id: "entertainment", name: "मनोरञ्जन", slug: "entertainment" },
          { id: "economy", name: "अर्थ", slug: "economy" },
          { id: "tech", name: "प्रविधि", slug: "tech" },
        ]);
      }
    }, (error) => {
      console.error("Error in categories snapshot:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-effect shadow-sm">
      {/* Top Bar: Date & Social */}
      <div className="bg-slate-900/5 border-b border-slate-100 py-2 hidden md:block">
        <div className="container-custom flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-primary" />
            {currentDate}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-primary">हाम्रो बारेमा</Link>
            <Link to="/contact" className="hover:text-primary">सम्पर्क</Link>
            {/* User profile controls moved to main header */}
          </div>
        </div>
      </div>

      {/* Main Header: Logo Left, Nav Center, Actions Right */}
      <div className="container-custom py-2 md:py-3 lg:py-4 flex flex-col gap-2 md:gap-3">
        {/* Header Ad Space */}
        <div className="w-full hidden md:block">
          <AdBanner position="header" className="h-16 md:h-20 lg:h-24" />
        </div>

        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0">
            <div className="w-9 h-9 md:w-12 md:h-12 lg:w-14 lg:h-14 flex-shrink-0">
              <img 
                src={logoUrl} 
                alt="Prithvi Path Logo" 
                className="w-full h-full object-contain transition-transform group-hover:scale-110"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true"; }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg md:text-xl lg:text-3xl font-black text-primary tracking-tighter uppercase leading-none truncate">
                Prithvi Path
              </span>
              <span className="text-[7px] md:text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] truncate">
                Media & News Portal
              </span>
            </div>
          </Link>

          {/* Combined Navigation Menu (Desktop) */}
          <nav className="hidden md:block lg:block ml-2">
            <ul className="flex items-center gap-2 md:gap-3 lg:gap-5">
              <li>
                <Link to="/" className="text-[11px] md:text-xs lg:text-xs font-black text-slate-900 hover:text-primary transition-colors uppercase truncate">गृहपृष्ठ</Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id} className="hidden lg:block">
                  <Link 
                    to={`/category/${cat.slug}`} 
                    className="text-xs font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-tight truncate max-w-[80px]"
                    title={cat.name}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li key="latest" className="hidden lg:block">
                <Link 
                  to="/latest" 
                  className="text-xs font-black text-slate-800 hover:text-primary transition-colors uppercase flex items-center gap-1 whitespace-nowrap"
                >
                  <Clock size={12} /> ताजा
                </Link>
              </li>
              <li key="videos" className="hidden lg:block">
                <Link 
                  to="/videos" 
                  className="text-xs font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-tight"
                >
                  भिडियो
                </Link>
              </li>
              <li className="hidden xl:block">
                <Link to="/chautari" className="text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase flex items-center gap-1 whitespace-nowrap">
                  <MessageCircle size={12} /> चौतारी
                </Link>
              </li>
              <li className="hidden xl:block">
                <Link to="/trending" className="text-xs font-black text-accent hover:text-accent/80 transition-colors uppercase flex items-center gap-1 whitespace-nowrap">
                  <TrendingUp size={12} /> ट्रेन्डिङ
                </Link>
              </li>
            </ul>
          </nav>

          {/* Spacer to push actions to the right */}
          <div className="flex-grow" />

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-slate-600 hover:text-primary transition-colors flex-shrink-0"
            >
              <Search size={18} />
            </button>
            
            {/* Notification Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-600 hover:text-primary transition-colors relative flex-shrink-0"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <Link to="/live" className="bg-primary text-white px-3 md:px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 md:gap-2 animate-pulse whitespace-nowrap flex-shrink-0">
              <span className="w-2 h-2 bg-white rounded-full flex-shrink-0"></span> 
              <span className="hidden md:inline">प्रत्यक्ष</span>
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative group/profile flex-shrink-0">
                <Link to={`/profile/${user.uid}`} className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 overflow-hidden border-2 border-transparent group-hover/profile:border-primary transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-slate-500" />
                  )}
                </Link>
                <div className="absolute right-0 top-full pt-2 invisible opacity-0 translate-y-2 group-hover/profile:visible group-hover/profile:opacity-100 group-hover/profile:translate-y-0 transition-all duration-300 flex flex-col min-w-[200px] z-50">
                  <div className="flex flex-col bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-black text-slate-900 truncate">{user.displayName || 'प्रयोगकर्ता'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link to={`/profile/${user.uid}`} className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                      <User size={14} /> मेरो प्रोफाइल
                    </Link>
                    {(user.role === 'admin' || user.role === 'editor') && (
                      <Link to={user.role === 'admin' ? "/admin" : "/editor"} className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-t border-slate-50">
                        <LayoutDashboard size={14} /> ड्यासबोर्ड
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-primary flex-shrink-0 md:border-l md:border-slate-200 md:pl-3 uppercase tracking-widest">
                <span className="hidden md:inline">लगइन</span>
                <span className="md:hidden">लग</span>
              </Link>
            )}
          </div>

          {/* Shared Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="fixed md:absolute top-[72px] md:top-full left-4 right-4 md:left-auto md:right-0 mt-2 md:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">सूचनाहरू</h4>
                <button onClick={markAllAsRead} className="text-[10px] font-black text-primary uppercase hover:underline">सबै पढिएको मार्क गर्नुहोस्</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const handleNotificationClick = async () => {
                      if (!n.isRead) {
                        try {
                          await updateDoc(doc(db, "notifications", n.id), { isRead: true });
                        } catch (err) {
                          console.error("Error marking notification as read:", err);
                        }
                      }
                      setIsNotificationsOpen(false);
                    };

                    const NotificationContent = (
                      <div className={`p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          n.type === 'success' ? 'bg-green-100 text-green-600' : 
                          n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                          n.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'success' ? <CheckCircle size={14} /> : 
                           n.type === 'error' ? <AlertCircle size={14} /> : <Info size={14} />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-black text-slate-900">{n.title}</p>
                          <p className="text-[11px] font-medium text-slate-600 leading-tight">{n.message}</p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                            {new Date(n.createdAt).toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );

                    const getNotificationLink = () => {
                      if (n.link) return n.link;
                      if (n.articleId) return `/article/${n.articleId}`;
                      return null;
                    };

                    const notificationLink = getNotificationLink();

                    return notificationLink ? (
                      <Link 
                        key={n.id} 
                        to={notificationLink} 
                        onClick={handleNotificationClick}
                      >
                        {NotificationContent}
                      </Link>
                    ) : (
                      <div key={n.id} onClick={handleNotificationClick} className="cursor-pointer">{NotificationContent}</div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">कुनै सूचना छैन</div>
                )}
              </div>
              <Link to="/admin" className="block p-4 text-center text-[10px] font-black text-slate-500 uppercase hover:text-primary transition-colors bg-slate-50/50 border-t border-slate-100">सबै हेर्नुहोस्</Link>
            </div>
          )}

          <div className="flex md:hidden items-center gap-1">
            {/* Notification Bell for Mobile */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-600 hover:text-primary transition-colors relative flex-shrink-0"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button 
              className="p-2 text-slate-600 flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-slate-600 flex-shrink-0"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Navigation Bar (Secondary for smaller desktops) - REMOVED AS PER REQUEST */}

      {/* Trending Ticker */}
      <div className="bg-slate-900 py-2 overflow-hidden">
        <div className="container-custom flex items-center gap-4">
          <Link to="/latest" className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-accent px-3 py-1 rounded-sm hover:bg-accent/80 transition-colors">
            <TrendingUp size={12} /> ताजा अपडेट
          </Link>
          <div 
            className="flex-grow overflow-hidden relative h-5"
            onMouseEnter={() => setIsMarqueePaused(true)}
            onMouseLeave={() => setIsMarqueePaused(false)}
          >
            <div className={`absolute whitespace-nowrap flex gap-12 ${isMarqueePaused ? '' : 'animate-marquee'}`}>
              {trendingArticles.map((article) => (
                <Link 
                  key={article.id} 
                  to={`/article/${article.id}`}
                  className="text-white text-xs font-medium hover:text-primary cursor-pointer transition-colors"
                >
                  {article.title}
                </Link>
              ))}
              {/* Duplicate for seamless loop if enough articles */}
              {trendingArticles.length > 0 && trendingArticles.map((article) => (
                <Link 
                  key={`dup-${article.id}`} 
                  to={`/article/${article.id}`}
                  className="text-white text-xs font-medium hover:text-primary cursor-pointer transition-colors"
                >
                  {article.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300 max-h-[80vh] overflow-y-auto">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/category/${cat.slug}`}
              className="text-lg font-bold text-slate-900 py-2 border-b border-slate-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <Link 
            to="/latest"
            className="text-lg font-bold text-slate-900 py-2 border-b border-slate-50 flex items-center gap-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <Clock size={20} className="text-primary" /> ताजा समाचार
          </Link>
          <Link 
            to="/videos"
            className="text-lg font-bold text-slate-900 py-2 border-b border-slate-50 flex items-center gap-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <YoutubeIcon size={20} className="text-red-600" /> भिडियो
          </Link>
          <Link 
            to="/chautari"
            className="text-lg font-bold text-primary py-2 border-b border-slate-50 flex items-center gap-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <MessageCircle size={20} /> चौतारी
          </Link>
          <Link 
            to="/trending"
            className="text-lg font-bold text-accent py-2 border-b border-slate-50 flex items-center gap-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <TrendingUp size={20} /> ट्रेन्डिङ
          </Link>
          <div className="flex flex-col gap-4 pt-4">
            {user ? (
              <Link to="/admin" className="text-center py-3 rounded-xl bg-primary text-white font-bold" onClick={() => setIsMenuOpen(false)}>ड्यासबोर्ड</Link>
            ) : (
              <Link to="/login" className="text-center py-3 rounded-xl bg-slate-100 font-bold text-slate-900" onClick={() => setIsMenuOpen(false)}>लगइन</Link>
            )}
            <Link to="/live" className="text-center py-3 rounded-xl bg-slate-900 text-white font-bold" onClick={() => setIsMenuOpen(false)}>प्रत्यक्ष प्रसारण</Link>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-8 animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="container-custom max-w-3xl">
            <form onSubmit={handleSearch} className="relative">
              <NepaliInput 
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                placeholder="समाचार खोज्नुहोस्..." 
                className="w-full text-2xl font-bold border-b-4 border-slate-100 focus:border-primary outline-none py-4 pr-12 transition-all"
              />
              <button 
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary"
              >
                <X size={32} />
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </header>
  );
}
