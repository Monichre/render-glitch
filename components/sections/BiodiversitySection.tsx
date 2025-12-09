"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { InfoCard } from "../ui/InfoCard"

gsap.registerPlugin(ScrollTrigger)

export function BiodiversitySection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".bio-label", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      })

      gsap.to(".bio-dot", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        },
        y: -20,
        x: "random(-10, 10)",
        opacity: 0.8,
        stagger: 0.05,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="consciousness" className="relative min-h-screen flex items-center">
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <InfoCard
              number="05"
              title="Consciousness Runtime"
              subtitle="The Observer Process"
              description="Consciousness may be the runtime process that interprets collapses into coherent experience. Identity is a persistent session. The observer both produces and consumes the events log — embedded in the sandbox yet somehow indispensable to rendering. The headset metaphor: somebody crammed awareness into a skinsuit, symlinked to sandbox resources while the root directory stays hidden."
              stats={[
                { label: "Role", value: "Runtime" },
                { label: "Session", value: "Identity" },
                { label: "Access", value: "Symlink" },
              ]}
            />
          </div>
          <div className="order-1 lg:order-2 h-[40vh] lg:h-[60vh]" />
        </div>
      </div>

      {/* Section label */}
      <div className="bio-label section-label absolute top-1/4 right-6 lg:right-12">
        <div className="flex items-center gap-4">
          <div className="w-20 h-px bg-gradient-to-l from-primary/60 to-transparent" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80">Glitch 05</span>
        </div>
      </div>

      {/* Biodiversity dots */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="bio-dot absolute w-1 h-1 rounded-full bg-primary/40 pointer-events-none hidden lg:block"
          style={{
            left: `${10 + Math.random() * 30}%`,
            top: `${20 + Math.random() * 60}%`,
            opacity: 0.3,
          }}
        />
      ))}
    </section>
  )
}
