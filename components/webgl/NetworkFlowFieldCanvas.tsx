"use client"

/**
 * NetworkFlowFieldCanvas.tsx
 *
 * Self-contained React component that mounts the NetworkFlowField sketch
 * into its own isolated Three.js renderer — no dependency on WebGLScene.
 *
 * Props:
 *   rows      - grid rows     (default 32, matches original sketch)
 *   columns   - grid columns  (default 16, matches original sketch)
 *   className - optional Tailwind / CSS class applied to the container div
 *   showHUD   - render the overlay HUD with angle legend + rerandomize button
 */

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { NetworkFlowField } from "@/lib/webgl/NetworkFlowField"
import { NETWORK_ANGLES } from "@/lib/webgl/shaders/NetworkFlowFieldShader"

const ANGLE_LABELS = ["0°", "90°", "180°", "270°", "360°"]
const ANGLE_COLORS = [
  "oklch(0.75 0.15 180)",   // teal
  "oklch(0.70 0.18 200)",   // cyan
  "oklch(0.70 0.12 200)",   // accent
  "oklch(0.75 0.18 80)",    // amber
  "oklch(0.75 0.15 180)",   // teal (same as 0°)
]

interface NetworkFlowFieldCanvasProps {
  rows?:      number
  columns?:   number
  className?: string
  showHUD?:   boolean
}

export function NetworkFlowFieldCanvas({
  rows     = 32,
  columns  = 16,
  className = "",
  showHUD   = true,
}: NetworkFlowFieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const fieldRef     = useRef<NetworkFlowField | null>(null)
  const rafRef       = useRef<number>(0)
  const clockRef     = useRef(new THREE.Clock())
  const [fps, setFps]       = useState(0)
  const [ready, setReady]   = useState(false)
  const fpsAccRef = useRef({ frames: 0, last: performance.now() })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias:       true,
      alpha:           true,
      powerPreference: "high-performance",
    })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // --- Scene + orthographic camera (matches original 2D flow field) ---
    const scene  = new THREE.Scene()
    const aspect = w / h
    const camera = new THREE.OrthographicCamera(
      -8 * aspect, 8 * aspect,   // left, right
       4,          -4,           // top, bottom
       0.1,        100,
    )
    camera.position.z = 10

    // --- Flow field ---
    const field = new NetworkFlowField(scene, rows, columns)
    fieldRef.current = field

    setReady(true)

    // --- Render loop ---
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)

      const elapsed = clockRef.current.getElapsedTime()
      field.update(elapsed)
      renderer.render(scene, camera)

      // FPS counter
      const acc = fpsAccRef.current
      acc.frames++
      const now = performance.now()
      if (now - acc.last >= 1000) {
        setFps(acc.frames)
        acc.frames = 0
        acc.last   = now
      }
    }
    animate()

    // --- Resize ---
    const onResize = () => {
      const nw = container.clientWidth
      const nh = container.clientHeight
      renderer.setSize(nw, nh)
      const na = nw / nh
      camera.left   = -8 * na
      camera.right  =  8 * na
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      field.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      rendererRef.current = null
      fieldRef.current    = null
    }
  }, [rows, columns])

  const handleRerandomize = useCallback(() => {
    fieldRef.current?.rerandomize()
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Three.js canvas mount point */}
      <div ref={containerRef} className="w-full h-full" />

      {/* HUD overlay */}
      {showHUD && ready && (
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
          {/* Legend */}
          <div className="bg-background/70 backdrop-blur-sm border border-border/30 px-3 py-2 flex flex-col gap-1">
            <p className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground mb-1">
              Flow angles
            </p>
            {ANGLE_LABELS.map((label, i) => (
              <div key={label + i} className="flex items-center gap-2">
                <div
                  className="w-5 h-px"
                  style={{ background: ANGLE_COLORS[i] }}
                />
                <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Top-right stats + controls */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            {/* FPS */}
            <div className="bg-background/70 backdrop-blur-sm border border-border/30 px-3 py-1 font-mono text-[9px] text-muted-foreground tracking-widest">
              {fps} FPS
            </div>
            {/* Grid info */}
            <div className="bg-background/70 backdrop-blur-sm border border-border/30 px-3 py-1 font-mono text-[9px] text-muted-foreground tracking-widest">
              {rows} × {columns} &nbsp;|&nbsp; {rows * columns} CELLS
            </div>
            {/* Rerandomize */}
            <button
              onClick={handleRerandomize}
              className="bg-background/70 backdrop-blur-sm border border-primary/30 hover:border-primary/60 px-3 py-1 font-mono text-[9px] text-primary tracking-widest uppercase transition-colors duration-200"
            >
              Rerandomize
            </button>
          </div>
        </div>
      )}

      {/* Bottom label */}
      {showHUD && ready && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground/50">
            Network Flow Field &nbsp;/&nbsp; hash(instanceIndex) mod 5
          </p>
        </div>
      )}
    </div>
  )
}
