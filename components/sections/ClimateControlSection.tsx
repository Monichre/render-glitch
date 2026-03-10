"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { InfoCard } from "../ui/InfoCard"
import { SpatialLayer } from "../ui/SpatialLayer"

gsap.registerPlugin(ScrollTrigger)

const ROOTKIT_HOTSPOTS = [
  { id: "r1", x: 66, y: 25, z: 1.0, label: "Kernel boundary",  value: "Access: DENIED",  pulse: true },
  { id: "r2", x: 80, y: 48, z: 0.5, label: "Sandbox interface", value: "Physics layer" },
  { id: "r3", x: 70, y: 68, z: 0.2, label: "Effect leak",       value: "Non-locality observed" },
]

export function ClimateControlSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".climate-label", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      })

      gsap.to(".temp-wave", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        },
        scaleX: 1.5,
        opacity: 0.3,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="rootkit" className="relative min-h-screen flex items-center">
      <SpatialLayer
        imageUrl="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/abstract-neural-network-brain-visualization-4k.png-0R3NUU8mYtRvD4StrWfcGPj4h0urRx.jpeg"
        imageAlt="Neural network brain visualization"
        hotspots={ROOTKIT_HOTSPOTS}
        overlay="dark"
        parallaxStrength={18}
        tiltStrength={10}
      />
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <InfoCard
              number="03"
              title="Rootkit Paradigm"
              subtitle="Sandbox vs Kernel"
              description="Physics models the sandbox; the kernel code remains unreachable. We can infer its effects — non-locality, indeterminacy, anomalous cognition — but we cannot decompile it from inside. The deep conflicts between relativity and quantum mechanics may be symptoms of staring at different abstraction layers without source-level access."
              stats={[
                { label: "Access", value: "Denied" },
                { label: "Observable", value: "Effects" },
                { label: "Source", value: "Hidden" },
              ]}
            />
          </div>
          <div className="order-1 lg:order-2 h-[40vh] lg:h-[60vh]" />
        </div>
      </div>

      <div className="climate-label section-label absolute top-1/4 right-6 lg:right-12">
        <div className="flex items-center gap-4">
          <div className="w-20 h-px bg-gradient-to-l from-primary/60 to-transparent" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80">Glitch 03</span>
        </div>
      </div>

      {/* Temperature wave decoration */}
      <div
        className="temp-wave absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none"
        style={{ transform: "scaleX(1)" }}
      />
    </section>
  )
}
