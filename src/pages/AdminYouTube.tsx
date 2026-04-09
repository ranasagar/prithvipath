import { useState, useEffect } from "react";
import { 
  Plus, Youtube, Trash2, ExternalLink, 
  Search, Filter, Clock, Eye, CheckCircle, 
  AlertCircle, X, ChevronRight, Video,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import AlertModal from "@/src/components/ui/AlertModal";
import type { YouTubeVideo } from "@/src/types";

export default function AdminYouTube() {
  const { user, loading: authLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVideo, setNewVideo] = useState({
    url: "",
    title: "",
    category: "trending" as YouTubeVideo['category'],
    isFeatured: false
  });
  const [alertInfo, setAlertInfo] = useState({ show: false, title: "", message: "", type: 'success' as 'success' | 'error' });

  const [channelUrl, setChannelUrl] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "youtube_videos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YouTubeVideo)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Fetch channel URL from settings
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        setChannelUrl(doc.data().youtubeChannelUrl || "");
      }
    });
    return () => unsub();
  }, []);

  const handleUpdateSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, "settings", "site"), {
        youtubeChannelUrl: channelUrl
      });
      setAlertInfo({ show: true, title: "सफलता!", message: "सेटिंग्स सुरक्षित गरियो।", type: 'success' });
    } catch (err) {
      console.error("Error updating settings:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "सेटिंग्स सुरक्षित गर्न सकिएन।", type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(newVideo.url);
    if (!ytId) {
      setAlertInfo({ show: true, title: "त्रुटि!", message: "कृपया सही YouTube URL राख्नुहोस्।", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "youtube_videos"), {
        youtubeId: ytId,
        title: newVideo.title,
        thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        category: newVideo.category,
        isFeatured: newVideo.isFeatured,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewVideo({ url: "", title: "", category: "trending", isFeatured: false });
      setIsAddModalOpen(false);
      setAlertInfo({ show: true, title: "सफलता!", message: "भिडियो सफलतापूर्वक थपियो।", type: 'success' });
    } catch (err) {
      console.error("Error adding video:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "भिडियो थप्न सकिएन।", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm("के तपाईं यो भिडियो हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "youtube_videos", id));
      setAlertInfo({ show: true, title: "सफलता!", message: "भिडियो हटाइयो।", type: 'success' });
    } catch (err) {
      console.error("Error deleting video:", err);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? "80px" : "280px" }}
        className="flex-grow p-8 transition-all duration-300 ease-in-out"
      >
        <AlertModal 
          isOpen={alertInfo.show}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        />

        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">यूट्यूब हब व्यवस्थापन</h1>
            <p className="text-sm font-medium text-slate-500">प्रिथ्वी पथ मिडियाका भिडियोहरू व्यवस्थापन गर्नुहोस्।</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus size={20} /> नयाँ भिडियो थप्नुहोस्
          </button>
        </header>

        {/* Channel Settings Section */}
        <section className="bg-white rounded-[2.5rem] p-8 mb-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-slate-900 uppercase">च्यानल सेटिङ्स</h3>
            <p className="text-xs font-bold text-slate-400">आफ्नो आधिकारिक यूट्यूब च्यानलको लिङ्क यहाँ राख्नुहोस्।</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <input 
              type="text" 
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://youtube.com/@PrithviPath"
              className="flex-grow md:w-80 bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
            <button 
              onClick={handleUpdateSettings}
              disabled={isSavingSettings}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
            >
              {isSavingSettings ? "बचत गर्दै..." : "बचत गर्नुहोस्"}
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group">
              <div className="relative aspect-video">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <a href={`https://youtube.com/watch?v=${video.youtubeId}`} target="_blank" className="p-3 bg-white text-primary rounded-full hover:scale-110 transition-transform">
                    <ExternalLink size={20} />
                  </a>
                  <button onClick={() => handleDeleteVideo(video.id)} className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform">
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="absolute top-4 left-4 bg-primary text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">
                  {video.category}
                </div>
              </div>
              <div className="p-6 flex flex-col gap-2">
                <h3 className="font-black text-slate-900 line-clamp-2">{video.title}</h3>
                <span className="text-[10px] font-bold text-slate-400">ID: {video.youtubeId}</span>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-slate-400">
              <Video size={48} />
              <p className="font-bold">अझै कुनै भिडियो थपिएको छैन।</p>
            </div>
          )}
        </div>

        {/* Add Video Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsAddModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xl font-black text-slate-900 uppercase">नयाँ भिडियो</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-primary transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleAddVideo} className="p-8 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YouTube URL</label>
                    <input 
                      type="text" 
                      required
                      value={newVideo.url}
                      onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">भिडियो शीर्षक</label>
                    <input 
                      type="text" 
                      required
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      placeholder="भिडियोको शीर्षक यहाँ लेख्नुहोस्..."
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">क्याटेगोरी</label>
                    <select 
                      value={newVideo.category}
                      onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value as any })}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                    >
                      <option value="trending">Trending</option>
                      <option value="nepal">Nepal Stories</option>
                      <option value="interview">Interviews</option>
                      <option value="breaking">Breaking News</option>
                      <option value="documentary">Documentaries</option>
                      <option value="shorts">Shorts/Reels</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={newVideo.isFeatured}
                      onChange={(e) => setNewVideo({ ...newVideo, isFeatured: e.target.checked })}
                      className="w-6 h-6 rounded-lg border-2 border-slate-200 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest group-hover:text-primary transition-colors">मुख्य भिडियो (Featured)</span>
                  </label>
                  <button 
                    disabled={isSubmitting}
                    className="bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "सुरक्षित गर्दै..." : "भिडियो सुरक्षित गर्नुहोस्"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
