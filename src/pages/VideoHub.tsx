import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Play, Plus, Info, ChevronRight, ChevronLeft,
  Volume2, VolumeX, Star, Clock, Eye,
  Share2, MessageCircle, X, Search, TrendingUp,
  Youtube,
  SearchIcon,
  Filter,
  LayoutDashboard,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, limit, where, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { useAuth } from "@/src/lib/auth";
import type { YouTubeVideo } from "@/src/types";

// --- Components ---

const MobileCategoryBar = ({ 
  activeTab, 
  scrollToSection, 
  heroRef, 
  trendingRef, 
  watchlistRef, 
  rows,
  user
}: any) => {
  const chipsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (chipsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = chipsRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (chipsRef.current) {
      const { scrollLeft, clientWidth } = chipsRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200;
      chipsRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="xl:hidden sticky top-[10px] left-0 right-0 z-[35] bg-[#0a0a0b] border-b border-white/5 shadow-2xl h-16 w-full overflow-hidden"
    >
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-50 bg-gradient-to-r from-[#0a0a0b] to-transparent text-white w-12 flex items-center justify-start pl-2"
        >
          <ChevronLeftIcon size={20} />
        </button>
      )}

      <div 
        ref={chipsRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-x-auto no-scrollbar scroll-smooth flex items-center px-4"
      >
        <div className="flex items-center gap-3 pr-8 whitespace-nowrap">
          <button
            onClick={() => scrollToSection(heroRef)}
            className={`flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'Home' ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(0,114,181,0.3)]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard size={14} /> गृहपृष्ठ
          </button>
          
          <button
            onClick={() => scrollToSection(trendingRef)}
            className={`flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'Trending' ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(0,114,181,0.3)]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
          >
            <TrendingUp size={14} /> ट्रेन्डिङ
          </button>

          {user && (
            <button
              onClick={() => scrollToSection(watchlistRef)}
              className={`flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'Watchlist' ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(0,114,181,0.3)]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
            >
              <Star size={14} /> वाचलिस्ट
            </button>
          )}

          <div className="h-4 w-px bg-white/10 flex-shrink-0 mx-1" />

          {Object.entries(rows).map(([title]) => (
            <button
              key={title}
              onClick={() => {
                const section = document.getElementById(`section-${title}`);
                if (section) {
                  // Account for header + sticky chips bar
                  const headerOffset = 200;
                  const elementPosition = section.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
              className="flex-shrink-0 flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
            >
              <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
              {title}
            </button>
          ))}
        </div>
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-50 bg-gradient-to-l from-[#0a0a0b] to-transparent text-white w-12 flex items-center justify-end pr-2"
        >
          <ChevronRightIcon size={20} />
        </button>
      )}
    </div>
  );
};

const VideoModal = ({ video, onClose }: { video: YouTubeVideo | null, onClose: () => void }) => {
  if (!video) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
        >
          <X size={24} />
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
          title={video.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </motion.div>
    </motion.div>
  );
};

// Row Component with Entry Animation
const VideoRow = ({ title, videos, onPlay, watchlist, onToggleWatchlist }: {
  title: string,
  videos: YouTubeVideo[],
  onPlay: (v: YouTubeVideo) => void,
  watchlist: string[],
  onToggleWatchlist: (id: string) => void
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [videos]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="flex flex-col gap-4 group/row relative"
    >
      <h3 className="text-xl font-black text-white px-4 md:px-16 uppercase tracking-widest flex items-center gap-2">
        <motion.div
          animate={{ height: [16, 24, 16] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-1 h-6 bg-primary rounded-full"
        />
        {title}
      </h3>

      <div className="relative group/row">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-8 z-40 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent text-white w-16 md:w-24 flex items-center justify-start pl-2 md:pl-8 opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 backdrop-blur-[1px]"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary hover:scale-110 active:scale-95 transition-all shadow-2xl">
              <ChevronLeftIcon size={24} className="md:w-8 md:h-8" />
            </div>
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-4 md:gap-6 overflow-x-auto px-4 md:px-16 pb-8 no-scrollbar scroll-smooth snap-x"
        >
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={() => onPlay(video)}
              isInWatchlist={watchlist.includes(video.id || "")}
              onToggleWatchlist={() => onToggleWatchlist(video.id || "")}
            />
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-8 z-40 bg-gradient-to-l from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent text-white w-16 md:w-24 flex items-center justify-end pr-2 md:pr-8 opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 backdrop-blur-[1px]"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary hover:scale-110 active:scale-95 transition-all shadow-2xl">
              <ChevronRightIcon size={24} className="md:w-8 md:h-8" />
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
};

const VideoCard = ({ video, onPlay, isInWatchlist, onToggleWatchlist }: {
  video: YouTubeVideo,
  onPlay: () => void,
  isInWatchlist: boolean,
  onToggleWatchlist: () => void
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(video.thumbnail);

  // Fallback for missing maxresdefault thumbnails
  const handleImageError = () => {
    if (imgSrc.includes('maxresdefault')) {
      setImgSrc(imgSrc.replace('maxresdefault', 'hqdefault'));
    }
  };

  return (
    <div
      className="relative flex-shrink-0 w-64 md:w-80 snap-start group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/5 group-hover:border-primary/30 transition-all duration-700">
        <motion.img
          src={imgSrc}
          alt={video.title}
          onError={handleImageError}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6 }}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-4"
            >
              <motion.button
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,114,181,0.5)] hover:scale-110 active:scale-95 transition-all"
              >
                <Play size={32} fill="currentColor" />
              </motion.button>

              <motion.button
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(); }}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all border border-white/10 ${isInWatchlist ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isInWatchlist ? <Star size={24} fill="currentColor" /> : <Plus size={24} />}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-[8px] font-black text-white px-2 py-0.5 rounded border border-white/10">
          HD
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1" onClick={onPlay}>
        <h4 className="text-sm font-black text-slate-100 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{video.title}</h4>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>{video.category}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Eye size={10} /> {video.views?.toLocaleString('ne-NP') || "0"}</span>
        </div>
      </div>
    </div>
  );
};

const ShortsRow = ({ videos }: { videos: YouTubeVideo[] }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [videos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col gap-8 py-16 bg-white/[0.02] border-y border-white/5 relative group/shorts"
    >
      {/* Decorative background pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <h3 className="text-2xl font-black text-white px-4 md:px-16 uppercase tracking-tight flex items-center gap-6">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-14 h-14 bg-gradient-to-tr from-red-600 to-primary rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(239,68,68,0.3)]"
        >
          <TrendingUp size={32} />
        </motion.div>
        <div>
          <p className="text-white">SHORTS & REELS</p>
          <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] mt-1">FAST CONTENT HUB</p>
        </div>
      </h3>

      <div className="relative group/shorts">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent text-white w-16 md:w-24 flex items-center justify-start pl-2 md:pl-8 opacity-100 md:opacity-0 md:group-hover/shorts:opacity-100 transition-all duration-300 backdrop-blur-[1px]"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary hover:scale-110 active:scale-95 transition-all shadow-2xl">
              <ChevronLeftIcon size={24} />
            </div>
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto px-4 md:px-16 no-scrollbar snap-x scroll-smooth"
        >
          {videos.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ y: -10 }}
              className="relative flex-shrink-0 w-48 md:w-72 aspect-[9/16] rounded-[3rem] overflow-hidden snap-start group border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900"
            >
              <img src={video.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 gap-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h4 className="text-lg font-black text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">{video.title}</h4>
                <div className="flex items-center gap-6 text-white/60">
                  <button className="flex flex-col items-center gap-2 hover:text-primary transition-colors">
                    <Star size={24} fill="currentColor" className="text-primary drop-shadow-[0_0_8px_rgba(0,114,181,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 hover:text-white transition-colors">
                    <Share2 size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent text-white w-16 md:w-24 flex items-center justify-end pr-2 md:pr-8 opacity-100 md:opacity-0 md:group-hover/shorts:opacity-100 transition-all duration-300 backdrop-blur-[1px]"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-primary hover:scale-110 active:scale-95 transition-all shadow-2xl">
              <ChevronRightIcon size={24} />
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- Main Page ---

export default function VideoHub() {
  const { user } = useAuth();
  const [featuredVideos, setFeaturedVideos] = useState<YouTubeVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [rows, setRows] = useState<{ [key: string]: YouTubeVideo[] }>({});
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [channelUrl, setChannelUrl] = useState("");
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Refs for navigation
  const heroRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      // Account for header (~110px) + sticky chips bar (~60px) + padding
      const headerOffset = window.innerWidth < 768 ? 200 : 180;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Hero Slider Auto-Play
  useEffect(() => {
    if (featuredVideos.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredVideos.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [featuredVideos]);

  useEffect(() => {
    // Listen for site settings (channel link)
    onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        setChannelUrl(doc.data().youtubeChannelUrl || "");
      }
    });

    const q = query(collection(db, "youtube_videos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YouTubeVideo));
      setAllVideos(videos);

      // Categorize
      const categorized: { [key: string]: YouTubeVideo[] } = {
        'Trending Now': videos.filter(v => v.category === 'trending' || v.category === 'breaking'),
        'Nepal Stories': videos.filter(v => v.category === 'nepal'),
        'Interviews': videos.filter(v => v.category === 'interview'),
        'Documentaries': videos.filter(v => v.category === 'documentary'),
        'Shorts': videos.filter(v => v.category === 'shorts')
      };

      setRows(categorized);
      const featured = videos.filter(v => v.isFeatured);
      setFeaturedVideos(featured.length > 0 ? featured : [videos[0]]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setWatchlist(doc.data().watchlist || []);
        }
      });
      return () => unsub();
    } else {
      setWatchlist([]);
    }
  }, [user]);

  const toggleWatchlist = async (videoId: string) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const isInWatchlist = watchlist.includes(videoId);
    const userRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userRef, {
        watchlist: isInWatchlist ? arrayRemove(videoId) : arrayUnion(videoId)
      });
    } catch (err) {
      console.error("Error toggling watchlist:", err);
    }
  };
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <Header />

      <main className="flex-grow pb-20 overflow-x-hidden">
        <div className="flex flex-col xl:flex-row w-full max-w-[100vw]">
          {/* Sidebar - Hidden on mobile */}
          <aside className="w-80 flex-shrink-0 hidden xl:flex flex-col sticky top-[100px] self-start px-8 pt-10 h-[calc(100vh-120px)] border-r border-white/5">
            <nav className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-6">
              <button
                onClick={() => scrollToSection(heroRef)}
                className={`flex items-center gap-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'Home' ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
              >
                <LayoutDashboard size={20} fill={activeTab === 'Home' ? "currentColor" : "none"} />
                गृहपृष्ठ
              </button>
              
              <button
                onClick={() => scrollToSection(trendingRef)}
                className={`flex items-center gap-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'Trending' ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
              >
                <TrendingUp size={20} />
                ट्रेन्डिङ
              </button>

              {user && (
                <button
                  onClick={() => scrollToSection(watchlistRef)}
                  className={`flex items-center gap-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'Watchlist' ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                >
                  <Star size={20} fill={activeTab === 'Watchlist' ? "currentColor" : "none"} />
                  वाचलिस्ट
                </button>
              )}

              <div className="h-px bg-white/5 my-2"></div>
              
              <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Categories</h5>
              
              {Object.entries(rows).map(([title]) => (
                <button
                  key={title}
                  onClick={() => {
                    const section = document.getElementById(`section-${title}`);
                    if (section) {
                      // Account for header + sticky chips bar
                      const headerOffset = 200;
                      const elementPosition = section.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-4 text-xs font-bold text-slate-400 hover:text-white transition-colors text-left uppercase tracking-tight"
                >
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  {title}
                </button>
              ))}
            </nav>

            <div className="flex flex-col gap-4 mt-auto py-8 border-t border-white/5">
              <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Social</h5>
              {channelUrl && (
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-105 transition-transform"
                >
                  <Youtube size={16} /> Subscribe
                </a>
              )}
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-grow xl:ml-0 flex flex-col pt-0 w-full">
            
            <MobileCategoryBar
              activeTab={activeTab}
              scrollToSection={scrollToSection}
              heroRef={heroRef}
              trendingRef={trendingRef}
              watchlistRef={watchlistRef}
              rows={rows}
              user={user}
            />

            <div className="flex flex-col gap-20">
              {/* Hero Slider Section - Add top margin for mobile to account for sticky chips */}
              {featuredVideos.length > 0 && (
                <section ref={heroRef} className="relative h-[70vh] md:h-[calc(100vh-88px)] w-full group overflow-hidden mt-0 md:mt-0 scroll-mt-[180px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={featuredVideos[currentHeroIndex].id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <img
                        src={featuredVideos[currentHeroIndex].thumbnail}
                        className="w-full h-full object-cover"
                        alt={featuredVideos[currentHeroIndex].title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />

                      <div className="absolute bottom-10 md:bottom-20 left-4 md:left-16 max-w-3xl flex flex-col gap-4 md:gap-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <span className="bg-primary/20 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-primary/20">
                            FEATURED CONTENT
                          </span>
                          <span className="text-white/40 font-bold text-sm">Prithvi Path Originals</span>
                        </motion.div>

                        <motion.h2
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-3xl md:text-5xl lg:text-8xl font-black text-white tracking-tighter leading-[0.95] md:leading-[0.85]"
                        >
                          {featuredVideos[currentHeroIndex].title}
                        </motion.h2>

                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-slate-400 font-medium text-base md:text-lg max-w-xl line-clamp-2"
                        >
                          {featuredVideos[currentHeroIndex].description || "Discover the untold stories of Nepal through the lens of Prithvi Path Media. A cinematic journey into reality."}
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 md:mt-4"
                        >
                          <button
                            onClick={() => setActiveVideo(featuredVideos[currentHeroIndex])}
                            className="bg-primary text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest flex items-center gap-2 md:gap-3 shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all min-w-[140px] md:min-w-[180px] justify-center"
                          >
                            <Play size={18} fill="currentColor" /> Watch Now
                          </button>
                          <button
                            onClick={() => toggleWatchlist(featuredVideos[currentHeroIndex].id || "")}
                            className={`px-6 md:px-10 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest border transition-all min-w-[140px] md:min-w-[180px] justify-center ${watchlist.includes(featuredVideos[currentHeroIndex].id || "") ? 'bg-primary text-white border-primary' : 'bg-white/10 backdrop-blur-md text-white border-white/5 hover:bg-white/20'}`}
                          >
                            {user ? (watchlist.includes(featuredVideos[currentHeroIndex].id || "") ? "Saved" : "Add to Watchlist") : "Login to Save"}
                          </button>
                        </motion.div>
                      </div>

                      {/* Slider Navigation Controls */}
                      {featuredVideos.length > 1 && (
                        <div className="absolute right-4 md:right-16 bottom-32 md:bottom-20 flex items-center gap-4 z-20">
                          {/* 18+ Label (Desktop Only) */}
                          <div className="hidden lg:flex items-center gap-4">
                            <span className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-black text-xs uppercase border border-white/5">
                              18+ Viewer Discretion
                            </span>
                            <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-all">
                              <Volume2 size={20} />
                            </button>
                          </div>

                          {/* Navigation Buttons */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); setCurrentHeroIndex((prev) => (prev - 1 + featuredVideos.length) % featuredVideos.length); }}
                              className="p-3 md:p-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl hover:bg-primary hover:border-primary hover:scale-110 active:scale-95 transition-all shadow-2xl"
                            >
                              <ChevronLeftIcon size={24} />
                            </button>
                            <div className="flex gap-2 mx-2">
                              {featuredVideos.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentHeroIndex(idx)}
                                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentHeroIndex ? 'w-8 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                                />
                              ))}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setCurrentHeroIndex((prev) => (prev + 1) % featuredVideos.length); }}
                              className="p-3 md:p-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl hover:bg-primary hover:border-primary hover:scale-110 active:scale-95 transition-all shadow-2xl"
                            >
                              <ChevronRightIcon size={24} />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Scroll Indicator */}
                  <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-primary/50 to-transparent hidden md:block"
                    initial={{ height: 0 }}
                    animate={{ height: 48 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </section>
              )}

              {/* Discover Hub (Search & Filters) */}
              <section ref={trendingRef} className="px-4 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8 py-10 bg-white/[0.02] mx-4 md:mx-16 rounded-[2rem] md:rounded-[3rem] border border-white/5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Discovery Hub</h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Curated by AI & Human Experts</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative group flex-grow md:flex-initial">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="Search Prithvi Path Media..."
                      className="bg-black/40 border border-white/5 rounded-3xl py-4 pl-16 pr-8 text-white text-sm font-bold w-full md:w-96 focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <button className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
                    <Filter size={24} />
                  </button>
                </div>
              </section>

              {/* Video Rows */}
              <div className="flex flex-col gap-24 pb-32">
                {activeTab === 'Watchlist' ? (
                  <div ref={watchlistRef}>
                    <VideoRow
                      title="My Watchlist"
                      videos={allVideos.filter(v => watchlist.includes(v.id || ""))}
                      onPlay={setActiveVideo}
                      watchlist={watchlist}
                      onToggleWatchlist={toggleWatchlist}
                    />
                  </div>
                ) : (
                  <>
                    <div ref={watchlistRef} id="section-My Watchlist" className={watchlist.length === 0 ? 'hidden' : ''}>
                      <VideoRow
                        title="My Watchlist"
                        videos={allVideos.filter(v => watchlist.includes(v.id || ""))}
                        onPlay={setActiveVideo}
                        watchlist={watchlist}
                        onToggleWatchlist={toggleWatchlist}
                      />
                    </div>
                    {Object.entries(rows).map(([title, videos]) => (
                      title === 'Shorts' ? (
                        videos.length > 0 && (
                          <div key={title} id="section-Shorts">
                            <ShortsRow videos={videos} />
                          </div>
                        )
                      ) : (
                        videos.length > 0 && (
                          <div key={title} id={`section-${title}`} ref={title === 'Trending Now' ? trendingRef : null}>
                            <VideoRow
                              title={title}
                              videos={videos}
                              onPlay={setActiveVideo}
                              watchlist={watchlist}
                              onToggleWatchlist={toggleWatchlist}
                            />
                          </div>
                        )
                      )
                    ))}
                  </>
                )}
              </div>

              <AnimatePresence>
                {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
