import { useState, useEffect, useRef } from "react";
import { Play, MessageSquare, Users, Share2, Heart, Send, Trash2, ExternalLink, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { doc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { motion, AnimatePresence } from "motion/react";

export default function LivePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [liveSettings, setLiveSettings] = useState({
    url: "",
    type: "youtube" as "youtube" | "facebook",
    title: "विशेष समाचार बुलेटिन",
    description: "पृथ्वी पथ मिडियाको विशेष प्रत्यक्ष प्रसारणमा तपाईंलाई स्वागत छ।",
    sponsoredAds: [] as string[]
  });

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isPopout, setIsPopout] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [viewers, setViewers] = useState("१.२ हजार");

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: liveSettings.title,
          text: liveSettings.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert("लिङ्क कपि गरियो!");
    }
  };

  // Simulated live viewers logic
  useEffect(() => {
    const interval = setInterval(() => {
      const base = 1200;
      const variation = Math.floor(Math.random() * 50) - 25;
      const count = base + variation;
      // Convert to Nepali numerals
      const nepaliCount = count.toLocaleString('ne-NP');
      setViewers(nepaliCount);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat logic
  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, showChat]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveSettings(prev => ({
          ...prev,
          url: data.liveVideoUrl || "",
          type: data.liveVideoType || "youtube",
          title: data.siteName + " - प्रत्यक्ष प्रसारण",
          description: data.siteDescription || prev.description,
          sponsoredAds: data.sponsoredAds || []
        }));
      }
    }, (error) => {
      console.error("Error in live settings snapshot:", error);
    });

    // Real-time Chat
    const chatQ = query(
      collection(db, "liveChat"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubChat = onSnapshot(chatQ, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(msgs.reverse());
    }, (error) => {
      console.error("Error in live chat snapshot:", error);
    });

    return () => {
      unsub();
      unsubChat();
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    
    try {
      await addDoc(collection(db, "liveChat"), {
        uid: user.uid,
        user: user.displayName || "Anonymous",
        text: message,
        createdAt: serverTimestamp(),
        isSponsored: false
      });
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) return;
    try {
      await deleteDoc(doc(db, "liveChat", id));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const getEmbedUrl = () => {
    if (!liveSettings.url) return null;

    if (liveSettings.type === "youtube") {
      let videoId = liveSettings.url;
      if (liveSettings.url.includes("v=")) {
        videoId = liveSettings.url.split("v=")[1].split("&")[0];
      } else if (liveSettings.url.includes("youtu.be/")) {
        videoId = liveSettings.url.split("youtu.be/")[1].split("?")[0];
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else {
      // Facebook embed
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(liveSettings.url)}&show_text=0&t=0`;
    }
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-primary/30">
      <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500">
        <Header />
      </div>
      
      <main className="flex-grow relative w-full">
        {isPopout && (
          <button 
            onClick={() => setIsPopout(false)}
            className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all"
          >
            <Users size={24} />
          </button>
        )}

        <div className="relative flex flex-col scroll-smooth">
          
          {/* Section 1: Immersive Video & Chat Sidebar (100dvh) */}
          <section className="relative h-[100dvh] w-full bg-black flex lg:flex-row flex-col overflow-hidden border-b border-white/5">
            
            {/* Main Video Section */}
            <div className="relative flex-grow h-full bg-black overflow-hidden group">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-none shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4">
                  <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center animate-pulse">
                    <Play size={40} />
                  </div>
                  <p className="font-bold text-slate-400">अहिले कुनै प्रत्यक्ष प्रसारण छैन।</p>
                </div>
              )}
              
              {/* Sponsored Ads Marquee */}
              {liveSettings.sponsoredAds.length > 0 && (
                <div className="absolute top-[100px] left-0 right-0 z-40 bg-primary/80 backdrop-blur-md py-1.5 overflow-hidden">
                  <div className="flex whitespace-nowrap animate-marquee">
                    {[...liveSettings.sponsoredAds, ...liveSettings.sponsoredAds].map((ad, i) => (
                      <span key={i} className="text-[10px] font-black text-white uppercase tracking-widest px-8 flex items-center gap-2">
                        <Shield size={10} /> {ad}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overlay Chat - visible on Mobile / Cinema Mode */}
              <AnimatePresence>
                {showChat && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="lg:hidden absolute bottom-24 left-4 z-20 w-[90%] max-h-[40%] flex flex-col gap-2 pointer-events-none"
                  >
                    <div 
                      ref={chatScrollRef}
                      className="flex flex-col gap-2 overflow-y-auto pr-4 scrollbar-hide pointer-events-auto"
                    >
                      {chatMessages.map((msg) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id} 
                          className={`bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col gap-0.5 relative group/msg ${msg.isSponsored ? "border-primary/50 bg-primary/10" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <Link 
                              to={`/profile/${msg.uid}`}
                              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              {msg.user} {msg.isSponsored && <Shield size={8} className="fill-primary" />}
                            </Link>
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 text-white/40 hover:text-red-500 transition-all pointer-events-auto"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs font-medium text-white leading-tight">{msg.text}</p>
                        </motion.div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Mobile Overlay Input */}
                    {user ? (
                      <form onSubmit={handleSendMessage} className="mt-2 pointer-events-auto">
                        <div className="relative">
                          <input 
                            type="text" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="कुराकानी गर्नुहोस्..." 
                            className="w-full bg-black/60 backdrop-blur-xl border border-white/20 rounded-full py-3 px-5 pr-12 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/40 shadow-lg"
                          />
                          <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 transition-transform"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <Link to="/login" className="mt-2 pointer-events-auto block w-full bg-black/60 backdrop-blur-xl border border-white/20 rounded-full py-3 px-5 text-center text-[10px] font-black text-white uppercase tracking-widest hover:bg-black/80 transition-all shadow-lg">
                        लगइन गर्नुहोस्
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Controls Overlay */}
              <div className="absolute top-28 left-6 right-6 flex items-center justify-between z-30 lg:hidden">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold">
                  <Users size={12} /> {viewers}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${showChat ? "bg-primary text-white" : "bg-black/50 text-white"}`}
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Bottom Scroll Hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-6 right-8 z-[100] flex flex-col items-center gap-2 text-white/40 group cursor-pointer lg:flex hidden"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] vertical-text">Scroll for more</span>
                <Play className="rotate-90 animate-bounce" size={14} />
              </motion.div>

              {/* Bottom Gradient for Chat Visibility */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent pointer-events-none z-10 lg:hidden" />
            </div>

            {/* Side-Docked Chat - DESKTOP ONLY */}
            <div className="hidden lg:flex w-[400px] flex-shrink-0 flex-col bg-slate-950 border-white/5 border-l pt-[100px] shadow-2xl relative z-40">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex flex-col">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" /> प्रत्यक्ष कुराकानी
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">समुदायसँग जोडिनुहोस्</p>
                </div>
                <div className="flex items-center gap-2 bg-red-600/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-500/20">
                  LIVE
                </div>
              </div>

              <div 
                ref={chatScrollRef}
                className="flex-grow overflow-y-auto px-6 py-6 flex flex-col gap-4 no-scrollbar scroll-smooth"
              >
                {chatMessages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id} 
                    className={`group/msg flex flex-col gap-1 ${msg.isSponsored ? "bg-primary/5 p-3 rounded-2xl border border-primary/20" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/profile/${msg.uid}`}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5"
                      >
                        {msg.user} {msg.isSponsored && <Shield size={8} className="fill-primary" />}
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'editor') && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover/msg:opacity-100 p-1 text-white/30 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-300 leading-relaxed">{msg.text}</p>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5 pb-10">
                {user ? (
                  <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text" 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="कोहि राम्रो कुरा भन्नुहोस्..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-14 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-slate-600"
                    />
                    <button 
                      type="submit"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 transition-transform"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                ) : (
                  <Link to="/login" className="block w-full bg-primary text-white rounded-2xl py-4 px-6 text-center text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                    कुराकानी गर्न लगइन गर्नुहोस्
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Metadata Section (Below Fold) */}
          <section className="bg-[#0a0a0b] py-20 px-4 md:px-16 md:py-24">
            <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-16">
              
              <div className="flex-grow flex flex-col gap-10">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="px-5 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">प्रत्यक्ष प्रसारण</div>
                    <div className="flex items-center gap-2 bg-white/5 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-bold">
                      <Users size={12} /> {viewers} जनाले हेर्दैछन्
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[1.1]">
                    {liveSettings.title}
                  </h1>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-10 border-y border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-primary/20">P</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl md:text-2xl font-black text-white">पृथ्वी पथ मिडिया</span>
                        <Shield className="text-primary fill-primary/10" size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">२.५ लाख सब्सक्राइबर्स</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {}} 
                      className="flex-grow md:flex-initial flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 shadow-xl"
                    >
                      <Heart size={20} /> मन पराउनुहोस्
                    </button>
                    <button 
                      onClick={handleShare}
                      className="flex-grow md:flex-initial flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl shadow-primary/30"
                    >
                      <Share2 size={20} /> सेयर गर्नुहोस्
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-4 text-primary">
                    <div className="h-0.5 w-12 bg-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.4em]">विवरण</span>
                  </div>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-4xl whitespace-pre-wrap">
                    {liveSettings.description}
                  </p>
                </div>
              </div>

              {/* Sidebar Ads / Related Content */}
              <div className="xl:w-[400px] flex flex-col gap-8">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] flex flex-col gap-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">प्रायोजित</h4>
                  <div className="space-y-4">
                    {liveSettings.sponsoredAds.map((ad, i) => (
                      <div key={i} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4 text-white hover:border-primary/30 transition-all group">
                         <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                           <Shield size={16} />
                         </div>
                         <span className="text-xs font-bold truncate">{ad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
