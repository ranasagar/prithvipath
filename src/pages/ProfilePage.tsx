import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { doc, onSnapshot, updateDoc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, storage } from "@/src/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createNotification } from "@/src/lib/notifications";
import { useAuth } from "@/src/lib/auth";
import { motion } from "motion/react";
import { User, Mail, MapPin, Calendar, Edit2, Save, X, Camera, Globe, Twitter, Facebook, Instagram, FileText, Clock, Eye, MessageCircle, Share2, ChevronRight } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

export default function ProfilePage() {
  const { uid } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "articles" | "chautari">("about");
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [userChautariPosts, setUserChautariPosts] = useState<any[]>([]);
  const [userChautariComments, setUserChautariComments] = useState<any[]>([]);
  const [editData, setEditData] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
    facebook: "",
    twitter: "",
    instagram: ""
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file || !uid || !isOwnProfile) return;

    try {
      if (type === 'photo') setUploadingPhoto(true);
      else setUploadingBanner(true);

      const storageRef = ref(storage, `users/${uid}/${type}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const updateData = type === 'photo' ? { photoURL: url } : { bannerUrl: url };
      await updateDoc(doc(db, "users", uid), updateData);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert('अपलोड गर्दा त्रुटि भयो। (Storage Rules चेक गर्नुहोस्)');
    } finally {
      if (type === 'photo') setUploadingPhoto(false);
      else setUploadingBanner(false);
      
      if (event.target) event.target.value = '';
    }
  };

  const isOwnProfile = currentUser?.uid === uid;

  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "users", uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setEditData({
          displayName: data.displayName || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          facebook: data.facebook || "",
          twitter: data.twitter || "",
          instagram: data.instagram || ""
        });
      } else {
        console.error("User not found");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error in profile snapshot:", error);
      setLoading(false);
    });

    // Fetch user's articles
    const fetchArticles = async () => {
      try {
        const q = query(
          collection(db, "articles"),
          where("authorId", "==", uid)
        );
        const snapshot = await getDocs(q);
        const articles = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Article))
          .filter(article => article.status === "published" || isOwnProfile)
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });
        setUserArticles(articles);
      } catch (error) {
        console.error("Error fetching user articles:", error);
      }
    };

    fetchArticles();

    // Fetch user's Chautari activity
    const fetchChautariActivity = async () => {
      try {
        const postsQ = query(
          collection(db, "chautari_posts"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc")
        );
        const postsSnap = await getDocs(postsQ);
        setUserChautariPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const commentsQ = query(
          collection(db, "chautari_comments"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc")
        );
        const commentsSnap = await getDocs(commentsQ);
        setUserChautariComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching chautari activity:", error);
      }
    };
    fetchChautariActivity();

    return () => unsub();
  }, [uid]);

  const handleSave = async () => {
    if (!uid || !isOwnProfile) return;
    try {
      await updateDoc(doc(db, "users", uid), editData);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handleRequestEditor = async () => {
    if (!uid || !isOwnProfile) return;
    if (profile.role === 'editor' || profile.role === 'admin') return;
    
    try {
      await updateDoc(doc(db, "users", uid), {
        roleRequest: {
          requestedRole: 'editor',
          status: 'pending',
          requestedAt: new Date().toISOString(),
          message: "सम्पादक बन्नको लागि अनुरोध।"
        }
      });
      
      await createNotification({
        title: "नयाँ सम्पादक अनुरोध",
        message: `${profile.displayName || 'प्रयोगकर्ता'} ले सम्पादक बन्न अनुरोध गरेका छन्।`,
        type: "info",
        role: "admin",
        link: "/admin/users"
      });
      
      alert("सम्पादक बन्नको लागि अनुरोध पठाइयो। प्रशासकले यसलाई समीक्षा गर्नेछन्।");
    } catch (err) {
      console.error("Error requesting editor role:", err);
      alert("अनुरोध पठाउन सकिएन।");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;
  if (!profile) return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 className="text-2xl font-bold">प्रयोगकर्ता फेला परेन</h1>
    <button onClick={() => navigate("/")} className="text-primary font-bold">गृहपृष्ठमा जानुहोस्</button>
  </div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="py-12 md:py-20 container-custom">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* Profile Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100"
          >
            <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-slate-100 relative bg-cover bg-center" style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : {}}>
              {isOwnProfile && (
                <>
                  <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="absolute bottom-4 right-6 bg-white/80 backdrop-blur-md p-3 rounded-2xl text-slate-700 hover:bg-white transition-all shadow-sm">
                    {uploadingBanner ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary border-t-transparent inline-block" /> : <Camera size={20} />}
                  </button>
                  <input type="file" ref={bannerInputRef} onChange={(e) => handleFileUpload(e, 'banner')} accept="image/*" className="hidden" />
                </>
              )}
            </div>
            
            <div className="px-10 pb-10 flex flex-col md:flex-row items-end gap-8 -mt-16">
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] p-2 shadow-xl border border-slate-100">
                  <div className="w-full h-full bg-slate-100 rounded-[2rem] flex items-center justify-center text-primary overflow-hidden">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} />
                    )}
                  </div>
                </div>
                {isOwnProfile && (
                  <>
                    <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="absolute bottom-2 right-2 bg-primary text-white p-2.5 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                      {uploadingPhoto ? <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white border-t-transparent inline-block" /> : <Camera size={16} />}
                    </button>
                    <input type="file" ref={photoInputRef} onChange={(e) => handleFileUpload(e, 'photo')} accept="image/*" className="hidden" />
                  </>
                )}
              </div>

              <div className="flex-grow flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {profile.displayName || "Anonymous User"}
                  </h1>
                  {profile.role === 'admin' && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Admin</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" /> {profile.email}
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" /> {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" /> सदस्य: {new Date(profile.createdAt?.seconds * 1000).toLocaleDateString('ne-NP')}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-3 items-end">
                {isOwnProfile && !isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <Edit2 size={18} /> प्रोफाइल सम्पादन
                  </button>
                )}
                {isOwnProfile && profile.role === 'user' && !profile.roleRequest && (
                  <button 
                    onClick={handleRequestEditor}
                    className="bg-primary/10 hover:bg-primary/20 text-primary px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                  >
                    सम्पादक बन्न अनुरोध गर्नुहोस्
                  </button>
                )}
                {isOwnProfile && profile.roleRequest?.status === 'pending' && (
                  <span className="bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-amber-100">
                    सम्पादक अनुरोध विचाराधीन छ
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Info & Socials */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">सामाजिक सञ्जाल</h3>
                <div className="flex flex-col gap-4">
                  {profile.website && (
                    <a href={profile.website} target="_blank" className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors font-bold">
                      <Globe size={20} className="text-slate-400" /> वेबसाइट
                    </a>
                  )}
                  {profile.facebook && (
                    <a href={profile.facebook} target="_blank" className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors font-bold">
                      <Facebook size={20} className="text-slate-400" /> Facebook
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors font-bold">
                      <Twitter size={20} className="text-slate-400" /> Twitter
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" className="flex items-center gap-3 text-slate-600 hover:text-primary transition-colors font-bold">
                      <Instagram size={20} className="text-slate-400" /> Instagram
                    </a>
                  )}
                  {!profile.website && !profile.facebook && !profile.twitter && !profile.instagram && (
                    <p className="text-sm font-medium text-slate-400">कुनै सामाजिक सञ्जाल जोडिएको छैन।</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column: Content Area */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 flex flex-col gap-8"
            >
              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 pb-4">
                <button 
                  onClick={() => setActiveTab("about")}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "about" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  हाम्रो बारेमा
                </button>
                <button 
                  onClick={() => setActiveTab("articles")}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "articles" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  <FileText size={16} /> लेखहरू ({userArticles.length})
                </button>
                <button 
                  onClick={() => setActiveTab("chautari")}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "chautari" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  <MessageCircle size={16} /> चौतारी ({userChautariPosts.length + userChautariComments.length})
                </button>
              </div>

              {activeTab === "about" ? (
                isEditing ? (
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">प्रोफाइल सम्पादन</h3>
                      <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">नाम</label>
                        <NepaliInput 
                          value={editData.displayName}
                          onChange={(val) => setEditData({ ...editData, displayName: val })}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ठेगाना</label>
                        <NepaliInput 
                          value={editData.location}
                          onChange={(val) => setEditData({ ...editData, location: val })}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">बायो (Bio)</label>
                      <NepaliInput 
                        value={editData.bio}
                        onChange={(val) => setEditData({ ...editData, bio: val })}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        rows={4}
                        type="textarea"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">वेबसाइट</label>
                        <input 
                          type="text" 
                          value={editData.website}
                          onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Facebook URL</label>
                        <input 
                          type="text" 
                          value={editData.facebook}
                          onChange={(e) => setEditData({ ...editData, facebook: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSave}
                      className="bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> परिवर्तनहरू सुरक्षित गर्नुहोस्
                    </button>
                  </div>
                ) : (
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">बायो (Bio)</h3>
                    <p className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-wrap">
                      {profile.bio || "यो प्रयोगकर्ताले अझै आफ्नो बायो लेखेको छैन।"}
                    </p>
                  </div>
                )
              ) : activeTab === "articles" ? (
                <div className="flex flex-col gap-6">
                  {userArticles.length > 0 ? (
                    userArticles.map((article) => (
                      <Link 
                        key={article.id} 
                        to={`/article/${article.id}`}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 group hover:shadow-md transition-all"
                      >
                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                          <img 
                            src={article.featuredImage} 
                            alt={article.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-center gap-3">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full">
                            {article.categoryId}
                          </span>
                          <h4 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            <span className="flex items-center gap-1"><Clock size={14} /> {formatDate(article.createdAt)}</span>
                            <span className="flex items-center gap-1"><Eye size={14} /> {article.views}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">कुनै लेख फेला परेन।</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* Chautari Posts */}
                  {userChautariPosts.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">बहसहरू (Posts)</h4>
                      {userChautariPosts.map(post => (
                        <Link 
                          key={post.id} 
                          to={`/chautari/post/${post.id}`}
                          className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                               <MessageCircle size={24} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <h5 className="font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{post.title}</h5>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Chautari Comments */}
                  {userChautariComments.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">प्रतिक्रियाहरू (Replies)</h4>
                      {userChautariComments.map(comment => (
                        <Link 
                          key={comment.id} 
                          to={`/chautari/post/${comment.postId}`}
                          className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full flex items-center gap-1">
                              <Share2 size={12} /> जवाफ दिइएको
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 font-medium italic">"{comment.content}"</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {userChautariPosts.length === 0 && userChautariComments.length === 0 && (
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <MessageCircle size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">कुनै चौतारी गतिविधि फेला परेन।</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
