"use client"

/**
 * SpectrumHUD.tsx
 * Canvas-based f(α) and τ(q) overlay (240×160px).
 * Reads AnalyzerState from the scene and redraws at 10 FPS.
 */

import { useEffect, useRef } from "react"
import type { SpectrumCurve, SpectrumPoint } from "@/lib/multifractal/MultifractalEngine"
import type { AnalyzerState } from "@/lib/multifractal/SpectrumAnalyzer"
import { cn } from "@/lib/utils"

const W = 240
const H = 160
const PAD = 20

type HUDTab = "fAlpha" | "tau"

interface SpectrumHUDProps {
  state:     AnalyzerState | null
  activeTab: HUDTab
  onTabChange: (tab: HUDTab) => void
  className?: string
}

const drawCurve = (
  ctx:    CanvasRenderingContext2D,
  points: SpectrumPoint[],
  xKey:   "alpha" | "q",
  yKey:   "fAlpha" | "tau",
  qOrder: number,
  alphaBar?: number,
) => {
  if (!points.length) return

  const xs = points.map(p => p[xKey])
  const ys = points.map(p => p[yKey])

  const xMin = Math.min(...xs); const xMax = Math.max(...xs)
  const yMin = Math.min(...ys); const yMax = Math.max(...ys)

  const xRange = xMax - xMin || 1
  const yRange = yMax - yMin || 1

  const toCanvasX = (v: number) => PAD + ((v - xMin) / xRange) * (W - PAD * 2)
  const toCanvasY = (v: number) => H - PAD - ((v - yMin) / yRange) * (H - PAD * 2)

  // Grid lines
  ctx.strokeStyle = "rgba(64,255,170,0.08)"
  ctx.lineWidth   = 0.5
  for (let g = 0; g < 4; g++) {
    const gx = PAD + (g / 3) * (W - PAD * 2)
    const gy = PAD + (g / 3) * (H - PAD * 2)
    ctx.beginPath(); ctx.moveTo(gx, PAD); ctx.lineTo(gx, H - PAD); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD, gy); ctx.lineTo(W - PAD, gy); ctx.stroke()
  }

  // Curve
  const gradient = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
  gradient.addColorStop(0,   "rgba(64,255,170,0.4)")
  gradient.addColorStop(0.5, "rgba(100,200,255,0.9)")
  gradient.addColorStop(1,   "rgba(255,160,80,0.4)")

  ctx.beginPath()
  ctx.strokeStyle = gradient
  ctx.lineWidth   = 1.5
  ctx.shadowColor = "rgba(64,255,170,0.4)"
  ctx.shadowBlur  = 4

  points.forEach((pt, i) => {
    const cx = toCanvasX(pt[xKey])
    const cy = toCanvasY(pt[yKey])
    if (i === 0) ctx.moveTo(cx, cy)
    else         ctx.lineTo(cx, cy)
  })
  ctx.stroke()
  ctx.shadowBlur = 0

  // α-bar vertical line (peak most probable Hölder)
  if (alphaBar !== undefined && xKey === "alpha") {
    const barX = toCanvasX(alphaBar)
    ctx.strokeStyle = "rgba(255,200,60,0.5)"
    ctx.lineWidth   = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(barX, PAD); ctx.lineTo(barX, H - PAD); ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle    = "rgba(255,200,60,0.8)"
    ctx.font         = "8px monospace"
    ctx.fillText("ᾱ", barX + 2, PAD + 8)
  }

  // Current q-order crosshair
  const crosshairPt = points.reduce((best, p) =>
    Math.abs(p.q - qOrder) < Math.abs(best.q - qOrder) ? p : best, points[0])
  const cx2 = toCanvasX(crosshairPt[xKey])
  const cy2 = toCanvasY(crosshairPt[yKey])

  ctx.strokeStyle = "rgba(255,255,255,0.4)"
  ctx.lineWidth   = 0.5
  ctx.setLineDash([2, 2])
  ctx.beginPath(); ctx.moveTo(cx2, PAD); ctx.lineTo(cx2, H - PAD); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PAD, cy2); ctx.lineTo(W - PAD, cy2); ctx.stroke()
  ctx.setLineDash([])

  // Dot at crosshair
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.beginPath(); ctx.arc(cx2, cy2, 2.5, 0, Math.PI * 2); ctx.fill()

  // Axis labels
  ctx.fillStyle  = "rgba(64,255,170,0.5)"
  ctx.font       = "7px monospace"
  ctx.fillText(xMax.toFixed(1), W - PAD - 6, H - 6)
  ctx.fillText(xMin.toFixed(1), PAD,           H - 6)
  ctx.fillText(yMax.toFixed(2), 2,             PAD + 8)
}

export function SpectrumHUD({ state, activeTab, onTabChange, className }: SpectrumHUDProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !state?.curve) return

    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = "rgba(4,6,8,0.85)"
    ctx.fillRect(0, 0, W, H)

    // Border
    ctx.strokeStyle = "rgba(64,255,170,0.2)"
    ctx.lineWidth   = 0.5
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

    const { curve } = state

    if (activeTab === "fAlpha") {
      drawCurve(ctx, curve.points, "alpha", "fAlpha", state.qOrder, curve.alphaBar)
    } else {
      drawCurve(ctx, curve.points, "q", "tau", state.qOrder)
    }

    // Header label
    ctx.fillStyle = "rgba(64,255,170,0.6)"
    ctx.font      = "7px monospace"
    ctx.fillText(
      activeTab === "fAlpha"
        ? `f(α)  D₀=${curve.D0.toFixed(2)} D₂=${curve.D2.toFixed(2)}`
        : `τ(q)  D₁=${curve.D1.toFixed(2)}`,
      6, 10
    )

  }, [state, activeTab])

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-50 flex flex-col",
        "border border-primary/20 bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      {/* Tab bar */}
      <div className="flex border-b border-primary/10">
        {(["fAlpha", "tau"] as HUDTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "flex-1 py-1 font-mono text-[8px] tracking-widest uppercase transition-colors",
              activeTab === tab
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
          >
            {tab === "fAlpha" ? "f(α)" : "τ(q)"}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block"
      />

      {/* Bottom status */}
      {state && (
        <div className="flex items-center justify-between px-2 py-1 border-t border-primary/10">
          <span className="font-mono text-[7px] text-muted-foreground/40">
            q={state.qOrder.toFixed(1)} ε={state.epsilon.toFixed(2)}
          </span>
          <span className="font-mono text-[7px] text-primary/40">
            {state.mode}
          </span>
          {state.anomalyActive && state.anomalies.length > 0 && (
            <span className="font-mono text-[7px] text-warning">
              {state.anomalies.length} ANOM
            </span>
          )}
        </div>
      )}
    </div>
  )
}
