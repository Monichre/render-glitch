"use client"

import { useEffect, useRef, useState } from "react"
import { TechLabel } from "../ui/TechLabel"
import { GlitchText } from "../ui/GlitchText"
import { SpatialLayer } from "../ui/SpatialLayer"

const HERO_HOTSPOTS = [
  { id: "h1", x: 72, y: 38, z: 0.9, label: "Particle Horizon",  value: "Z = −∞",   pulse: true },
  { id: "h2", x: 55, y: 62, z: 0.5, label: "Observer",          value: "Runtime active" },
  { id: "h3", x: 28, y: 44, z: 0.3, label: "Sandbox Layer",     value: "KERNEL: HIDDEN" },
]

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const lastX = useRef(0)
  const velocity = useRef(0)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    let animationId: number

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      lastX.current = e.clientX
      velocity.current = 0
    }

    const handleTouchStart = (e: TouchEvent) => {
      setIsDragging(true)
      lastX.current = e.touches[0].clientX
      velocity.current = 0
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - lastX.current
      lastX.current = e.clientX
      velocity.current = deltaX * 0.3
      const webglScene = (window as any).webglScene
      if (webglScene) {
        const currentRotation = webglScene.getTreeRotation()
        const newRotation = currentRotation + deltaX * 0.008
        webglScene.setTreeRotation(newRotation)
        setRotation(newRotation)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const deltaX = e.touches[0].clientX - lastX.current
      lastX.current = e.touches[0].clientX
      velocity.current = deltaX * 0.3
      const webglScene = (window as any).webglScene
      if (webglScene) {
        const currentRotation = webglScene.getTreeRotation()
        const newRotation = currentRotation + deltaX * 0.008
        webglScene.setTreeRotation(newRotation)
        setRotation(newRotation)
      }
    }

    const handleMouseUp = () => setIsDragging(false)
    const handleTouchEnd = () => setIsDragging(false)

    const applyMomentum = () => {
      if (!isDragging && Math.abs(velocity.current) > 0.01) {
        const webglScene = (window as any).webglScene
        if (webglScene) {
          const currentRotation = webglScene.getTreeRotation()
          webglScene.setTreeRotation(currentRotation + velocity.current * 0.02)
        }
        velocity.current *= 0.95
      }
      animationId = requestAnimationFrame(applyMomentum)
    }

    animationId = requestAnimationFrame(applyMomentum)

    const section = sectionRef.current
    if (section) {
      section.addEventListener("mousedown", handleMouseDown)
      section.addEventListener("touchstart", handleTouchStart, { passive: true })
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("touchmove", handleTouchMove, { passive: true })
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      cancelAnimationFrame(animationId)
      if (section) {
        section.removeEventListener("mousedown", handleMouseDown)
        section.removeEventListener("touchstart", handleTouchStart)
      }
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging])

  return (
    <section
      ref={sectionRef}
      id="intro"
      className="relative min-h-screen flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-pan-y"
    >
      <SpatialLayer
        imageUrl="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/abstract-star-speckled-black-texture-4k-uBf8Oq7eSX9FXKJllUkJkBnNXWFjLH.webp"
        imageAlt="Star field background"
        hotspots={HERO_HOTSPOTS}
        overlay="teal"
        parallaxStrength={28}
        tiltStrength={8}
      />
      <div className="text-center z-10 pointer-events-none px-6">
        <div className="mb-6 overflow-hidden flex justify-center">
          <TechLabel variant="accent" className="animate-text">
            Ontological Framework
          </TechLabel>
        </div>

        <div className="overflow-hidden mb-2">
          <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-extralight tracking-tight animate-text text-balance">
            Render
          </h1>
        </div>
        <div className="overflow-hidden mb-8">
          <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-extralight tracking-tight animate-text">
            <GlitchText className="text-primary text-glow">Glitches</GlitchText>
          </h1>
        </div>

        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto font-mono tracking-wide animate-text leading-relaxed text-pretty">
          Reality is a sandbox running on hidden rootkit code — particles are render artifacts, time a compiler glitch,
          and consciousness the runtime process
        </p>

        <div className="flex items-center justify-center gap-8 mt-12 animate-text">
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl text-foreground tabular-nums">05</span>
            <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">Glitch Types</span>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl text-foreground tabular-nums">∅</span>
            <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">Root Access</span>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl text-primary tabular-nums">∞</span>
            <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">Superposition</span>
          </div>
        </div>
      </div>

      {/* Drag instruction */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-4 text-muted-foreground/60">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Drag to rotate</span>
            <span className="font-mono text-[8px] text-primary/60">{((rotation * 180) / Math.PI).toFixed(0)}°</span>
          </div>
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-muted-foreground/50">
          Scroll to explore
        </span>
        <div className="relative w-px h-12">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-transparent" />
          <div
            className="absolute top-0 w-px h-3 bg-primary"
            style={{ animation: "bounce 1.5s ease-in-out infinite" }}
          />
        </div>
      </div>

      <div className="absolute top-24 left-6 font-mono text-[9px] text-muted-foreground/40 tracking-wider hidden lg:flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span>LAYER: SANDBOX</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span>KERNEL: HIDDEN</span>
        </div>
      </div>

      <div className="absolute top-24 right-6 font-mono text-[9px] text-muted-foreground/40 tracking-wider hidden lg:flex flex-col gap-2 text-right">
        <div className="flex items-center gap-2 justify-end">
          <span>RENDER: ACTIVE</span>
          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span>OBSERVER: PRESENT</span>
          <span className="w-1 h-1 rounded-full bg-primary/40" />
        </div>
      </div>
    </section>
  )
}
