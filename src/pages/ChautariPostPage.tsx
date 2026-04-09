import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Share2, User as UserIcon, Send, Flag, Pin, Trash2, MoreVertical, Terminal } from "lucide-react";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, deleteDoc, limit, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import NepaliInput from "@/src/components/ui/NepaliInput";
import VoteButtons from "@/src/components/chautari/VoteButtons";
import { createNotification } from "@/src/lib/notifications";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ChautariPost, ChautariComment } from "@/src/types";

interface CommentWithReplies extends ChautariComment {
  replies: CommentWithReplies[];
}

const buildCommentTree = (flatComments: ChautariComment[]) => {
  const commentMap: { [key: string]: CommentWithReplies } = {};
  const tree: CommentWithReplies[] = [];

  flatComments.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  flatComments.forEach(comment => {
    if (comment.parentId && commentMap[comment.parentId]) {
      commentMap[comment.parentId].replies.push(commentMap[comment.id]);
    } else {
      tree.push(commentMap[comment.id]);
    }
  });

  return tree;
};

const CommentItem = ({ 
  comment, 
  onReply 
}: { 
  comment: CommentWithReplies; 
  onReply: (comment: ChautariComment) => void;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex gap-4 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
        <Link to={`/profile/${comment.authorId}`} className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
          {comment.authorPhoto ? <img src={comment.authorPhoto} alt="" className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300" />}
        </Link>
        <div className="flex flex-col gap-2 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${comment.authorId}`} className="text-xs font-black text-slate-900 hover:text-primary transition-colors">{comment.authorName}</Link>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <button 
              onClick={() => onReply(comment)}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              जवाफ दिनुहोस्
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {comment.replyToName && (
              <span className="text-[10px] font-bold text-primary bg-primary/5 w-fit px-2 py-0.5 rounded-full mb-1 flex items-center gap-1">
                <MessageCircle size={10} /> @{comment.replyToName} लाई जवाफ
              </span>
            )}
            <p className="text-sm text-slate-600 leading-relaxed">
              {comment.content}
            </p>
          </div>
        </div>
      </div>
      
      {comment.replies.length > 0 && (
        <div className="pl-4 md:pl-8 border-l-2 border-slate-100 flex flex-col gap-6 ml-5">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ChautariPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<ChautariPost | null>(null);
  const [comments, setComments] = useState<ChautariComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChautariComment | null>(null);
  const [mentionSearch, setMentionSearch] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Listen to Post
    const unsubPost = onSnapshot(doc(db, "chautari_posts", id), (doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() } as ChautariPost);
      } else {
        navigate("/chautari");
      }
      setIsLoading(false);
    });

    // Listen to Comments
    const q = query(
      collection(db, "chautari_comments"),
      where("postId", "==", id)
    );
    const unsubComments = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChautariComment));
      // Sort client-side to bypass initial index requirement
      docs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      setComments(docs);
    });

    // Fetch users for mentions (Limit to active users or first 50)
    const fetchUsers = async () => {
      const usersQ = query(collection(db, "users"), limit(50));
      const snapshot = await getDocs(usersQ);
      setSuggestedUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    };
    fetchUsers();

    return () => {
      unsubPost();
      unsubComments();
    };
  }, [id, navigate]);

  const handleMentionClick = (displayName: string) => {
    const parts = newComment.split("@");
    parts.pop(); // Remove the search term
    setNewComment(parts.join("@") + "@" + displayName + " ");
    setShowMentions(false);
  };

  useEffect(() => {
    const lastWord = newComment.split(" ").pop();
    if (lastWord?.startsWith("@") && lastWord.length > 1) {
      setMentionSearch(lastWord.substring(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [newComment]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim() || !post) return;

    setIsSubmitting(true);
    try {
      // Add Comment
      await addDoc(collection(db, "chautari_comments"), {
        postId: id,
        parentId: replyingTo?.id || null,
        replyToName: replyingTo?.authorName || null,
        authorId: user.uid,
        authorName: user.displayName || "प्रयोगकर्ता",
        authorPhoto: user.photoURL || "",
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // Update Post count
      await updateDoc(doc(db, "chautari_posts", id), {
        commentCount: increment(1)
      });

      // Notify Post/Comment Author
      const recipientId = replyingTo ? replyingTo.authorId : post.authorId;
      if (recipientId !== user.uid) {
        await createNotification({
          title: replyingTo ? "नयाँ जवाफ!" : "नयाँ प्रतिक्रिया!",
          message: replyingTo 
            ? `${user.displayName} ले तपाईंको प्रतिक्रियाको जवाफ दिनुभयो।`
            : `${user.displayName} ले तपाईंको बहस '${post.title}' मा प्रतिक्रिया दिनुभयो।`,
          type: "info",
          recipientId: recipientId,
          link: `/chautari/post/${id}`
        });
      }

      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm("के तपाईं यो पोष्ट हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "chautari_posts", post.id));
      navigate("/chautari");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareData = {
      title: post.title,
      text: post.content.substring(0, 100) + "...",
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Clipboard error:", err);
      }
    }
  };

  const handleReport = async () => {
    if (!post || !user) {
      alert("लगइन गर्नुहोस्।");
      return;
    }
    if (!window.confirm("यो पोष्ट रिपोर्ट गर्न निश्चित हुनुहुन्छ?")) return;
    
    try {
      await addDoc(collection(db, "chautari_reports"), {
        postId: post.id,
        reporterId: user.uid,
        reason: "Reported by user from detail page",
        createdAt: serverTimestamp()
      });
      alert("रिपोर्ट गरिएको छ। धन्यवाद!");
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">बहस भेटिएन।</div>;

  const isAuthor = user?.uid === post.authorId;
  const canModerate = user?.role === 'admin' || user?.role === 'editor';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      <main className="flex-grow pb-12">
        <div className="container-custom max-w-4xl">
          <Link to="/chautari" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> चौतारीमा फर्कनुहोस्
          </Link>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden mb-12">
            {/* Post Header */}
            <div className="p-8 md:p-12 border-b border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Link to={`/profile/${post.authorId}`} className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-4 border-slate-50 shadow-sm">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-full h-full p-2 text-slate-400" />
                    )}
                  </Link>
                  <div className="flex flex-col">
                    <Link to={`/profile/${post.authorId}`} className="text-sm font-black text-slate-900 transition-colors hover:text-primary">
                      {post.authorName}
                    </Link>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <VoteButtons 
                     postId={post.id} 
                     authorId={post.authorId}
                     postTitle={post.title}
                     initialUpvotes={post.upvotes} 
                     initialDownvotes={post.downvotes} 
                   />
                   {(isAuthor || canModerate) && (
                     <div className="relative">
                        <button onClick={() => setShowOptions(!showOptions)} className="p-3 text-slate-400 hover:text-primary transition-colors rounded-2xl hover:bg-slate-50">
                          <MoreVertical size={20} />
                        </button>
                        {showOptions && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                             {(isAuthor || canModerate) && (
                               <>
                                 {isAuthor && (
                                   <button 
                                     onClick={() => {
                                       // Toggle a simple edit state or navigate
                                       alert("सम्पादन सुविधा मुख्य चौतारी पृष्ठमा उपलब्ध छ।");
                                       setShowOptions(false);
                                     }} 
                                     className="w-full flex items-center gap-2 px-6 py-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                                   >
                                      सम्पादन गर्नुहोस्
                                   </button>
                                 )}
                                 <button onClick={handleDeletePost} className="w-full flex items-center gap-2 px-6 py-4 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                                   <Trash2 size={14} /> हटाउनुहोस्
                                 </button>
                               </>
                             )}
                          </div>
                        )}
                     </div>
                   )}
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-8">
                {post.title}
              </h1>
              
              <div className="prose-chautari max-w-none text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>

            {/* Post Actions Bar */}
            <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                   <MessageCircle size={18} /> {post.commentCount} प्रतिक्रियाहरू
                </div>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
                >
                   <Share2 size={18} /> शेयर गर्नुहोस्
                </button>
              </div>
              <button 
                onClick={handleReport}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                 <Flag size={18} /> रिपोर्ट
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-2">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">बहसमा सामेल हुनुहोस्</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-primary underline-offset-4 decoration-2">तपाईंको प्रतिक्रिया लेख्नुहोस्</p>
            </div>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-400" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">अहिले प्रतिक्रिया दिँदै</span>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.displayName}</span>
                      </div>
                    </div>
                    {replyingTo && (
                      <button 
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-primary text-[10px] font-black uppercase flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all"
                      >
                        जवाफ रद्द गर्नुहोस् <X size={14} />
                      </button>
                    )}
                  </div>
                  {replyingTo && (
                    <div className="mx-2 p-4 bg-slate-50 border-l-4 border-primary rounded-xl text-xs font-medium text-slate-600 animate-in slide-in-from-left duration-300">
                      <span className="font-black text-primary">@{replyingTo.authorName}</span> लाई जवाफ दिँदै: 
                      <span className="ml-2 line-clamp-1 italic text-slate-400">"{replyingTo.content}"</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <NepaliInput 
                    value={newComment}
                    onChange={(val) => setNewComment(val)}
                    placeholder={replyingTo ? "तपाईंको जवाफ..." : "यहाँ लेख्नुहोस्... (@ प्रयोग गरेर कसैलाई मेन्सन गर्नुहोस्)"}
                    type="textarea"
                    rows={4}
                    required
                    className="w-full bg-slate-50 border-none rounded-3xl py-6 px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-inner"
                  />

                  {/* Suggestion Dropdown */}
                  <AnimatePresence>
                    {showMentions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-60 overflow-y-auto"
                      >
                        <div className="p-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">प्रयोगकर्ता मेन्सन गर्नुहोस्</div>
                        {suggestedUsers
                          .filter(u => u.displayName?.toLowerCase().includes(mentionSearch.toLowerCase()))
                          .map((u) => (
                            <button
                              key={u.uid}
                              type="button"
                              onClick={() => handleMentionClick(u.displayName)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto text-slate-400" />}
                              </div>
                              <span className="text-xs font-bold text-slate-900">{u.displayName}</span>
                            </button>
                          ))}
                        {suggestedUsers.filter(u => u.displayName?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">कोही भेटिएन</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="self-end bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Send size={18} className="inline mr-2" />
                  {isSubmitting ? "पठाउँदै..." : "प्रतिक्रिया पठाउनुहोस्"}
                </button>
              </form>
            ) : (
              <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] text-center flex flex-col items-center gap-6 shadow-2xl shadow-slate-900/20">
                 <Terminal size={40} className="text-primary" />
                 <div className="flex flex-col gap-2">
                   <h4 className="text-xl font-black">प्रतिक्रिया दिन लगइन गर्नुहोस्</h4>
                   <p className="text-slate-400 text-sm font-medium">बहसमा सहभागी हुन तपाईंको खातामा लगइन हुनुपर्छ।</p>
                 </div>
                 <Link to="/login" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/30">लगइन गर्नुहोस्</Link>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col gap-8 pt-12 border-t border-slate-100">
               {comments.length > 0 ? (
                 buildCommentTree(comments).map((commentTree) => (
                   <CommentItem 
                     key={commentTree.id} 
                     comment={commentTree} 
                     onReply={(c) => {
                       setReplyingTo(c);
                       window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                     }} 
                   />
                 ))
               ) : (
                 <div className="py-20 text-center flex flex-col items-center gap-4 text-slate-300">
                    <MessageCircle size={48} />
                    <p className="text-sm font-black uppercase tracking-widest">अझै सम्म कुनै प्रतिक्रिया छैन</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
