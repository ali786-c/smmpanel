import { Shield, Lock, Server, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function Trust() {
  return (
    <section className="py-32 bg-black/50 border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-mono text-primary tracking-[0.2em] mb-4">ENTERPRISE SECURITY</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6">Built for Scale.<br/>Secured by Default.</h3>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              We understand that your social accounts are critical business assets. Our infrastructure is designed with security-first principles, ensuring your accounts remain safe while accelerating growth.
            </p>
            
            <ul className="space-y-4">
              {[
                "Zero password requirements. We never ask for your login credentials.",
                "End-to-end encrypted API endpoints and secure payment gateways.",
                "Smart velocity throttling to mimic natural, organic growth patterns.",
                "24/7 automated network monitoring and service health checks."
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <Lock className="w-10 h-10 text-primary mb-6" />
              <h4 className="text-xl font-bold mb-2">No Passwords</h4>
              <p className="text-gray-400 text-sm">We only need your public username or post URL to deliver services.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm sm:translate-y-8"
            >
              <Shield className="w-10 h-10 text-accent mb-6" />
              <h4 className="text-xl font-bold mb-2">Safe Velocity</h4>
              <p className="text-gray-400 text-sm">Proprietary algorithms pace delivery to match platform safety limits.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <Server className="w-10 h-10 text-primary mb-6" />
              <h4 className="text-xl font-bold mb-2">99.9% Uptime</h4>
              <p className="text-gray-400 text-sm">Redundant server clusters ensure your orders process instantly.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
