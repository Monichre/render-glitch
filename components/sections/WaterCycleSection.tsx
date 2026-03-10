"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { InfoCard } from "../ui/InfoCard"
import { SpatialLayer } from "../ui/SpatialLayer"

gsap.registerPlugin(ScrollTrigger)

const WATER_HOTSPOTS = [
  { id: "w1", x: 20, y: 30, z: 0.9, label: "Entanglement Node", value: "Bell test: PASS", pulse: true },
  { id: "w2", x: 38, y: 55, z: 0.5, label: "Non-local channel", value: "Latency: 0 ms" },
  { id: "w3", x: 14, y: 70, z: 0.3, label: "Shared buffer",     value: "Global state sync" },
]

export function WaterCycleSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".water-label", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      })

      gsap.to(".water-drop", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        },
        y: 100,
        opacity: 0,
        stagger: 0.1,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="global-state" className="relative min-h-screen flex items-center">
      <SpatialLayer
        imageUrl="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/abstract-particle-earth-visualization-4k.png-rzsmzo1F8KupUPLTYzhWuNCxQDz7oE.jpeg"
        imageAlt="Particle earth visualization"
        hotspots={WATER_HOTSPOTS}
        overlay="teal"
        parallaxStrength={22}
        tiltStrength={7}
      />
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="h-[40vh] lg:h-[60vh]" />
          <div>
            <InfoCard
              number="02"
              title="Global State Sync"
              subtitle="Non-Local Correlations"
              description="Entangled systems behave like two references pointing to the same underlying object in memory. Measure one, the other reflects it instantly — no matter the distance. Bell test experiments (Nobel 2022) confirm correlations that cannot be explained by local hidden variables."
              stats={[
                { label: "Sync", value: "Instant" },
                { label: "Distance", value: "∞" },
                { label: "Signal", value: "None" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="water-label section-label absolute top-1/4 left-6 lg:left-12">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80">Glitch 02</span>
          <div className="w-20 h-px bg-gradient-to-r from-primary/60 to-transparent" />
        </div>
      </div>

      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="water-drop absolute w-1 h-8 bg-gradient-to-b from-primary/30 to-transparent rounded-full pointer-events-none hidden lg:block"
          style={{
            left: `${15 + i * 8}%`,
            top: `${20 + i * 5}%`,
          }}
        />
      ))}
    </section>
  )
}
