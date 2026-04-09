import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ChevronLeft, UserPlus, User } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/src/lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useAuth } from "@/src/lib/auth";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true");
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    // Listen for global site settings (logo)
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists() && doc.data().logoUrl) {
        setLogoUrl(doc.data().logoUrl);
      }
    }, (error) => {
      console.error("Error in login settings snapshot:", error);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        const userCredential = auth.currentUser;
        if (userCredential) {
          const userDoc = await getDoc(doc(db, "users", userCredential.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin' || userData.role === 'editor') {
              navigate("/admin");
            } else {
              navigate(`/profile/${userCredential.uid}`);
            }
          } else {
            navigate(`/profile/${userCredential.uid}`);
          }
        }
      } else {
        if (!displayName) {
          setError("कृपया आफ्नो नाम राख्नुहोस्।");
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        setSuccess("खाता सफलतापूर्वक सिर्जना गरियो! कृपया आफ्नो इमेल पुष्टि गर्नुहोस्।");
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("यो इमेल पहिले नै प्रयोगमा छ।");
      } else if (err.code === 'auth/weak-password') {
        setError("पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।");
      } else {
        setError(isLogin ? "इमेल वा पासवर्ड मिलेन।" : "खाता सिर्जना गर्दा समस्या आयो।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.role === 'editor') {
          navigate("/admin");
        } else {
          navigate(`/profile/${userCredential.user.uid}`);
        }
      } else {
        navigate(`/profile/${userCredential.user.uid}`);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("गुगल लगइनमा समस्या आयो: " + (err.message || "अज्ञात त्रुटि"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow flex items-center justify-center pb-8 px-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
          <div className="p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl p-2 shadow-sm border border-slate-100">
                <img 
                  src={logoUrl} 
                  alt="Prithvi Path Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true"; }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {isLogin ? "स्वागत छ!" : "नयाँ खाता"}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {isLogin ? "तपाईंको खातामा लगइन गर्नुहोस्" : "आजै दर्ता गर्नुहोस् र समाचारमा अपडेट रहनुहोस्"}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center border border-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-sm font-bold text-center border border-green-100">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {!isLogin && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">पूरा नाम</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="तपाईंको नाम"
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">इमेल</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">पासवर्ड</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <Link to="/forgot-password" title="Forgot Password" className="text-xs font-bold text-primary hover:underline">पासवर्ड बिर्सनुभयो?</Link>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {loading ? "प्रक्रियामा छ..." : (isLogin ? "लगइन गर्नुहोस्" : "खाता सिर्जना गर्नुहोस्")}
              </button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold text-slate-500 hover:text-primary transition-colors"
              >
                {isLogin ? "नयाँ खाता सिर्जना गर्नुहोस्?" : "पहिले नै खाता छ? लगइन गर्नुहोस्"}
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-slate-100 flex-grow"></div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">अथवा</span>
              <div className="h-px bg-slate-100 flex-grow"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              गुगलबाट {isLogin ? "लगइन" : "दर्ता"} गर्नुहोस्
            </button>
          </div>

          <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              गृहपृष्ठमा फर्कनुहोस्
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
