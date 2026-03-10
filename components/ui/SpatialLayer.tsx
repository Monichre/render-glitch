"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface HotspotData {
  id: string
  x: number        // % from left
  y: number        // % from top
  z: number        // depth offset multiplier (1 = near, 0 = flat)
  label: string
  value?: string
  pulse?: boolean
}

interface SpatialLayerProps {
  imageUrl: string
  imageAlt?: string
  hotspots?: HotspotData[]
  parallaxStrength?: number   // 0–40 px
  tiltStrength?: number       // 0–20 deg
  overlay?: "dark" | "teal" | "amber" | "none"
  className?: string
  children?: ReactNode
}

const OVERLAY_STYLES = {
  dark:  "bg-gradient-to-b from-background/80 via-background/40 to-background/80",
  teal:  "bg-gradient-to-br from-background/90 via-primary/10 to-background/80",
  amber: "bg-gradient-to-br from-background/90 via-warning/10 to-background/80",
  none:  "",
}

export function SpatialLayer({
  imageUrl,
  imageAlt = "",
  hotspots = [],
  parallaxStrength = 24,
  tiltStrength = 10,
  overlay = "dark",
  className,
  children,
}: SpatialLayerProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const imageRef      = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const rafRef        = useRef<number>()
  const targetTilt    = useRef({ rx: 0, ry: 0 })
  const currentTilt   = useRef({ rx: 0, ry: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      const nx = (clientX - rect.left) / rect.width  - 0.5   // –0.5 … 0.5
      const ny = (clientY - rect.top)  / rect.height - 0.5

      targetTilt.current = {
        rx: -ny * tiltStrength,
        ry:  nx * tiltStrength,
      }

      setParallax({
        x: nx * parallaxStrength,
        y: ny * parallaxStrength,
      })
    }

    const onLeave = () => {
      targetTilt.current = { rx: 0, ry: 0 }
      setParallax({ x: 0, y: 0 })
    }

    const loop = () => {
      const { rx: trx, ry: try_ } = targetTilt.current
      const { rx: crx, ry: cry } = currentTilt.current
      const nrx = crx + (trx - crx) * 0.06
      const nry = cry + (try_ - cry) * 0.06
      currentTilt.current = { rx: nrx, ry: nry }
      setTilt({ rx: nrx, ry: nry })
      rafRef.current = requestAnimationFrame(loop)
    }

    const el = containerRef.current
    el?.addEventListener("mousemove", onMove, { passive: true })
    el?.addEventListener("touchmove", onMove, { passive: true })
    el?.addEventListener("mouseleave", onLeave)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      el?.removeEventListener("mousemove", onMove)
      el?.removeEventListener("touchmove", onMove)
      el?.removeEventListener("mouseleave", onLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [tiltStrength, parallaxStrength])

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ perspective: "1200px" }}
      aria-hidden
    >
      {/* 3D-tilting image plane */}
      <div
        ref={imageRef}
        className="absolute inset-[-5%] w-[110%] h-[110%]"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translate(${parallax.x * -0.4}px, ${parallax.y * -0.4}px)`,
          transformStyle: "preserve-3d",
          willChange: "transform",
          transition: "none",
        }}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`,
            willChange: "transform",
          }}
          draggable={false}
        />

        {/* Overlay */}
        {overlay !== "none" && (
          <div className={cn("absolute inset-0", OVERLAY_STYLES[overlay])} />
        )}
      </div>

      {/* Hotspot markers — float at different Z depths via translateZ */}
      {hotspots.map((h) => (
        <div
          key={h.id}
          className="absolute pointer-events-auto"
          style={{
            left: `${h.x}%`,
            top:  `${h.y}%`,
            transform: `translateZ(${h.z * 60}px) translate(${parallax.x * h.z * 0.8}px, ${parallax.y * h.z * 0.8}px)`,
            willChange: "transform",
            zIndex: 20,
          }}
        >
          {/* Pulse ring */}
          {h.pulse && (
            <span className="absolute inset-0 -m-2 rounded-full border border-primary/40 animate-ping" />
          )}

          {/* Dot */}
          <button
            className="relative w-3 h-3 rounded-full bg-primary/80 border border-primary shadow-[0_0_8px_2px] shadow-primary/40 hover:scale-150 transition-transform duration-200 focus:outline-none"
            onMouseEnter={() => setActiveHotspot(h.id)}
            onMouseLeave={() => setActiveHotspot(null)}
            onFocus={() => setActiveHotspot(h.id)}
            onBlur={() => setActiveHotspot(null)}
            aria-label={h.label}
          />

          {/* Tooltip */}
          {activeHotspot === h.id && (
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 border border-primary/30 backdrop-blur-sm px-3 py-1.5 rounded pointer-events-none"
              style={{ zIndex: 30 }}
            >
              <p className="font-mono text-[9px] tracking-widest uppercase text-primary">{h.label}</p>
              {h.value && (
                <p className="font-mono text-[10px] text-foreground mt-0.5">{h.value}</p>
              )}
              {/* Connector line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-px h-2 bg-primary/40" />
            </div>
          )}
        </div>
      ))}

      {children}
    </div>
  )
}
