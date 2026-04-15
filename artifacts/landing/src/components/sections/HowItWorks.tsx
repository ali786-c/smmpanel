import { motion } from "framer-motion";
import { Terminal, Zap, Shield, Activity } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Terminal,
      title: "Initialize Account",
      desc: "Create your workspace and fund your account balance via secure payment gateways.",
      color: "text-blue-400"
    },
    {
      icon: Activity,
      title: "Configure Campaign",
      desc: "Select your target platform, input the destination URL, and define the growth parameters.",
      color: "text-purple-400"
    },
    {
      icon: Zap,
      title: "Execute Order",
      desc: "Our automated system processes your request instantly. Real-time delivery tracking begins.",
      color: "text-cyan-400"
    },
    {
      icon: Shield,
      title: "Monitor & Scale",
      desc: "Watch metrics climb in your dashboard. Analyze results and scale up your campaigns.",
      color: "text-green-400"
    }
  ];

  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-20">
          <h2 className="text-sm font-mono text-primary tracking-[0.2em] mb-4">EXECUTION PROTOCOL</h2>
          <h3 className="text-4xl md:text-5xl font-bold">Zero-Friction Workflow</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-xl bg-white/5 border border-white/10 relative group hover:bg-white/10 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-6 border border-white/10 ${step.color}`}>
                <step.icon size={24} />
              </div>
              <div className="text-5xl font-mono font-bold text-white/5 absolute top-6 right-6 select-none pointer-events-none">
                0{idx + 1}
              </div>
              <h4 className="text-xl font-bold mb-3">{step.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
