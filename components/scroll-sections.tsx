"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { HeroSection } from "./sections/HeroSection"
import { LazyRenderSection } from "./sections/SolarPanelsSection"
import { WaterCycleSection } from "./sections/WaterCycleSection"
import { ClimateControlSection } from "./sections/ClimateControlSection"
import { CarbonStorageSection } from "./sections/CarbonStorageSection"
import { BiodiversitySection } from "./sections/BiodiversitySection"
import { AnomaliesSection } from "./sections/AnomaliesSection"
import { FooterSection } from "./sections/FooterSection"

gsap.registerPlugin(ScrollTrigger)

// Each section flies in from deep Z and recedes behind as we advance
const SECTIONS = [
  { id: "intro",        Component: HeroSection },
  { id: "lazy-render",  Component: LazyRenderSection },
  { id: "global-state", Component: WaterCycleSection },
  { id: "rootkit",      Component: ClimateControlSection },
  { id: "time-artifact",Component: CarbonStorageSection },
  { id: "consciousness",Component: BiodiversitySection },
  { id: "anomalies",    Component: AnomaliesSection },
  { id: "footer",       Component: FooterSection },
]

const TOTAL = SECTIONS.length

// How far back (in px) each layer sits in Z before being brought forward
const Z_DEPTH   = 800
const Z_RECEDE  = -400
const SCROLL_MULTIPLIER = 1.4   // viewport-heights per section

export function ScrollSections() {
  const scrollerRef  = useRef<HTMLDivElement>(null)
  const stageRef     = useRef<HTMLDivElement>(null)
  const layerRefs    = useRef<(HTMLDivElement | null)[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const progressRef  = useRef(0)

  // Expose depth progress for UIOverlay to consume
  const broadcastDepth = useCallback((raw: number) => {
    progressRef.current = raw
    const event = new CustomEvent("zdepth", { detail: { progress: raw, section: Math.round(raw * (TOTAL - 1)) } })
    window.dispatchEvent(event)
  }, [])

  useEffect(() => {
    // The scroll container is a tall empty div that provides scroll room.
    // Actual sections are fixed-position layers transformed in Z.
    const totalHeight = window.innerHeight * TOTAL * SCROLL_MULTIPLIER
    if (scrollerRef.current) {
      scrollerRef.current.style.height = `${totalHeight}px`
    }

    const onScroll = () => {
      const scrollY  = window.scrollY
      const maxScroll = totalHeight - window.innerHeight
      const raw      = Math.min(Math.max(scrollY / maxScroll, 0), 1)
      broadcastDepth(raw)

      const floatIdx = raw * (TOTAL - 1)
      setActiveIdx(Math.round(floatIdx))

      layerRefs.current.forEach((layer, i) => {
        if (!layer) return

        // Distance from this layer's "slot" in 0..1 space
        const slotProgress = i / (TOTAL - 1)
        const delta        = floatIdx - i   // negative = ahead, positive = behind

        let tz: number
        let opacity: number
        let scale: number
        let blur: number

        // Smooth easing function for natural depth perception
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
        const easeInCubic = (t: number) => t * t * t

        if (delta < -1) {
          // Far ahead — hidden deep in Z
          tz      = Z_DEPTH * Math.min(Math.abs(delta + 1), 2)
          opacity = 0
          scale   = 1 + 0.05 * Math.min(Math.abs(delta + 1), 2)
          blur    = 8
        } else if (delta < 0) {
          // Coming toward us — interpolate from deep Z to centre
          const t  = easeOutCubic(delta + 1)  // 0 (far) → 1 (current)
          tz       = Z_DEPTH * (1 - t)
          opacity  = t
          scale    = 1 + 0.05 * (1 - t)
          blur     = 8 * (1 - t)
        } else if (delta === 0) {
          // Current — fully present
          tz      = 0
          opacity = 1
          scale   = 1
          blur    = 0
        } else if (delta < 1) {
          // Receding — interpolate from centre to far back
          const t  = easeInCubic(delta)  // 0 (current) → 1 (far)
          tz       = Z_RECEDE * t
          opacity  = 1 - t * 0.85
          scale    = 1 - 0.03 * t
          blur     = 3 * t
        } else {
          // Far behind — nearly invisible
          tz      = Z_RECEDE
          opacity = 0.08
          scale   = 0.97
          blur    = 3
        }

        layer.style.transform       = `translateZ(${tz}px) scale(${scale})`
        layer.style.opacity         = String(opacity)
        layer.style.filter          = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none"
        layer.style.pointerEvents   = Math.round(floatIdx) === i ? "auto" : "none"
        layer.style.zIndex          = String(100 - Math.round(Math.abs(delta) * 10))
      })
    }

    // Lenis integration
    const timeout = setTimeout(() => {
      const lenis = (window as any).lenis
      if (lenis) {
        lenis.on("scroll", () => onScroll())
      }
    }, 150)

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()   // seed initial positions

    return () => {
      clearTimeout(timeout)
      window.removeEventListener("scroll", onScroll)
    }
  }, [broadcastDepth])

  return (
    <>
      {/* Tall phantom div that provides scroll distance */}
      <div ref={scrollerRef} className="w-full pointer-events-none" aria-hidden />

      {/* Fixed stage — all layers live here */}
      <div
        ref={stageRef}
        className="fixed inset-0 overflow-hidden"
        style={{ 
          perspective: "1200px",
          perspectiveOrigin: "50% 50%",
          transformStyle: "preserve-3d",
        }}
      >
        {SECTIONS.map(({ id, Component }, i) => (
          <div
            key={id}
            ref={(el) => { layerRefs.current[i] = el }}
            id={id}
            className="absolute inset-0 w-full h-full overflow-y-auto"
            style={{
              transformStyle : "preserve-3d",
              willChange     : "transform, opacity, filter",
              backfaceVisibility: "hidden",
              transition     : "none",
            }}
          >
            <Component />
          </div>
        ))}
      </div>
    </>
  )
}
