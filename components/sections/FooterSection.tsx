"use client"

import { TechLabel } from "../ui/TechLabel"

export function FooterSection() {
  return (
    <footer className="relative min-h-[50vh] flex items-end pb-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-8">
          <div className="py-8 border-t border-border/20">
            <blockquote className="text-center max-w-2xl mx-auto">
              <p className="text-sm md:text-base text-muted-foreground/70 italic leading-relaxed">
                "The most merciful thing in the world, I think, is the inability of the human mind to correlate all its
                contents."
              </p>
              <cite className="block mt-4 font-mono text-[10px] text-primary/60 tracking-wider">
                — H.P. LOVECRAFT, THE CALL OF CTHULHU
              </cite>
            </blockquote>
          </div>

          {/* Main footer content */}
          <div className="grid md:grid-cols-3 gap-8 py-12 border-t border-border/30">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-7 h-7 border border-primary/60 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary" />
                  <div className="absolute -top-px -left-px w-1.5 h-1.5 border-l border-t border-primary" />
                  <div className="absolute -top-px -right-px w-1.5 h-1.5 border-r border-t border-primary" />
                  <div className="absolute -bottom-px -left-px w-1.5 h-1.5 border-l border-b border-primary" />
                  <div className="absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b border-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground/90">
                    Render Glitches
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground">ROOTKIT REALITY</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                An ontological framework for interpreting anomalies in physics, consciousness, and the nature of reality
                as a sandboxed simulation.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <TechLabel variant="muted">Core Concepts</TechLabel>
              <div className="flex flex-wrap gap-2">
                {["Lazy Render", "Entanglement", "Rootkit", "Time=Log", "Consciousness", "Observer"].map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-secondary/30 border border-border/40 font-mono text-[9px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TechLabel variant="muted">References</TechLabel>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Bell Tests (Aspect, Clauser, Zeilinger)</p>
                <p>Donald Hoffman — Interface Theory</p>
                <p>Wheeler — Participatory Universe</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-mono text-muted-foreground/50 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary/30" />
              <span>FRAMEWORK v1.0</span>
            </div>
            <span>AXIOM 1: TIME IS THE EVENTS LOG</span>
            <div className="flex items-center gap-2">
              <span>STATUS: OBSERVING</span>
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
