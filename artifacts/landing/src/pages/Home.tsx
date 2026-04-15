import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FeaturedTestimonials } from "@/components/sections/FeaturedTestimonials";
import { Testimonials } from "@/components/sections/Testimonials";
import { Trust } from "@/components/sections/Trust";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground scanlines overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter">
            emazing<span className="text-primary">SM</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Protocol</a>
            <a href="/app" className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md transition-colors box-glow">
              Access Terminal
            </a>
          </div>
        </div>
      </nav>
      
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <FeaturedTestimonials />
        <Testimonials />
        <Trust />
        <CTA />
      </main>

      <footer className="py-12 border-t border-white/5 text-center text-sm text-gray-500 font-mono bg-black/80">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center">
           <div className="font-bold text-xl tracking-tighter mb-4 text-white">
            emazing<span className="text-primary">SM</span>
          </div>
          <p>© {new Date().getFullYear()} emazingSM. All rights reserved.</p>
          <p className="mt-2 text-xs text-primary/70">SECURE END-TO-END ENCRYPTED CONNECTION</p>
        </div>
      </footer>
    </div>
  );
}
