"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const SpacetimeWarp = dynamic(
  () => import("@/components/webgl/SpacetimeWarp").then((m) => m.SpacetimeWarp),
  { ssr: false }
)

// ─── Slider ──────────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step, unit = "", onChange,
}: {
  label: string; value: number; min: number; max: number
  step: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[9px]" style={{ color: "#c8a84b" }}>
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-px appearance-none bg-border cursor-pointer"
        style={{ accentColor: "#c8a84b" }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpacetimePage() {
  const [warpSpeed,   setWarpSpeed]   = useState(0.6)
  const [gridDensity, setGridDensity] = useState(9.0)
  const [aberration,  setAberration]  = useState(0.4)
  const [planetScale, setPlanetScale] = useState(1.0)
  const [dustDensity, setDustDensity] = useState(0.7)
  const [showHUD,     setShowHUD]     = useState(true)

  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: "#080a06" }}>

      {/* Full-screen canvas */}
      <SpacetimeWarp
        warpSpeed={warpSpeed}
        gridDensity={gridDensity}
        aberration={aberration}
        planetScale={planetScale}
        dustDensity={dustDensity}
        className="absolute inset-0 w-full h-full"
      />

      {/* Top-left telemetry */}
      <div className="absolute top-5 left-6 pointer-events-none select-none" aria-hidden>
        <p className="font-mono text-[8px] tracking-[0.25em] uppercase"
           style={{ color: "rgba(200,168,75,0.45)" }}>
          00
        </p>
        <p className="font-mono text-[8px] tracking-[0.25em] uppercase mt-3"
           style={{ color: "rgba(200,168,75,0.35)" }}>
          00
        </p>
        <p className="font-mono text-[8px] tracking-[0.25em] uppercase mt-3"
           style={{ color: "rgba(200,168,75,0.35)" }}>
          00
        </p>
      </div>

      {/* Top marker */}
      <div className="absolute top-5 left-1/4 pointer-events-none select-none" aria-hidden>
        <p className="font-mono text-[8px] tracking-[0.2em]"
           style={{ color: "rgba(200,168,75,0.30)" }}>
          05
        </p>
      </div>

      {/* Centre telemetry cluster */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: "42%",
          left: "38%",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden
      >
        {[
          "SANDBOX: INITIALIZING",
          "KERNEL: HIDDEN",
          "SUPERPOSITION: ACTIVE",
          "COLLAPSE: DEFERRED",
          "OBSERVER: LINKED",
        ].map((line, i) => (
          <p
            key={i}
            className="font-mono text-[7px] tracking-wider whitespace-nowrap leading-relaxed"
            style={{ color: `rgba(200,168,75,${0.18 + i * 0.04})` }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Bottom-right label */}
      <div className="absolute bottom-6 right-6 pointer-events-none select-none text-right" aria-hidden>
        <p className="font-mono text-[8px] tracking-[0.3em] uppercase"
           style={{ color: "rgba(200,168,75,0.25)" }}>
          space — time
        </p>
        <p className="font-mono text-[7px] tracking-[0.2em]"
           style={{ color: "rgba(200,168,75,0.15)" }}>
          z-axis traversal / {warpSpeed.toFixed(2)}c
        </p>
      </div>

      {/* Bottom-centre controls */}
      {showHUD && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 backdrop-blur-sm p-5 flex flex-col gap-4"
          style={{ background: "rgba(8,10,6,0.75)", border: "1px solid rgba(200,168,75,0.15)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] tracking-[0.25em] uppercase"
                  style={{ color: "rgba(200,168,75,0.5)" }}>
              cartograph parameters
            </span>
            <button
              onClick={() => setShowHUD(false)}
              className="font-mono text-[8px] transition-opacity hover:opacity-100 opacity-40"
              style={{ color: "#c8a84b" }}
              aria-label="Hide controls"
            >
              [hide]
            </button>
          </div>

          <Slider label="warp speed"   value={warpSpeed}   min={0.1} max={2.0} step={0.01} unit="c" onChange={setWarpSpeed} />
          <Slider label="grid density" value={gridDensity} min={3.0} max={18.0} step={0.5}          onChange={setGridDensity} />
          <Slider label="planet scale" value={planetScale} min={0.4} max={1.8}  step={0.05}         onChange={setPlanetScale} />
          <Slider label="dust density" value={dustDensity} min={0.0} max={1.0}  step={0.01}         onChange={setDustDensity} />
          <Slider label="aberration"   value={aberration}  min={0.0} max={1.0}  step={0.01}         onChange={setAberration} />
        </div>
      )}

      {!showHUD && (
        <button
          onClick={() => setShowHUD(true)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-[0.25em] uppercase opacity-30 hover:opacity-70 transition-opacity"
          style={{ color: "#c8a84b" }}
        >
          [parameters]
        </button>
      )}
    </main>
  )
}
