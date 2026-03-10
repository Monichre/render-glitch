"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"
import { SpatialLayer } from "../ui/SpatialLayer"

gsap.registerPlugin(ScrollTrigger)

const ANOMALY_HOTSPOTS = [
  { id: "a1", x: 15, y: 20, z: 1.0, label: "Anomaly detected",  value: "Classification: Fringe", pulse: true },
  { id: "a2", x: 88, y: 35, z: 0.7, label: "Contour ridge",     value: "Elevation: 4288 m" },
  { id: "a3", x: 10, y: 75, z: 0.3, label: "Telemetry",         value: "30383 events logged" },
]

const FILTER_OPTIONS = ["All", "Documented", "Fringe", "Emergent"] as const
type FilterType = (typeof FILTER_OPTIONS)[number]

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
    title: "Remote Viewing",
    category: "Consciousness Hooks",
    description:
      "CIA Stargate Project documented cases of perception at distance. Ingo Swann, Pat Price, and others demonstrated anomalous cognition under controlled conditions. Consciousness accessing render data outside local viewport.",
    status: "Fringe",
    tags: ["psi", "stargate", "non-local-perception"],
  },
  {
    id: "06",
    title: "Morphic Resonance",
    category: "Field Memory Access",
    description:
      "Rupert Sheldrake's hypothesis that memory is inherent in nature. Non-local information transfer suggesting shared field access across sandbox instances. Habits of nature as cached render patterns.",
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
  {
    id: "09",
    title: "Quantum Consciousness",
    category: "Orchestrated Collapse",
    description:
      "Penrose-Hameroff Orch-OR theory: consciousness arises from quantum computations in microtubules. The observer isn't just reading render output—it's executing collapse operations at the hardware level.",
    status: "Emergent",
    tags: ["microtubules", "penrose", "orch-or", "collapse"],
  },
  {
    id: "10",
    title: "Global Consciousness Project",
    category: "Collective Field Effects",
    description:
      "Random number generators worldwide showing correlations during major global events (9/11, deaths of public figures). Mass attention creating measurable deviations—collective observers perturbing the render state.",
    status: "Fringe",
    tags: ["rng", "collective", "mass-attention", "correlation"],
  },
]

export function AnomaliesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("All")

  const filteredAnomalies = activeFilter === "All"
    ? anomalies
    : anomalies.filter((a) => a.status === activeFilter)

  const handleFilterChange = useCallback((filter: FilterType) => {
    if (filter === activeFilter) return
    setActiveFilter(filter)

    // Animate cards on filter change
    requestAnimationFrame(() => {
      if (!gridRef.current) return
      const cards = gridRef.current.querySelectorAll(".anomaly-card")
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
        }
      )
    })
  }, [activeFilter])

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
  }, [activeFilter])

  return (
    <section ref={sectionRef} id="anomalies" className="relative min-h-screen py-32">
      <SpatialLayer
        imageUrl="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/monochrome-3d-contour-mountain-landscape-4k-NFcOMgS8DFRwjKWpMnj634GQ6pzO3r.webp"
        imageAlt="3D contour mountain landscape"
        hotspots={ANOMALY_HOTSPOTS}
        overlay="dark"
        parallaxStrength={16}
        tiltStrength={6}
      />
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {FILTER_OPTIONS.map((filter) => {
            const count = filter === "All"
              ? anomalies.length
              : anomalies.filter((a) => a.status === filter).length
            return (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={cn(
                  "font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-300",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground"
                )}
              >
                {filter}
                <span className="ml-2 text-[9px] opacity-60">{String(count).padStart(2, "0")}</span>
              </button>
            )
          })}
        </div>

        {/* Anomalies Grid */}
        <div ref={gridRef} className="grid md:grid-cols-2 gap-6 max-w-6xl">
          {filteredAnomalies.map((anomaly) => (
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
                            ? "bg-warning/20 text-warning"
                            : "bg-fringe/20 text-fringe"
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
