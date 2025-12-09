"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { InfoCard } from "../ui/InfoCard"

gsap.registerPlugin(ScrollTrigger)

export function CarbonStorageSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".carbon-label", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
      })

      gsap.fromTo(
        ".root-line",
        { scaleY: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top center",
            end: "center center",
            scrub: true,
          },
          scaleY: 1,
          transformOrigin: "top",
          stagger: 0.1,
        },
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="time-artifact" className="relative min-h-screen flex items-center">
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="h-[40vh] lg:h-[60vh]" />
          <div>
            <InfoCard
              number="04"
              title="Time Artifact"
              subtitle="Events Log"
              description="Time is the events log of a reality state machine. Each quantum collapse writes a new row; the flow of time is the accumulation of events rather than a fundamental dimension. What we call history is just the trace of committed events — not continuous flow, but event-driven append operations."
              stats={[
                { label: "Type", value: "Log" },
                { label: "Operation", value: "Append" },
                { label: "Dimension", value: "Emergent" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="carbon-label section-label absolute top-1/4 left-6 lg:left-12">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80">Glitch 04</span>
          <div className="w-20 h-px bg-gradient-to-r from-primary/60 to-transparent" />
        </div>
      </div>

      {/* Root line decorations */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="root-line absolute w-px h-24 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none hidden lg:block"
          style={{
            left: `${70 + i * 5}%`,
            top: `${50 + i * 8}%`,
            transform: "scaleY(0)",
          }}
        />
      ))}
    </section>
  )
}
