import { useFeaturedTestimonials } from "@/hooks/use-api";
import { motion } from "framer-motion";
import { SiInstagram, SiTiktok, SiYoutube, SiX } from "react-icons/si";

const PlatformIcon = ({ platform, className }: { platform: string, className?: string }) => {
  switch (platform.toLowerCase()) {
    case 'instagram': return <SiInstagram className={className} />;
    case 'tiktok': return <SiTiktok className={className} />;
    case 'youtube': return <SiYoutube className={className} />;
    case 'twitter/x':
    case 'twitter': return <SiX className={className} />;
    default: return null;
  }
};

export function FeaturedTestimonials() {
  const { data, loading } = useFeaturedTestimonials();

  return (
    <section className="py-32 bg-black/30 border-y border-white/5 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-20">
          <h2 className="text-sm font-mono text-primary tracking-[0.2em] mb-4">VERIFIED RESULTS</h2>
          <h3 className="text-4xl md:text-5xl font-bold">Top Creators Trust emazingSM</h3>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.slice(0, 6).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  <PlatformIcon platform={item.platform} className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.avatar_seed || item.author_handle}`} alt={item.author_name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{item.author_name}</h4>
                    <p className="text-sm text-gray-500">@{item.author_handle} • {item.followers_count}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 leading-relaxed italic">
                  "{item.content}"
                </p>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono text-gray-500">
                  <span>{item.niche}</span>
                  <div className="flex text-yellow-500">
                    {[...Array(item.rating)].map((_, i) => <span key={i}>★</span>)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
