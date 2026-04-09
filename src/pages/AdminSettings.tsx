import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { 
  Globe, Save, MapPin, Share2, Image as ImageIcon, Play,
  Info, MessageSquare, Megaphone, Download, Upload, Shield, FileText, Sparkles
} from "lucide-react";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { motion } from "motion/react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import { addDummyData } from "@/src/utils/dummyData";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AlertModal from "@/src/components/ui/AlertModal";

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isDummyLoading, setIsDummyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals state
  const [alertInfo, setAlertInfo] = useState({ show: false, title: "", message: "", type: 'success' as 'success' | 'error' });
  const [confirmInfo, setConfirmInfo] = useState({ show: false, title: "", message: "", onConfirm: () => {} });

  const [settings, setSettings] = useState({
    siteName: "Prithvi Path Media",
    siteDescription: "सत्य, तथ्य र निष्पक्ष समाचार पोर्टल",
    contactEmail: "info@prithvipath.com",
    contactPhone: "+977-01-XXXXXXX",
    address: "Kathmandu, Nepal",
    facebookUrl: "https://facebook.com/prithvipath",
    twitterUrl: "https://twitter.com/prithvipath",
    youtubeUrl: "https://youtube.com/prithvipath",
    instagramUrl: "https://instagram.com/prithvipath",
    logoUrl: "/logo.png",
    liveVideoUrl: "",
    liveVideoType: "youtube" as "youtube" | "facebook",
    aboutUs: "",
    contactUs: "",
    footerText: "",
    termsContent: "",
    privacyContent: "",
    sponsoredAds: [] as string[],
    geminiApiKey: "",
    openaiApiKey: "",
    stabilityApiKey: "",
    cornerRadius: 24,
    categoryHeroRadius: 40,
    tickerSpeed: 40,
    copyrightText: "© २०२६ Prithvi Path Media। सर्वाधिकार सुरक्षित।",
    developerText: "AI Studio Build"
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;

    // Fetch real settings from Firestore
    const unsub = onSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, (error) => {
      console.error("Error in settings snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "settings/site");
      }
    });
    return () => unsub();
  }, [user, authLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "site"), settings, { merge: true });
      setAlertInfo({ show: true, title: "सफलता!", message: "सेटिङहरू सुरक्षित गरियो!", type: 'success' });
    } catch (err) {
      console.error("Error saving settings:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "सेटिङहरू सुरक्षित गर्दा त्रुटि भयो।", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const executeAddDummyData = async () => {
    if (!user) return;
    setIsDummyLoading(true);
    try {
      await addDummyData(user.uid);
      setAlertInfo({ show: true, title: "सफलता!", message: "डमी डेटा सफलतापूर्वक थपियो!", type: 'success' });
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      console.error(err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "डमी डेटा थप्न सकिएन।", type: 'error' });
    } finally {
      setIsDummyLoading(false);
    }
  };

  const handleAddDummyData = () => {
    setConfirmInfo({
      show: true,
      title: "डमी डेटा थप्नुहोस्",
      message: "के तपाईं डमी डेटा थप्न चाहनुहुन्छ? यसले केही विधा र समाचारहरू थप्नेछ।",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeAddDummyData();
      }
    });
  };

  const executeExport = async () => {
    setExporting(true);
    try {
      const collections = ["articles", "categories", "settings", "ads", "users", "notifications"];
      const backupData: any = {};

      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        backupData[colName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prithvipath_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "डेटा निर्यात गर्दा त्रुटि भयो।", type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    setConfirmInfo({
      show: true,
      title: "ब्याकअप डाउनलोड",
      message: "के तपाईं सबै डेटा ब्याकअपको लागि डाउनलोड गर्न चाहनुहुन्छ?",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeExport();
      }
    });
  };

  const executeImport = async (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        for (const colName in backupData) {
          const items = backupData[colName];
          if (!Array.isArray(items)) continue;

          // Process in batches of 500 (Firestore limit)
          for (let i = 0; i < items.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = items.slice(i, i + 500);
            
            chunk.forEach((item: any) => {
              const { id, ...data } = item;
              const docRef = doc(db, colName, id);
              batch.set(docRef, data, { merge: true });
            });
            
            await batch.commit();
          }
        }
        
        setAlertInfo({ show: true, title: "सफलता!", message: "डेटा सफलतापूर्वक रिस्टोर गरियो!", type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        console.error("Import error:", err);
        setAlertInfo({ show: true, title: "त्रुटि!", message: "डेटा रिस्टोर गर्दा त्रुटि भयो। फाइल सही छ कि छैन जाँच गर्नुहोस्।", type: 'error' });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConfirmInfo({
      show: true,
      title: "ब्याकअप रिस्टोर",
      message: "सावधानी: यसले तपाईंको हालको डेटालाई ब्याकअप फाइलको डेटाले ओभरराइट गर्न सक्छ। के तपाईं जारी राख्न चाहनुहुन्छ?",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeImport(file);
      }
    });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AlertModal 
        isOpen={alertInfo.show}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
      />
      <ConfirmModal
        isOpen={confirmInfo.show}
        title={confirmInfo.title}
        message={confirmInfo.message}
        onConfirm={confirmInfo.onConfirm}
        onCancel={() => setConfirmInfo({ ...confirmInfo, show: false })}
      />
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? "80px" : "280px" }}
        className="flex-grow p-8 transition-all duration-300 ease-in-out"
      >
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">सेटिङहरू</h1>
            <p className="text-sm font-medium text-slate-500">वेबसाइटको सामान्य सेटिङहरू यहाँबाट मिलाउनुहोस्।</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleAddDummyData}
              disabled={isDummyLoading || exporting || importing}
              className="bg-accent text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={18} /> {isDummyLoading ? "थपिँदै..." : "डमी डेटा थप्नुहोस्"}
            </button>
            <button 
              type="button"
              onClick={handleExport}
              disabled={exporting || importing}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Download size={18} /> {exporting ? "निर्यात हुँदै..." : "ब्याकअप डाउनलोड"}
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={exporting || importing}
              className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-sm hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Upload size={18} /> {importing ? "रिस्टोर हुँदै..." : "ब्याकअप रिस्टोर"}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".json" 
              className="hidden" 
            />
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} /> {saving ? "सुरक्षित हुँदै..." : "सुरक्षित गर्नुहोस्"}
            </button>
          </div>
        </header>

        <form onSubmit={handleSave} className="max-w-4xl flex flex-col gap-8 pb-20">
          {/* Logo Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <ImageIcon size={24} className="text-primary" /> लोगो सेटिङ
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 bg-slate-50 rounded-2xl p-4 flex items-center justify-center border-2 border-dashed border-slate-200">
                <img 
                  src={settings.logoUrl} 
                  alt="Current Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=P+P&background=0072B5&color=fff&size=128&rounded=true"; }}
                />
              </div>
              <div className="flex-grow flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">लोगो URL</label>
                    <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">५०० x १५० px</span>
                  </div>
                  <input 
                    type="text" 
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-[9px] text-slate-400 font-medium italic">
                    * पारदर्शी (Transparent) ५००x१५० पिक्सेलको लोगो राम्रो देखिन्छ।
                  </p>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">नोट: हालको लागि URL मात्र प्रयोग गर्न सकिन्छ।</p>
              </div>
            </div>
          </div>

          {/* App Appearance Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-12">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Sparkles size={24} className="text-primary" /> एपको बनावट (Appearance)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Global Corner Radius */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">सामान्य कुनाको रेडियस (Global Radius - px)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="60" 
                      step="2"
                      value={settings.cornerRadius || 24}
                      onChange={(e) => setSettings({ ...settings, cornerRadius: parseInt(e.target.value) })}
                      className="flex-grow h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-20 h-14 bg-slate-50 border-2 border-primary/20 rounded-xl flex items-center justify-center text-lg font-black text-primary shadow-inner">
                      {settings.cornerRadius || 24}
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">
                    <span>Sharp (0px)</span>
                    <span>Rounded (60px)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    * यसले एपका कार्डहरू, बटनहरू र सानो इमेजहरूको कुना कत्तिको गोलो हुने भन्ने निर्धारण गर्छ।
                  </p>
                </div>
              </div>

              {/* Category Hero Radius */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">विधाको मुख्य फोटो रेडियस (Category Hero Radius - px)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="2"
                      value={settings.categoryHeroRadius || 40}
                      onChange={(e) => setSettings({ ...settings, categoryHeroRadius: parseInt(e.target.value) })}
                      className="flex-grow h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <div className="w-20 h-14 bg-slate-50 border-2 border-accent/20 rounded-xl flex items-center justify-center text-lg font-black text-accent shadow-inner">
                      {settings.categoryHeroRadius || 40}
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">
                    <span>Sharp (0px)</span>
                    <span>Extra Rounded (100px)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    * यसले विधाका मुख्य फोटोहरू (Category Hero Images) को कुना कत्तिको गोलो हुने भन्ने निर्धारण गर्छ।
                  </p>
                </div>
              </div>

              {/* Ticker Speed Settings */}
              <div className="flex flex-col gap-6 md:col-span-2">
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">न्यूज टिकर गति (Ticker Speed - Seconds)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="10" 
                      max="120" 
                      step="5"
                      value={settings.tickerSpeed || 40}
                      onChange={(e) => setSettings({ ...settings, tickerSpeed: parseInt(e.target.value) })}
                      className="flex-grow h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-20 h-14 bg-slate-50 border-2 border-primary/20 rounded-xl flex items-center justify-center text-lg font-black text-primary shadow-inner">
                      {settings.tickerSpeed || 40}s
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">
                    <span>Fast (10s)</span>
                    <span>Slow (120s)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    * टिकरको गति कति सेकेन्डमा एक चक्र पूरा गर्ने भन्ने मिलाउनुहोस्। कम सेकेन्ड = छिटो गति।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Video Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Play size={24} className="text-primary" /> प्रत्यक्ष प्रसारण (Live) सेटिङ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">भिडियो प्रकार</label>
                <select 
                  value={settings.liveVideoType}
                  onChange={(e) => setSettings({ ...settings, liveVideoType: e.target.value as "youtube" | "facebook" })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                >
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">भिडियो URL</label>
                <input 
                  type="text" 
                  value={settings.liveVideoUrl}
                  onChange={(e) => setSettings({ ...settings, liveVideoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... वा Facebook Live URL"
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              नोट: YouTube को लागि भिडियो ID वा पूरा URL र Facebook को लागि पूरा भिडियो URL राख्नुहोस्।
            </p>
          </div>

          {/* General Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Globe size={24} className="text-primary" /> सामान्य जानकारी
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">वेबसाइटको नाम</label>
                <NepaliInput 
                  value={settings.siteName}
                  onChange={(val) => setSettings({ ...settings, siteName: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">सम्पर्क इमेल</label>
                <input 
                  type="email" 
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">वेबसाइटको विवरण</label>
              <NepaliInput 
                value={settings.siteDescription}
                onChange={(val) => setSettings({ ...settings, siteDescription: val })}
                className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                rows={3}
                type="textarea"
              />
            </div>
          </div>

          {/* Footer Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <FileText size={24} className="text-primary" /> फुटर (Footer) सेटिङ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">प्रतिलिपि अधिकार (Copyright) पाठ</label>
                <NepaliInput 
                  value={settings.copyrightText}
                  onChange={(val) => setSettings({ ...settings, copyrightText: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">विकासकर्ता (Developer) पाठ</label>
                <input 
                  type="text" 
                  value={settings.developerText}
                  onChange={(e) => setSettings({ ...settings, developerText: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <MapPin size={24} className="text-primary" /> सम्पर्क विवरण
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">फोन नम्बर</label>
                <input 
                  type="text" 
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ठेगाना</label>
                <NepaliInput 
                  value={settings.address}
                  onChange={(val) => setSettings({ ...settings, address: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Social Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Share2 size={24} className="text-primary" /> सामाजिक सञ्जाल
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facebook URL</label>
                <input 
                  type="text" 
                  value={settings.facebookUrl}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Twitter URL</label>
                <input 
                  type="text" 
                  value={settings.twitterUrl}
                  onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YouTube URL</label>
                <input 
                  type="text" 
                  value={settings.youtubeUrl}
                  onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram URL</label>
                <input 
                  type="text" 
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Page Content Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Info size={24} className="text-primary" /> पेज सामाग्री (Page Content)
            </h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">हाम्रो बारेमा (About Us)</label>
                <NepaliInput 
                  value={settings.aboutUs}
                  onChange={(val) => setSettings({ ...settings, aboutUs: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={6}
                  type="textarea"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">सम्पर्क (Contact Us)</label>
                <NepaliInput 
                  value={settings.contactUs}
                  onChange={(val) => setSettings({ ...settings, contactUs: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={4}
                  type="textarea"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">फुटर टेक्स्ट (Footer Text)</label>
                <NepaliInput 
                  value={settings.footerText}
                  onChange={(val) => setSettings({ ...settings, footerText: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Terms & Privacy Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Shield size={24} className="text-primary" /> नियम र गोपनीयता (Terms & Privacy)
            </h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> नियम र सर्तहरू (Terms & Conditions)
                </label>
                <NepaliInput 
                  value={settings.termsContent}
                  onChange={(val) => setSettings({ ...settings, termsContent: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={10}
                  type="textarea"
                  placeholder="नियम र सर्तहरू यहाँ लेख्नुहोस्..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} /> गोपनीयता नीति (Privacy Policy)
                </label>
                <NepaliInput 
                  value={settings.privacyContent}
                  onChange={(val) => setSettings({ ...settings, privacyContent: val })}
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={10}
                  type="textarea"
                  placeholder="गोपनीयता नीति यहाँ लेख्नुहोस्..."
                />
              </div>
            </div>
          </div>

          {/* AI API Keys Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Save size={24} className="text-primary" /> AI API कुञ्जीहरू (API Keys)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gemini API Key</label>
                <input 
                  type="password" 
                  value={settings.geminiApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AI समाचार र ट्रान्सलिटरेसनको लागि"
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={settings.openaiApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  placeholder="वैकल्पिक AI मोडेलको लागि"
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stability AI Key</label>
                <input 
                  type="password" 
                  value={settings.stabilityApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, stabilityApiKey: e.target.value })}
                  placeholder="फोटो सिर्जनाको लागि"
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              नोट: यी कुञ्जीहरू पोर्टलको भविष्यको तैनाती र AI सुविधाहरूको लागि प्रयोग गरिनेछ।
            </p>
          </div>

          {/* Sponsored Ads Settings */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Megaphone size={24} className="text-primary" /> प्रायोजित विज्ञापनहरू (Sponsored Ads)
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">विज्ञापनहरू (प्रति लाइन एक)</label>
                <textarea 
                  value={settings.sponsoredAds.join("\n")}
                  onChange={(e) => setSettings({ ...settings, sponsoredAds: e.target.value.split("\n").filter(line => line.trim() !== "") })}
                  placeholder="यहाँ विज्ञापनहरू लेख्नुहोस्..."
                  className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={5}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                नोट: यी विज्ञापनहरू लाइभ च्याटमा स्क्रोलिङ टेक्स्टको रूपमा देखिनेछन्।
              </p>
            </div>
          </div>
        </form>
      </motion.main>
    </div>
  );
}
