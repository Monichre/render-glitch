"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { InfoCard } from "../ui/InfoCard"
import { SpatialLayer } from "../ui/SpatialLayer"

gsap.registerPlugin(ScrollTrigger)

const LAZY_HOTSPOTS = [
  { id: "l1", x: 62, y: 28, z: 1.0, label: "Superposition",    value: "ψ = unresolved",  pulse: true },
  { id: "l2", x: 78, y: 50, z: 0.6, label: "Collapse trigger",  value: "render() called" },
  { id: "l3", x: 55, y: 72, z: 0.2, label: "Deferred branch",   value: "∞ states pending" },
]

export function LazyRenderSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".solar-label", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="lazy-render" className="relative min-h-screen flex items-center">
      <SpatialLayer
        imageUrl="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/abstract-dotted-topographic-waves-on-black-background-4k-Oa0p3R5UnnLYZIWkfah36751e13jYs.webp"
        imageAlt="Dotted topographic waves"
        hotspots={LAZY_HOTSPOTS}
        overlay="teal"
        parallaxStrength={20}
        tiltStrength={9}
      />
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <InfoCard
              number="01"
              title="Lazy Render Engine"
              subtitle="Deferred Execution"
              description="Reality economizes computation by collapsing superpositions only when queried. Superposition functions as deferred execution — nothing 'collapses' until you call it. The universe is the kind of engineer you want on your team: why run expensive processing if no one's looking?"
              stats={[
                { label: "State", value: "ψ" },
                { label: "Collapse", value: "render()" },
                { label: "Until Query", value: "∞ branches" },
              ]}
            />
          </div>
          <div className="order-1 lg:order-2 h-[40vh] lg:h-[60vh]" />
        </div>
      </div>

      <div className="solar-label section-label absolute top-1/4 right-6 lg:right-12">
        <div className="flex items-center gap-4">
          <div className="w-20 h-px bg-gradient-to-l from-primary/60 to-transparent" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80">Glitch 01</span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-primary/10 rounded-full pointer-events-none hidden lg:block" />
      <div className="absolute bottom-1/4 right-1/3 w-16 h-16 border border-primary/5 pointer-events-none hidden lg:block" />
    </section>
  )
}
