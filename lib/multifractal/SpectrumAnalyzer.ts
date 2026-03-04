/**
 * SpectrumAnalyzer.ts
 * Legendre + wavelet leader modes, anomaly detection (MMT filter).
 * Wraps MultifractalEngine with update scheduling and smoothing.
 */

import { MultifractalEngine, type SpectrumCurve } from "./MultifractalEngine"

export type SpectrumMode = "legendre" | "wavelet"

export interface AnalyzerState {
  curve:          SpectrumCurve | null
  mode:           SpectrumMode
  qOrder:         number
  epsilon:        number
  anomalyActive:  boolean
  anomalies:      AnomalyPoint[]
  lastUpdateMs:   number
}

export interface AnomalyPoint {
  q:     number
  alpha: number
  score: number
}

// Update budget: ~10 FPS for spectrum HUD
const UPDATE_INTERVAL_MS = 100

export class SpectrumAnalyzer {
  private engine: MultifractalEngine
  private state: AnalyzerState
  private smoothedCurve: SpectrumCurve | null = null
  private smoothingFactor = 0.25   // lerp weight for temporal smoothing

  constructor() {
    this.engine = new MultifractalEngine(256)
    this.state  = {
      curve:         null,
      mode:          "legendre",
      qOrder:        2.0,
      epsilon:       0.3,
      anomalyActive: false,
      anomalies:     [],
      lastUpdateMs:  0,
    }
  }

  setMode(mode: SpectrumMode): void {
    this.state.mode = mode
  }

  setQOrder(q: number): void {
    this.state.qOrder = Math.max(-10, Math.min(10, q))
  }

  setEpsilon(e: number): void {
    this.state.epsilon = Math.max(0.01, Math.min(1.0, e))
  }

  setAnomalyDetection(active: boolean): void {
    this.state.anomalyActive = active
  }

  // Called each frame — only recomputes on budget
  tick(nowMs: number, templateID: number, binomialP = 0.6): void {
    if (nowMs - this.state.lastUpdateMs < UPDATE_INTERVAL_MS) return
    this.state.lastUpdateMs = nowMs

    let fresh: SpectrumCurve

    // Binomial Cascade template (ID 22) uses closed-form
    if (templateID === 22) {
      fresh = this.engine.computeBinomialCurve(
        binomialP,
        this.state.qOrder - 8,
        this.state.qOrder + 8
      )
    } else {
      // Wavelet mode perturbs epsilon by a scale-space ladder
      const eps = this.state.mode === "wavelet"
        ? this.state.epsilon * Math.pow(2, -2)
        : this.state.epsilon

      fresh = this.engine.computeCurve(
        this.state.qOrder - 8,
        this.state.qOrder + 8,
        40,
        eps
      )
    }

    // Temporal smoothing (lerp per point)
    if (this.smoothedCurve && this.smoothedCurve.points.length === fresh.points.length) {
      const s = this.smoothingFactor
      const smoothed = {
        ...fresh,
        points: fresh.points.map((pt, i) => {
          const prev = this.smoothedCurve!.points[i]
          return {
            q:      pt.q,
            tau:    prev.tau    + s * (pt.tau    - prev.tau),
            alpha:  prev.alpha  + s * (pt.alpha  - prev.alpha),
            fAlpha: prev.fAlpha + s * (pt.fAlpha - prev.fAlpha),
            Dq:     prev.Dq     + s * (pt.Dq     - prev.Dq),
          }
        }),
        alphaBar: this.smoothedCurve.alphaBar + s * (fresh.alphaBar - this.smoothedCurve.alphaBar),
        D0: this.smoothedCurve.D0 + s * (fresh.D0 - this.smoothedCurve.D0),
        D1: this.smoothedCurve.D1 + s * (fresh.D1 - this.smoothedCurve.D1),
        D2: this.smoothedCurve.D2 + s * (fresh.D2 - this.smoothedCurve.D2),
      }
      this.smoothedCurve = smoothed
    } else {
      this.smoothedCurve = fresh
    }

    this.state.curve = this.smoothedCurve

    // MMT anomaly detection: flag points where f(α) deviates > 2σ from curve median
    if (this.state.anomalyActive && this.smoothedCurve) {
      this.state.anomalies = this.detectAnomalies(this.smoothedCurve)
    }
  }

  private detectAnomalies(curve: SpectrumCurve): AnomalyPoint[] {
    const values = curve.points.map(p => p.fAlpha)
    const mean   = values.reduce((s, v) => s + v, 0) / values.length
    const sigma  = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
    )

    return curve.points
      .filter(p => Math.abs(p.fAlpha - mean) > 2 * sigma)
      .map(p => ({
        q:     p.q,
        alpha: p.alpha,
        score: Math.abs(p.fAlpha - mean) / sigma,
      }))
  }

  getState(): Readonly<AnalyzerState> {
    return this.state
  }

  // Current α at user's q-order (for attractor strength bias)
  getCurrentAlpha(): number {
    if (!this.state.curve) return 1.0
    const target = this.state.qOrder
    let closest  = this.state.curve.points[0]
    let minDist  = Infinity
    for (const pt of this.state.curve.points) {
      const d = Math.abs(pt.q - target)
      if (d < minDist) { minDist = d; closest = pt }
    }
    return closest.alpha
  }

  getCurrentFAlpha(): number {
    if (!this.state.curve) return 0.5
    const target = this.state.qOrder
    let closest  = this.state.curve.points[0]
    let minDist  = Infinity
    for (const pt of this.state.curve.points) {
      const d = Math.abs(pt.q - target)
      if (d < minDist) { minDist = d; closest = pt }
    }
    return closest.fAlpha
  }
}
