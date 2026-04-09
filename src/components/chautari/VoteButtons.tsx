import { useState, useEffect } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { createNotification } from "@/src/lib/notifications";

interface VoteButtonsProps {
  postId: string;
  authorId: string; // New: to award karma
  postTitle: string; // New: for notifications
  initialUpvotes: number;
  initialDownvotes: number;
  onVoteChange?: (newScore: number) => void;
}

export default function VoteButtons({ postId, authorId, postTitle, initialUpvotes, initialDownvotes, onVoteChange }: VoteButtonsProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<number | null>(null); // 1 = up, -1 = down, null = none
  const [score, setScore] = useState(initialUpvotes - initialDownvotes);

  useEffect(() => {
    if (!user) return;

    // Check if user has already voted
    const fetchVote = async () => {
      const voteRef = doc(db, "chautari_votes", `${user.uid}_${postId}`);
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists()) {
        setUserVote(voteSnap.data().voteType);
      }
    };

    fetchVote();
  }, [user, postId]);

  const handleVote = async (type: number) => {
    if (!user) {
      // Redirect to login or show alert
      return;
    }

    const voteRef = doc(db, "chautari_votes", `${user.uid}_${postId}`);
    const postRef = doc(db, "chautari_posts", postId);

    try {
      if (userVote === type) {
        // Remove vote
        await deleteDoc(voteRef);
        await updateDoc(postRef, {
          [type === 1 ? 'upvotes' : 'downvotes']: increment(-1)
        });
        setScore(prev => prev - type);
        setUserVote(null);
      } else {
        // Toggle or new vote
        const oldVote = userVote;
        await setDoc(voteRef, {
          userId: user.uid,
          postId: postId,
          voteType: type,
          createdAt: new Date().toISOString()
        });

        if (oldVote === null) {
          // New vote
          await updateDoc(postRef, {
            [type === 1 ? 'upvotes' : 'downvotes']: increment(1)
          });
          
          // Award author karma
          if (authorId !== user.uid) {
            const authorRef = doc(db, "users", authorId);
            await updateDoc(authorRef, { karma: increment(type === 1 ? 1 : -1) });
            
            // Notify author of upvote
            if (type === 1) {
              await createNotification({
                title: "नयाँ अपभोट!",
                message: `तपाईंको पोष्ट '${postTitle}' मा एक अपभोट प्राप्त भयो!`,
                type: "success",
                recipientId: authorId,
                link: `/chautari/post/${postId}`
              });
            }
          }
          setScore(prev => prev + type);
        } else {
          // Toggle vote
          await updateDoc(postRef, {
            [type === 1 ? 'upvotes' : 'downvotes']: increment(1),
            [oldVote === 1 ? 'upvotes' : 'downvotes']: increment(-1)
          });
          
          // Adjust author karma
          if (authorId !== user.uid) {
            const authorRef = doc(db, "users", authorId);
            await updateDoc(authorRef, { karma: increment(type === 1 ? 2 : -2) });
          }
          setScore(prev => prev + (type * 2));
        }
        setUserVote(type);
      }
    } catch (error) {
      console.error("Voting error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 bg-slate-50 p-2 rounded-xl group/vote">
      <button 
        onClick={() => handleVote(1)}
        className={`p-1 rounded-lg transition-all ${userVote === 1 ? 'text-primary bg-primary/10' : 'text-slate-400 hover:bg-white hover:text-primary hover:shadow-sm'}`}
      >
        <ArrowBigUp size={24} fill={userVote === 1 ? "currentColor" : "none"} />
      </button>
      <span className={`text-xs font-black tabular-nums transition-colors ${userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-accent' : 'text-slate-600'}`}>
        {score > 0 ? `+${score}` : score}
      </span>
      <button 
        onClick={() => handleVote(-1)}
        className={`p-1 rounded-lg transition-all ${userVote === -1 ? 'text-accent bg-accent/10' : 'text-slate-400 hover:bg-white hover:text-accent hover:shadow-sm'}`}
      >
        <ArrowBigDown size={24} fill={userVote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
