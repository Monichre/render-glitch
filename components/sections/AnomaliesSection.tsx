"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const anomalies = [
  {
    id: "01",
    title: "Double-Slit Variants",
    category: "Quantum Rendering Lag",
    description:
      "Particle behaves like a wave until measured, then collapses to particle. Delayed-choice quantum eraser shows retroactive collapse—as if the system waits to render reality.",
    status: "Documented",
    tags: ["measurement", "lazy-render", "retroactive"],
  },
  {
    id: "02",
    title: "Bell Inequality Violations",
    category: "Global State Sync",
    description:
      "Aspect/Clauser/Zeilinger entanglement tests confirm instant correlations across space with no communication channel. Two pixels drawing from the same graphics buffer.",
    status: "Documented",
    tags: ["non-locality", "entanglement", "correlation"],
  },
  {
    id: "03",
    title: "Wigner's Friend",
    category: "Nested Renders",
    description:
      "Observer-of-observer paradox: friend measures system, but from outside the lab+friend remain in superposition. Layered render calls with different frames per observer.",
    status: "Documented",
    tags: ["consciousness", "relative-collapse", "nested"],
  },
  {
    id: "04",
    title: "Quantum Zeno Effect",
    category: "Pause Button on Reality",
    description:
      "Rapidly measuring a system prevents it from evolving. Like hitting pause on a game engine by constantly refreshing the frame before it advances.",
    status: "Documented",
    tags: ["measurement", "evolution-freeze", "observation"],
  },
  {
    id: "05",
    title: "Remote Perception Claims",
    category: "Consciousness Hooks",
    description:
      "CIA Stargate Project remote viewing, presentiment studies. If consciousness is part of the rendering engine, these may be failed attempts at conscious wavefunction hacking.",
    status: "Fringe",
    tags: ["psi", "remote-viewing", "consciousness"],
  },
  {
    id: "06",
    title: "Morphic Resonance",
    category: "Consciousness Hooks",
    description:
      "Rupert Sheldrake's hypothesis that memory is inherent in nature. Non-local information transfer suggesting shared field access across sandbox instances.",
    status: "Fringe",
    tags: ["morphic-fields", "non-local", "memory"],
  },
  {
    id: "07",
    title: "Fine-Tuned Constants",
    category: "Macro Glitches",
    description:
      "Cosmic coincidences and anthropic principle observations. Suggestive of render optimization—constants dialed to support stable observer emergence.",
    status: "Documented",
    tags: ["cosmology", "anthropic", "fine-tuning"],
  },
  {
    id: "08",
    title: "Telepathy Tapes",
    category: "Consciousness Hooks",
    description:
      "Non-speaking autistic individuals demonstrating apparent telepathic communication. Debug logs hinting at deeper observer/reality coupling bypassing verbal interface.",
    status: "Emergent",
    tags: ["autism", "telepathy", "consciousness"],
  },
]

export function AnomaliesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate section label
      gsap.to(".anomaly-label", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      })

      // Stagger animate anomaly cards
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".anomaly-card")
        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            {
              y: 80,
              opacity: 0,
              scale: 0.9,
            },
            {
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "top 55%",
                scrub: 1,
              },
              y: 0,
              opacity: 1,
              scale: 1,
              ease: "power3.out",
            },
          )
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="anomalies" className="relative min-h-screen py-32">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mb-20 animate-text">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-primary/40" />
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary/60">
              Glitch Detection Protocol
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Known Anomalies</h2>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            Disciplined cataloging of observed glitches that betray the limits of the sandbox and hint at hidden
            infrastructure. Each anomaly represents telemetry leaks from the kernel layer—eyebrow-raising phenomena
            where the render engine reveals its architecture.
          </p>
        </div>

        {/* Anomalies Grid */}
        <div ref={gridRef} className="grid md:grid-cols-2 gap-6 max-w-6xl">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="anomaly-card group relative bg-black/40 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-all duration-300"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/60" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/60" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/60" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/60" />

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded">
                      {anomaly.id}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded ${
                        anomaly.status === "Documented"
                          ? "bg-primary/20 text-primary"
                          : anomaly.status === "Fringe"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {anomaly.status}
                    </span>
                  </div>
                </div>

                {/* Title and Category */}
                <h3 className="text-xl font-bold mb-1">{anomaly.title}</h3>
                <div className="text-sm text-primary/70 font-mono mb-3">{anomaly.category}</div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 text-pretty">{anomaly.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {anomaly.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono text-primary/60 bg-primary/5 px-2 py-1 rounded border border-primary/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Protocol Note */}
        <div className="mt-16 max-w-4xl p-6 border border-primary/20 rounded-lg bg-black/20">
          <h3 className="text-lg font-bold mb-3 text-primary">Detection Protocol</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary font-mono">01.</span>
              <span>Observe anomaly and document conditions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-mono">02.</span>
              <span>Verify instrumentation and rule out mundane explanations</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-mono">03.</span>
              <span>Classify glitch type (non-locality, temporal, consciousness-linked)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-mono">04.</span>
              <span>Compare against known physics predictions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-mono">05.</span>
              <span>Update hypotheses on sandbox/rootkit interactions and log event</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Section label */}
      <div className="anomaly-label section-label absolute top-1/4 right-6 lg:right-12">
        <div className="flex items-center gap-4">
          <div className="w-20 h-px bg-gradient-to-l from-primary/60 to-transparent" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80">Known Anomalies</span>
        </div>
      </div>
    </section>
  )
}
