import { motion } from "framer-motion";
import { Hammer, Rocket, Shield, Lock } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05),transparent_50%)]" />

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8 }}
           className="mb-12 inline-block"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-3xl flex items-center justify-center box-glow rotate-12 transition-transform hover:rotate-0 duration-500">
              <Hammer className="w-12 h-12 text-white" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl"
            >
              <Rocket className="w-6 h-6 text-accent" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
        >
          SYSTEM <br /> UPGRADE
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 mb-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer" />
          
          <p className="text-xl text-gray-400 font-light leading-relaxed mb-6">
            We are currently optimizing our servers and deploying new high-velocity growth protocols. 
            emazingsm.com will be back online shortly with enhanced performance.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <Shield className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-bold text-white">Secure</p>
                <p className="text-xs text-gray-500">Data integrity preserved</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <Lock className="w-5 h-5 text-accent mt-1" />
              <div>
                <p className="text-sm font-bold text-white">Private</p>
                <p className="text-xs text-gray-500">SSL protocols active</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-500 tracking-widest">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            ESTIMATED COMPLETION: CALCULATING...
          </div>
          
          <div className="flex justify-center gap-6 mt-8">
             <div className="w-12 h-1 border-b border-white/10" />
             <div className="w-12 h-1 border-b border-white/10" />
             <div className="w-12 h-1 border-b border-white/10" />
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-sm font-mono text-gray-600 tracking-tighter"
      >
        EMAZINGSM.COM CORE ENGINE v2.4.0
      </motion.div>
    </div>
  );
};

export default Maintenance;
