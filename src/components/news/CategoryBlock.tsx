import { Link } from "react-router-dom";
import { Clock, Eye, ChevronRight, ArrowRight, Zap, Star } from "lucide-react";
import { formatDate, getCategoryColor } from "@/src/lib/utils";
import type { Article, Category } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";

interface CategoryBlockProps {
  category: Category;
  articles: Article[];
}

const ArticleTags = ({ article }: { article: Article }) => (
  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
    {article.isBreaking && (
      <motion.span 
        animate={{ scale: [1, 1.1, 1], backgroundColor: ["#ef4444", "#dc2626", "#ef4444"] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg"
      >
        <Zap size={10} /> ताजा समाचार
      </motion.span>
    )}
    {article.isFeatured && (
      <motion.span 
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="bg-amber-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg"
      >
        <Star size={10} /> विशेष
      </motion.span>
    )}
  </div>
);

const CategoryHeader = ({ category, catColor }: { category: Category, catColor: string }) => {
  return (
    <div className="flex items-center justify-between relative">
      <div className="relative group">
        {/* Advanced Light Trail Container */}
        <div className="relative p-[3px] overflow-hidden rounded-2xl bg-slate-100/50 shadow-lg">
          {/* Primary Rotating Trail (Fast) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%] z-0"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #0072B5 10%, #b91c1c 25%, #0072B5 40%, transparent 60%, transparent 100%)",
              filter: "blur(20px)",
            }}
          />
          
          {/* Secondary Rotating Trail (Slow - Motion Blur Effect) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%] z-0 opacity-40"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #b91c1c 15%, #0072B5 35%, transparent 55%, transparent 100%)",
              filter: "blur(30px)",
            }}
          />

          {/* Third Layer (Counter-Rotating for complexity) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-200%] z-0 opacity-30"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #0072B5 20%, #b91c1c 40%, transparent 60%, transparent 100%)",
              filter: "blur(40px)",
            }}
          />
          
          {/* Inner Content (The "Button") */}
          <div className="relative z-10 flex items-center bg-white rounded-[calc(1rem-3px)] px-6 py-2.5">
            <motion.div 
              className={`w-1.5 h-6 ${catColor} rounded-full mr-4`}
              animate={{ height: [16, 24, 16] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {category.nameNepali}
            </h3>
          </div>
        </div>
        
        {/* Extra Glow Effect on Hover */}
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
      </div>
      
      <Link to={`/category/${category.slug}`} className={`${catColor.replace('bg-', 'text-')} text-sm font-black uppercase tracking-widest hover:underline flex items-center gap-2 group`}>
        सबै हेर्नुहोस् 
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronRight size={16} />
        </motion.span>
      </Link>
    </div>
  );
};

export default function CategoryBlock({ category, articles }: CategoryBlockProps) {
  if (articles.length === 0) return null;

  const style = category.homepageStyle || "grid";
  const count = category.postCount || 4;
  const displayArticles = articles.slice(0, count);
  const catColor = getCategoryColor(category.slug);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Pattern 1: Grid (2x2)
  if (style === "grid") {
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-8 py-12 border-t border-slate-100"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayArticles.map((article) => (
            <motion.div key={article.id} variants={itemVariants}>
              <Link to={`/article/${article.id}`} className="group flex flex-col gap-4">
                <div className="relative aspect-video overflow-hidden rounded-cat-hero shadow-xl">
                  <ArticleTags article={article} />
                  <img 
                    src={article.featuredImage} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(article.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Pattern 2: Featured Left + List Right
  if (style === "featured_list") {
    const featured = displayArticles[0];
    const rest = displayArticles.slice(1);
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-8 py-12 border-t border-slate-100"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.div variants={itemVariants} className="lg:col-span-7">
            <Link to={`/article/${featured.id}`} className="group flex flex-col gap-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-cat-hero shadow-2xl">
                <ArticleTags article={featured} />
                <img 
                  src={featured.featuredImage} 
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {featured.title}
                </h4>
                <p className="text-slate-500 line-clamp-2 leading-relaxed">
                  {featured.excerpt}
                </p>
              </div>
            </Link>
          </motion.div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            {rest.map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <Link to={`/article/${article.id}`} className="group flex gap-4 items-center p-4 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                  <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{formatDate(article.createdAt)}</span>
                  </div>
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    );
  }

  // Pattern 3: Horizontal Scroll / Cards
  if (style === "cards") {
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-8 py-12 border-t border-slate-100"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayArticles.map((article) => (
            <motion.div key={article.id} variants={itemVariants}>
              <Link to={`/article/${article.id}`} className="group flex flex-col gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <ArticleTags article={article} />
                <img 
                  src={article.featuredImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                {article.title}
              </h4>
            </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Pattern 5: Magazine Style
  if (style === "magazine") {
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-8 py-12 border-t border-slate-100"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Link to={`/article/${displayArticles[0].id}`} className="group flex flex-col gap-6">
              <div className="relative aspect-video overflow-hidden rounded-cat-hero shadow-2xl">
                <ArticleTags article={displayArticles[0]} />
                <img src={displayArticles[0].featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h4 className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">{displayArticles[0].title}</h4>
              <p className="text-slate-500 line-clamp-2">{displayArticles[0].excerpt}</p>
            </Link>
          </motion.div>
          <div className="flex flex-col gap-8">
            {displayArticles.slice(1, 4).map(article => (
              <motion.div key={article.id} variants={itemVariants}>
                <Link to={`/article/${article.id}`} className="group flex flex-col gap-3 border-b border-slate-100 pb-6 last:border-0">
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">{article.title}</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(article.createdAt)}</span>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    );
  }

  // Pattern 6: Masonry Style (Simulated with columns)
  if (style === "masonry") {
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-8 py-12 border-t border-slate-100"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {displayArticles.map((article, idx) => (
            <motion.div key={article.id} variants={itemVariants}>
              <Link to={`/article/${article.id}`} className="group break-inside-avoid flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
              <div className={`relative overflow-hidden rounded-2xl ${idx % 3 === 0 ? 'aspect-square' : 'aspect-video'}`}>
                <ArticleTags article={article} />
                <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{article.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
            </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Pattern 7: Overlay Style
  if (style === "overlay") {
    return (
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="flex flex-col gap-8 py-12 border-t border-slate-100"
      >
        <CategoryHeader category={category} catColor={catColor} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayArticles.slice(0, 2).map((article) => (
            <motion.div key={article.id} variants={itemVariants} className="group relative aspect-video overflow-hidden rounded-cat-hero shadow-2xl">
              <Link to={`/article/${article.id}`} className="absolute inset-0 z-0">
                <ArticleTags article={article} />
                <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              </Link>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10 pointer-events-none">
                <Link to={`/article/${article.id}`} className="pointer-events-auto">
                  <h4 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight mb-4">{article.title}</h4>
                </Link>
                <div className="flex items-center gap-4 text-[10px] font-black text-white/60 uppercase tracking-widest pointer-events-auto">
                  <span>{formatDate(article.createdAt)}</span>
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                  <Link to={`/profile/${article.authorId}`} className="hover:text-white transition-colors">{article.authorName}</Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Pattern 4: Alternating Row
  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="flex flex-col gap-8 py-12 border-t border-slate-100"
    >
      <CategoryHeader category={category} catColor={catColor} />
      <div className="flex flex-col gap-12">
        {displayArticles.slice(0, 2).map((article, idx) => (
          <motion.div key={article.id} variants={itemVariants} className={`group grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
            <Link to={`/article/${article.id}`} className={`md:col-span-5 relative aspect-video overflow-hidden rounded-cat-hero shadow-xl ${idx % 2 === 1 ? 'md:order-2' : ''}`}>
              <ArticleTags article={article} />
              <img 
                src={article.featuredImage} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </Link>
            <div className="md:col-span-7 flex flex-col gap-4">
              <Link to={`/article/${article.id}`}>
                <h4 className="text-2xl md:text-4xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h4>
              </Link>
              <p className="text-slate-500 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(article.createdAt)}</span>
                <Link to={`/profile/${article.authorId}`} className="text-primary hover:underline">{article.authorName}</Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
