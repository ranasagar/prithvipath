import { Link } from "react-router-dom";
import { MessageCircle, Share2, MoreVertical, Trash2, Pin, Flag, User } from "lucide-react";
import { doc, deleteDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import type { ChautariPost } from "@/src/types";
import VoteButtons from "./VoteButtons";
import { useState } from "react";

interface PostCardProps {
  post: ChautariPost;
  onEdit?: (post: ChautariPost) => void;
}

export default function PostCard({ post, onEdit }: PostCardProps) {
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const isAuthor = user?.uid === post.authorId;
  const canModerate = user?.role === 'admin' || user?.role === 'editor';

  const handleDelete = async () => {
    if (!window.confirm("के तपाईं यो पोष्ट हटाउन निश्चित हुनुहुन्छ?")) return;
    try {
      await deleteDoc(doc(db, "chautari_posts", post.id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleTogglePin = async () => {
    try {
      await updateDoc(doc(db, "chautari_posts", post.id), {
        isPinned: !post.isPinned
      });
    } catch (err) {
      console.error("Pin error:", err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.content.substring(0, 100) + "...",
      url: `${window.location.origin}/chautari/post/${post.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Clipboard error:", err);
      }
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("लगइन गर्नुहोस्।");
      return;
    }
    if (!window.confirm("यो पोष्ट रिपोर्ट गर्न निश्चित हुनुहुन्छ?")) return;
    
    try {
      await addDoc(collection(db, "chautari_reports"), {
        postId: post.id,
        reporterId: user.uid,
        reason: "Reported by user",
        createdAt: serverTimestamp()
      });
      alert("रिपोर्ट गरिएको छ। धन्यवाद!");
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  return (
    <div className={`flex gap-6 bg-white p-6 rounded-3xl border transition-all hover:shadow-xl hover:shadow-slate-100/50 ${post.isPinned ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-100'}`}>
      <VoteButtons 
        postId={post.id} 
        authorId={post.authorId}
        postTitle={post.title}
        initialUpvotes={post.upvotes} 
        initialDownvotes={post.downvotes} 
      />
      
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.authorId}`} className="w-10 h-10 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
              {post.authorPhoto ? (
                <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </Link>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.authorId}`} className="text-xs font-black text-slate-900 hover:text-primary transition-colors">
                  {post.authorName}
                </Link>
                {post.isPinned && (
                  <span className="bg-primary/10 text-primary p-0.5 rounded flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter">
                    <Pin size={8} fill="currentColor" /> पिन गरिएको
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>

          {(isAuthor || canModerate) && (
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-slate-50"
              >
                <MoreVertical size={18} />
              </button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20">
                  {isAuthor && (
                    <button 
                      onClick={() => { onEdit?.(post); setShowOptions(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      सम्पादन गर्नुहोस्
                    </button>
                  )}
                  {canModerate && (
                    <button 
                      onClick={() => { handleTogglePin(); setShowOptions(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Pin size={14} /> {post.isPinned ? 'अनपिन गर्नुहोस्' : 'पिन गर्नुहोस्'}
                    </button>
                  )}
                  {(isAuthor || canModerate) && (
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} /> हटाउनुहोस्
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Link to={`/chautari/post/${post.id}`} className="text-xl md:text-2xl font-black text-slate-900 leading-tight hover:text-primary transition-colors">
            {post.title}
          </Link>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {post.content}
          </p>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <Link to={`/chautari/post/${post.id}`} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
            <MessageCircle size={16} /> {post.commentCount || 0} प्रतिक्रिया
          </Link>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
          >
            <Share2 size={16} /> शेयर
          </button>
          <button 
            onClick={handleReport}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest ml-auto"
          >
            <Flag size={16} /> रिपोर्ट
          </button>
        </div>
      </div>
    </div>
  );
}
