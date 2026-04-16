import { useStats } from "@/hooks/use-api";
import { motion } from "framer-motion";

export function Stats() {
  const { data, loading } = useStats();

  return (
    <section className="py-12 border-y border-white/5 bg-black/50 overflow-hidden flex relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
      
      {loading ? (
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 w-32 bg-white/5 rounded-md" />
          ))}
        </div>
      ) : data ? (
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="flex whitespace-nowrap gap-16 px-8 items-center"
        >
          {Object.entries(data).map(([key, stat]: [string, any], idx) => (
            <div key={key + idx} className="flex flex-col items-center justify-center font-mono">
              <div className="text-3xl font-bold text-white">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-xs text-primary uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
          {Object.entries(data).map(([key, stat]: [string, any], idx) => (
            <div key={key + idx + '-dup'} className="flex flex-col items-center justify-center font-mono">
              <div className="text-3xl font-bold text-white">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-xs text-primary uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="flex whitespace-nowrap gap-16 px-8 items-center">
          {[
            { value: "10K+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
            { value: "2M+", label: "Orders Delivered" },
            { value: "50+", label: "Services" },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center font-mono">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-primary uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
