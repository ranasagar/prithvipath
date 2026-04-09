import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Search, Filter, TrendingUp, Clock, X, Terminal, ChevronDown, User as UserIcon } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import NepaliInput from "@/src/components/ui/NepaliInput";
import PostCard from "@/src/components/chautari/PostCard";
import { createNotification } from "@/src/lib/notifications";
import type { ChautariPost, User } from "@/src/types";

export default function ChautariPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ChautariPost[]>([]);
  const [topContributors, setTopContributors] = useState<User[]>([]);
  const [activeMemberCount, setActiveMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ChautariPost | null>(null);
  const [sortOrder, setSortOrder] = useState<'new' | 'top'>('new');
  
  // New Post State
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const postsRef = collection(db, "chautari_posts");
    const q = query(
      postsRef, 
      orderBy(sortOrder === 'new' ? "createdAt" : "upvotes", "desc"), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ChautariPost));
      setPosts(fetchedPosts);
      setIsLoading(false);
    }, (error) => {
      console.error("Chautari listen error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [sortOrder]);

  useEffect(() => {
    // Listen for Active Members
    const unsubMembers = onSnapshot(collection(db, "users"), (snap) => {
      setActiveMemberCount(snap.size);
    });

    // Listen for Top Contributors
    const q = query(collection(db, "users"), orderBy("karma", "desc"), limit(5));
    const unsubTop = onSnapshot(q, (snap) => {
      setTopContributors(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    return () => {
      unsubMembers();
      unsubTop();
    };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingPost) {
        // Update existing post
        await updateDoc(doc(db, "chautari_posts", editingPost.id), {
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new post
        await addDoc(collection(db, "chautari_posts"), {
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          authorId: user.uid,
          authorName: user.displayName || "प्रयोगकर्ता",
          authorPhoto: user.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          upvotes: 0,
          downvotes: 0,
          commentCount: 0,
          isPinned: false,
          isFlagged: false
        });

        // Update User Karma (+10 for posting)
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          karma: (user.karma || 0) + 10
        });

        // Notify globally
        await createNotification({
          title: "नयाँ चौतारी बहस!",
          message: `${user.displayName} ले एउटा नयाँ बहस सुरु गर्नुभयो: '${newPostTitle.trim()}'`,
          type: "info",
          role: "all",
          link: "/chautari"
        });
      }

      setNewPostTitle("");
      setNewPostContent("");
      setEditingPost(null);
      setIsNewPostModalOpen(false);
    } catch (err) {
      console.error("Post error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInitiate = (post: ChautariPost) => {
    setEditingPost(post);
    setNewPostTitle(post.title);
    setNewPostContent(post.content);
    setIsNewPostModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      <main className="flex-grow pb-12">
        <div className="container-custom max-w-6xl">
          {/* Hero Section */}
          <section className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x"></div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <MessageSquare size={12} /> समुदाय
                </span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">पृथ्वी पथ चौतारी</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
                हाम्रो <span className="text-primary">चौतारी</span> मा<br />खुला बहस गरौं
              </h1>
              <p className="text-slate-500 font-medium max-w-md">
                यो एउटा साझा चौतारी हो जहाँ तपाईं आफ्नो विचार, समाचार र जिज्ञासाहरू समुदायसँग बाँड्न सक्नुहुन्छ।
              </p>
            </div>
            
            <div className="relative z-10 flex flex-col gap-4">
              <button 
                onClick={() => user ? setIsNewPostModalOpen(true) : navigate('/login')}
                className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-primary transition-all shadow-xl shadow-slate-200 hover:scale-105"
              >
                <Plus size={20} /> नयाँ बहस सुरु गरौं
              </button>
              <div className="flex items-center gap-4 justify-center md:justify-start px-2">
                <div className="flex -space-x-3">
                  {topContributors.slice(0, 4).map((c, i) => (
                    <div key={c.uid} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                      {c.photoURL ? (
                        <img src={c.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="bg-slate-200 w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">
                           {c.displayName?.[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[8px] font-black">
                    {activeMemberCount > 1000 ? `${Math.floor(activeMemberCount / 1000)}K+` : activeMemberCount}
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">{activeMemberCount} सक्रिय सदस्यहरू</span>
              </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Feed Section */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setSortOrder('new')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortOrder === 'new' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Clock size={16} /> पछिल्लो
                  </button>
                  <button 
                    onClick={() => setSortOrder('top')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortOrder === 'top' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <TrendingUp size={16} /> लोकप्रिय
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <NepaliInput 
                      placeholder="बहस खोज्नुहोस्..." 
                      value=""
                      onChange={() => {}}
                      className="bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none w-48 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Feed */}
              <div className="flex flex-col gap-6">
                {isLoading ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">लोड हुँदैछ...</p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onEdit={() => handleEditInitiate(post)}
                    />
                  ))
                ) : (
                  <div className="py-20 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center gap-6 text-center px-12">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Terminal size={40} />
                     </div>
                     <div className="flex flex-col gap-2">
                        <h4 className="text-xl font-black text-slate-900">अहिले सम्म कुनै बहस छैन</h4>
                        <p className="text-sm text-slate-500 font-medium">तपाईं नै पहिलो व्यक्ति बन्नुहोस् जसले यहाँ बहस सुरु गर्नुहुनेछ।</p>
                     </div>
                     <button 
                       onClick={() => setIsNewPostModalOpen(true)}
                       className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
                     >
                       सुरु गरौं
                     </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="lg:col-span-4 flex flex-col gap-8 sticky top-32">
              {/* Community Rules Card */}
              <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h4 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                  <Filter size={20} className="text-primary" /> चौतारीका नियमहरू
                </h4>
                <ul className="flex flex-col gap-6 relative z-10">
                  {[
                    "मर्यादित र सभ्य बहस गरौं",
                    "भ्रामक र गलत सूचना नबाँडौं",
                    "व्यक्तिगत गालीगलौज पूर्ण निषेध छ",
                    "विषय केन्द्रित छलफलमा जोड दिऔं"
                  ].map((rule, idx) => (
                    <li key={idx} className="flex gap-4 items-start group/rule">
                      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black group-hover/rule:bg-primary transition-colors shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-300 group-hover/rule:text-white transition-colors">
                        {rule}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top Contributors Placeholder */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                  <TrendingUp size={16} className="text-accent" /> शीर्ष योगदानकर्ता
                </h4>
                <div className="flex flex-col gap-6">
                  {topContributors.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between group/contributor">
                      <Link to={`/profile/${c.uid}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden transition-transform group-hover/contributor:scale-110">
                           {c.photoURL ? <img src={c.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover/contributor:text-primary transition-colors">{c.displayName}</span>
                      </Link>
                      <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full">{c.karma || 0}</span>
                    </div>
                  ))}
                  {topContributors.length === 0 && <p className="text-[10px] font-bold text-slate-400 text-center uppercase">कुनै योगदानकर्ता छैन</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Post Modal */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsNewPostModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingPost ? "बहस सम्पादन गर्नुहोस्" : "नयाँ बहस सुरु गर्नुहोस्"}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-primary decoration-2 underline-offset-4 mt-1">
                  {editingPost ? "आफ्नो पोष्ट सुधार गर्नुहोस्" : "तपाईंको विचार साझा गर्नुहोस्"}
                </p>
              </div>
              <button 
                onClick={() => {
                   setIsNewPostModalOpen(false);
                   setEditingPost(null);
                   setNewPostTitle("");
                   setNewPostContent("");
                }}
                className="w-12 h-12 rounded-[1.25rem] bg-white text-slate-400 hover:text-primary transition-all flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">शीर्षक (Title)</label>
                <NepaliInput 
                  value={newPostTitle}
                  onChange={(val) => setNewPostTitle(val)}
                  placeholder="तपाईंको बहसको शीर्षक यहाँ लेख्नुहोस्..."
                  required
                  className="w-full bg-slate-100/50 border-none rounded-2xl py-5 px-6 text-lg font-black text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">विवरण (Content)</label>
                <NepaliInput 
                  value={newPostContent}
                  onChange={(val) => setNewPostContent(val)}
                  placeholder="तपाईंको तर्क वा विचार विस्तृत रूपमा खुलाउनुहोस्..."
                  type="textarea"
                  rows={8}
                  required
                  className="w-full bg-slate-100/50 border-none rounded-3xl py-6 px-6 text-sm font-medium text-slate-700 leading-relaxed focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                   <Filter size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">समुदाय मार्गदर्शन पालना गर्नुहोस्</span>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? "प्रकाशित हुँदै..." : "प्रकाशित गर्नुहोस्"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}
