"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const SpacetimeWarp = dynamic(
  () => import("@/components/webgl/SpacetimeWarp").then((m) => m.SpacetimeWarp),
  { ssr: false }
)

// ─── Slider ──────────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[9px] text-primary">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-px appearance-none bg-border accent-primary cursor-pointer"
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpacetimePage() {
  const [warpSpeed,   setWarpSpeed]   = useState(1.0)
  const [gridDensity, setGridDensity] = useState(8.0)
  const [aberration,  setAberration]  = useState(0.6)
  const [showHUD,     setShowHUD]     = useState(true)

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-background">

      {/* Full-screen canvas */}
      <SpacetimeWarp
        warpSpeed={warpSpeed}
        gridDensity={gridDensity}
        aberration={aberration}
        className="absolute inset-0 w-full h-full"
      />

      {/* Central label */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
        aria-hidden
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-primary/50">
            z-axis traversal
          </span>
          <h1 className="font-mono text-[11px] tracking-[0.5em] uppercase text-foreground/20">
            space — time
          </h1>
          <div className="w-16 h-px bg-primary/20" />
          <span className="font-mono text-[8px] tracking-widest text-muted-foreground/30">
            {warpSpeed.toFixed(2)}c
          </span>
        </div>
      </div>

      {/* Corner coordinates */}
      <div className="absolute top-4 left-4 pointer-events-none" aria-hidden>
        <p className="font-mono text-[8px] text-muted-foreground/40 tracking-wider">
          T+{new Date().toISOString().substring(11, 19)}
        </p>
        <p className="font-mono text-[8px] text-muted-foreground/30 tracking-wider">
          WARP / {warpSpeed.toFixed(2)} /
        </p>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-none" aria-hidden>
        <p className="font-mono text-[8px] text-right text-muted-foreground/30 tracking-wider">
          SPACE-TIME CONTINUUM
        </p>
        <p className="font-mono text-[8px] text-right text-primary/30 tracking-wider">
          RENDER GLITCH / OBSERVER
        </p>
      </div>

      {/* Controls HUD */}
      {showHUD && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 bg-card/60 border border-border/40 backdrop-blur-sm p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
              warp parameters
            </span>
            <button
              onClick={() => setShowHUD(false)}
              className="font-mono text-[9px] text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label="Hide controls"
            >
              [hide]
            </button>
          </div>

          <Slider
            label="warp speed"
            value={warpSpeed}
            min={0.2}
            max={3.0}
            step={0.01}
            unit="c"
            onChange={setWarpSpeed}
          />
          <Slider
            label="grid density"
            value={gridDensity}
            min={2.0}
            max={20.0}
            step={0.5}
            onChange={setGridDensity}
          />
          <Slider
            label="aberration"
            value={aberration}
            min={0.0}
            max={1.0}
            step={0.01}
            onChange={setAberration}
          />
        </div>
      )}

      {/* Re-show button */}
      {!showHUD && (
        <button
          onClick={() => setShowHUD(true)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-widest uppercase text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          [controls]
        </button>
      )}
    </main>
  )
}
