import { motion } from "framer-motion";
import { SiInstagram, SiTiktok, SiYoutube, SiX } from "react-icons/si";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_50%)]" />
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-mono text-gray-300 tracking-wider">SYSTEM ONLINE</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
          >
            The Command Center for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-glow">
              Serious Creators
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 font-light max-w-2xl mx-auto"
          >
            Professional-grade social media growth. High-velocity engagement delivery, zero friction. Treat your social presence like the business it is.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="/app"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold tracking-wide hover:bg-primary/90 transition-all box-glow w-full sm:w-auto"
            >
              INITIALIZE TERMINAL
            </a>
            <a 
              href="#how-it-works"
              className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-lg font-bold tracking-wide hover:bg-white/10 transition-all w-full sm:w-auto"
            >
              VIEW PROTOCOL
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 pt-8 border-t border-white/5"
          >
            <p className="text-sm font-mono text-gray-500 mb-6">SUPPORTED PROTOCOLS</p>
            <div className="flex items-center justify-center gap-8 text-gray-400">
              <SiInstagram className="w-8 h-8 hover:text-white transition-colors" />
              <SiTiktok className="w-8 h-8 hover:text-white transition-colors" />
              <SiYoutube className="w-8 h-8 hover:text-white transition-colors" />
              <SiX className="w-7 h-7 hover:text-white transition-colors" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
