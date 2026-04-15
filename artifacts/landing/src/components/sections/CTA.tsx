import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-12 md:p-24 rounded-3xl bg-gradient-to-br from-primary/20 via-black to-accent/20 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMGg4djhIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to Scale?</h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light">
              Join thousands of top creators who rely on emazingSM for consistent, high-quality growth. Initialize your terminal today.
            </p>
            
            <a 
              href="/app"
              className="inline-block px-10 py-5 bg-primary text-primary-foreground rounded-lg font-bold text-lg tracking-wide hover:bg-primary/90 transition-all box-glow"
            >
              ACCESS DASHBOARD
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
