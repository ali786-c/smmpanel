import { useState } from "react";
import { useTestimonials, usePlatforms, useNiches } from "@/hooks/use-api";
import { motion } from "framer-motion";
import { SiInstagram, SiTiktok, SiYoutube, SiX } from "react-icons/si";

const PlatformIcon = ({ platform, className }: { platform: string, className?: string }) => {
  switch (platform?.toLowerCase()) {
    case 'instagram': return <SiInstagram className={className} />;
    case 'tiktok': return <SiTiktok className={className} />;
    case 'youtube': return <SiYoutube className={className} />;
    case 'twitter/x':
    case 'twitter': return <SiX className={className} />;
    default: return null;
  }
};

export function Testimonials() {
  const [platform, setPlatform] = useState("");
  const [niche, setNiche] = useState("");
  const [page, setPage] = useState(1);
  
  const { data: platforms } = usePlatforms();
  const { data: niches } = useNiches();
  const { data, loading, meta } = useTestimonials(page, { platform, niche });

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-sm font-mono text-primary tracking-[0.2em] mb-4">GLOBAL FEED</h2>
            <h3 className="text-4xl md:text-5xl font-bold">Live Order Stream</h3>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select 
              value={platform} 
              onChange={e => { setPlatform(e.target.value); setPage(1); }}
              className="bg-black border border-white/20 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none"
            >
              <option value="">All Platforms</option>
              {platforms?.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            
            <select 
              value={niche} 
              onChange={e => { setNiche(e.target.value); setPage(1); }}
              className="bg-black border border-white/20 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none"
            >
              <option value="">All Niches</option>
              {niches?.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.map((item: any, idx: number) => (
            <motion.div
              key={`${item.id}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between h-full"
            >
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                     <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.author_handle}`} alt="avatar" />
                   </div>
                   <div>
                     <p className="text-sm font-bold truncate max-w-[100px]">{item.author_name}</p>
                     <p className="text-xs text-gray-500 truncate max-w-[100px]">@{item.author_handle}</p>
                   </div>
                 </div>
                 <PlatformIcon platform={item.platform} className="w-4 h-4 text-gray-400" />
               </div>
               <p className="text-sm text-gray-300 line-clamp-4 flex-grow italic mb-4">"{item.content}"</p>
               <div className="flex justify-between items-center text-xs font-mono text-gray-500 border-t border-white/5 pt-3">
                 <span>{item.niche}</span>
                 <span className="text-primary">{item.followers_count}</span>
               </div>
            </motion.div>
          ))}
        </div>
        
        {loading && (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        
        {!loading && meta && page < meta.last_page && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-mono transition-colors"
            >
              LOAD MORE
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
