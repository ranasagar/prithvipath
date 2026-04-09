import { useState } from "react";
import { 
  BookOpen, Github, Globe, Server, Terminal, 
  Code, Database, Cloud, Layout, CheckCircle2, 
  ExternalLink, Copy, Check, Info, HelpCircle
} from "lucide-react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import { motion } from "motion/react";

export default function AdminSetupGuide() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sections = [
    {
      id: "local-setup",
      title: "Local Setup",
      icon: Terminal,
      color: "text-blue-500",
      bg: "bg-blue-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            To run this application on your local machine, follow these steps:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Install Node.js</h4>
                <p className="text-sm text-slate-500">Download and install Node.js (v18 or higher) from <a href="https://nodejs.org" target="_blank" className="text-blue-500 hover:underline">nodejs.org</a>.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Clone Repository</h4>
                <div className="mt-2 relative group">
                  <code className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
                    git clone https://github.com/your-username/prithvi-path.git
                  </code>
                  <button 
                    onClick={() => copyToClipboard("git clone https://github.com/your-username/prithvi-path.git")}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText === "git clone https://github.com/your-username/prithvi-path.git" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Install Dependencies</h4>
                <div className="mt-2 relative group">
                  <code className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
                    npm install
                  </code>
                  <button 
                    onClick={() => copyToClipboard("npm install")}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText === "npm install" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Environment Variables</h4>
                <p className="text-sm text-slate-500">Create a <code className="bg-slate-100 px-1 rounded">.env</code> file in the root directory and add your Firebase and Gemini API keys.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">5</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Run Development Server</h4>
                <div className="mt-2 relative group">
                  <code className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
                    npm run dev
                  </code>
                  <button 
                    onClick={() => copyToClipboard("npm run dev")}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText === "npm run dev" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "firebase-setup",
      title: "Firebase Configuration",
      icon: Database,
      color: "text-orange-500",
      bg: "bg-orange-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            This app uses Firebase for Authentication and Firestore Database.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Create a new project at <a href="https://console.firebase.google.com" target="_blank" className="text-orange-500 hover:underline">Firebase Console</a>.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Enable <b>Authentication</b> (Google Provider).</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Create a <b>Cloud Firestore</b> database in production mode.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Copy your <b>Web App Configuration</b> and paste it into <code className="bg-slate-100 px-1 rounded">firebase-applet-config.json</code>.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Deploy Security Rules using <code className="bg-slate-100 px-1 rounded">firestore.rules</code>.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "vscode-integration",
      title: "VS Code & Antigravity",
      icon: Code,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            You can edit the code of this application directly in VS Code while keeping it synced with the Antigravity environment.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Export to GitHub</h4>
                <p className="text-sm text-slate-500">Use the "Export to GitHub" option in the AI Studio settings menu to create a linked repository.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Clone & Open</h4>
                <p className="text-sm text-slate-500">Clone the repository to your local machine and open it in VS Code.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Antigravity Sync</h4>
                <p className="text-sm text-slate-500">Any changes pushed to the main branch of your GitHub repository will be automatically reflected in the Antigravity environment.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "deployment",
      title: "Deployment (Vercel & GitHub)",
      icon: Cloud,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            Deploy your application to the web using GitHub and Vercel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3">
              <Github className="text-slate-900" size={32} />
              <h4 className="font-bold text-slate-900">GitHub</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Push your code to a GitHub repository. This enables automatic deployments and version control.</p>
              <a href="https://github.com/new" target="_blank" className="inline-flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline">Create Repo <ExternalLink size={12} /></a>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3">
              <Globe className="text-blue-500" size={32} />
              <h4 className="font-bold text-slate-900">Vercel</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Connect your GitHub repo to Vercel. It will automatically build and deploy your app on every push.</p>
              <a href="https://vercel.com/new" target="_blank" className="inline-flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline">Deploy Now <ExternalLink size={12} /></a>
            </div>
          </div>
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <Info size={18} /> Important Note
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              When deploying to Vercel, make sure to add all your environment variables (from <code className="bg-white/50 px-1 rounded">.env</code>) in the Vercel Project Settings.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      <main className={`flex-grow transition-all duration-300 ${isSidebarCollapsed ? "ml-20" : "ml-[280px]"} p-8 md:p-12`}>
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-inner">
                <BookOpen size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Setup & Deployment Guide</h1>
                <p className="text-slate-500 font-medium">Follow these instructions to set up and deploy your news portal.</p>
              </div>
            </div>
          </div>

          {/* Grid Sections */}
          <div className="grid grid-cols-1 gap-8">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-12 h-12 ${section.bg} ${section.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                      <section.icon size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{section.title}</h2>
                  </div>
                  {section.content}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Footer Help */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Need more help?</h3>
            <p className="text-slate-400 max-w-xl mx-auto font-medium">
              If you encounter any issues during setup or deployment, please refer to the official documentation of the tools mentioned above or contact our support team.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a href="https://firebase.google.com/docs" target="_blank" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all">Firebase Docs</a>
              <a href="https://vercel.com/docs" target="_blank" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all">Vercel Docs</a>
              <a href="https://docs.github.com" target="_blank" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all">GitHub Docs</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
