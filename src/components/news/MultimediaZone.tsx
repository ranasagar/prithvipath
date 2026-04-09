import { useState } from "react";
import { Play, Clock, Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

interface MultimediaZoneProps {
  articles: Article[];
}

export default function MultimediaZone({ articles }: MultimediaZoneProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.split("v=")[1]?.split("&")[0] || url.split("be/")[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  return (
    <section className="bg-slate-900 py-24 my-24 rounded-[4rem] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex flex-col gap-4">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">भिडियो र मल्टिमिडिया</span>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">दृश्यमा समाचार</h2>
          </div>
          <Link to="/category/video" className="group flex items-center gap-3 text-white text-xs font-black uppercase tracking-widest bg-white/5 px-8 py-4 rounded-full hover:bg-primary transition-all border border-white/10">
            सबै भिडIOहरू <Play size={18} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {articles.map((article) => (
            <div key={article.id} className="group flex flex-col gap-6">
              <div className="relative aspect-video overflow-hidden rounded-[2rem] shadow-2xl bg-black group-hover:shadow-primary/10 transition-all duration-500">
                {playingVideo === article.id ? (
                  <div className="w-full h-full relative">
                    <iframe 
                      src={getEmbedUrl(article.videoUrl || "") || ""}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                    <button 
                      onClick={() => setPlayingVideo(null)}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors z-10 backdrop-blur-md"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <img 
                      src={article.featuredImage} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => setPlayingVideo(article.id)}
                      className="absolute inset-0 flex items-center justify-center group"
                    >
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border border-white/30">
                        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl">
                          <Play size={24} fill="currentColor" />
                        </div>
                      </div>
                    </button>
                    <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 pointer-events-none">
                      <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full w-fit uppercase tracking-widest shadow-lg">
                        {article.categoryId}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-3 px-2">
                <Link to={`/article/${article.id}`}>
                  <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-[1.3] line-clamp-2 tracking-tight">
                    {article.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {formatDate(article.createdAt)}</span>
                  <span className="flex items-center gap-2"><Eye size={14} className="text-primary" /> {article.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
