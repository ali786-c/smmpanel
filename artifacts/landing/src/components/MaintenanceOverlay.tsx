import React from 'react';
import { Rocket, Construction, Clock } from "lucide-react";

const MaintenanceOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="relative z-10 container max-w-2xl px-4 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-background border border-primary/20 p-6 rounded-[2.5rem] shadow-2xl">
              <Rocket className="w-16 h-16 text-primary animate-bounce" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-heading font-black mb-6 tracking-tight">
          Wait a Minute... <br />
          <span className="text-primary">We're Upgrading!</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto">
          We are currently working on website maintenance to bring you a more powerful and seamless emazingSM experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="glass p-5 rounded-2xl flex items-center gap-4 border-l-4 border-primary">
            <Construction className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="text-sm font-bold">Planned Updates</p>
              <p className="text-xs text-muted-foreground">Performance & Stability</p>
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <Clock className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="text-sm font-bold">Coming Back Soon</p>
              <p className="text-xs text-muted-foreground">Est. 2-4 Hours</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground italic">
            Need urgent support? Contact us at <span className="text-primary font-bold">support@emazingsm.com</span>
          </p>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </div>
  );
};

export default MaintenanceOverlay;
