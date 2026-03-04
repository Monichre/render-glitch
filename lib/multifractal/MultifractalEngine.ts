/**
 * MultifractalEngine.ts
 * JS-side spectrum computation: Z(q,ε), τ(q), α(q), f(α), D_q
 * Used to feed the Spectrum HUD and to seed GPU uniforms.
 */

export interface SpectrumPoint {
  q:      number
  tau:    number
  alpha:  number
  fAlpha: number
  Dq:     number
}

export interface SpectrumCurve {
  points: SpectrumPoint[]
  alphaBar: number   // peak α (most probable Hölder exponent)
  D0: number         // capacity dimension
  D1: number         // information dimension
  D2: number         // correlation dimension
}

// Simple noise proxy for JS-side density estimate (matches GPU snoise proxy)
const hashSeed = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const densityAt = (x: number, y: number, z: number, epsilon: number): number => {
  const nx = x / epsilon
  const ny = y / epsilon
  const nz = z / epsilon
  const raw =
    hashSeed(nx, nz) * 0.5 +
    hashSeed(nx * 0.5, ny * 0.5) * 0.25 +
    hashSeed(ny, nz) * 0.125
  return Math.max(raw + 0.125, 0.001)
}

// Partition function Z(q, ε) evaluated at representative sample points
const computeZ = (q: number, epsilon: number, samplePoints: Float32Array): number => {
  let Z = 0
  for (let i = 0; i < samplePoints.length; i += 3) {
    const mu = densityAt(samplePoints[i], samplePoints[i + 1], samplePoints[i + 2], epsilon)
    Z += Math.pow(mu, q)
  }
  return Z / (samplePoints.length / 3)
}

// τ(q) = log Z / log ε
const computeTau = (q: number, epsilon: number, samples: Float32Array): number => {
  const Z = computeZ(q, epsilon, samples)
  const logZ = Math.log(Math.max(Z, 1e-10))
  const logE = Math.log(Math.max(epsilon, 1e-10))
  return logZ / logE
}

export class MultifractalEngine {
  private samples: Float32Array
  private sampleCount: number
  private _currentCurve: SpectrumCurve | null = null

  constructor(sampleCount = 256) {
    this.sampleCount = sampleCount
    // Spherical sample points representing particle space
    this.samples = new Float32Array(sampleCount * 3)
    this.refreshSamples()
  }

  refreshSamples(seed = 42): void {
    const goldenAngle = 2.399963
    for (let i = 0; i < this.sampleCount; i++) {
      const y     = 1 - (i / (this.sampleCount - 1)) * 2
      const r     = Math.sqrt(1 - y * y) * 8
      const theta = goldenAngle * i + seed * 0.01
      this.samples[i * 3]     = Math.cos(theta) * r
      this.samples[i * 3 + 1] = y * 8
      this.samples[i * 3 + 2] = Math.sin(theta) * r
    }
  }

  computeCurve(
    qMin    = -8,
    qMax    = 8,
    steps   = 40,
    epsilon = 0.3
  ): SpectrumCurve {
    const points: SpectrumPoint[] = []
    const dq   = 0.5

    for (let step = 0; step <= steps; step++) {
      const q    = qMin + (step / steps) * (qMax - qMin)
      const tau  = computeTau(q, epsilon, this.samples)
      const tauP = computeTau(q + dq, epsilon, this.samples)
      const tauM = computeTau(q - dq, epsilon, this.samples)

      const alpha  = (tauP - tauM) / (2 * dq)
      const fAlpha = q * alpha - tau
      const Dq     = Math.abs(q - 1) < 0.05
        ? -densityAt(0, 0, 0, epsilon) * Math.log(epsilon)
        : tau / (q - 1)

      points.push({ q, tau, alpha, fAlpha, Dq })
    }

    // Peak α where f(α) is maximum
    const peak = points.reduce((best, p) =>
      p.fAlpha > best.fAlpha ? p : best, points[0])

    const tauAt0 = computeTau(0, epsilon, this.samples)
    const tauAt1 = computeTau(1, epsilon, this.samples)
    const tauAt2 = computeTau(2, epsilon, this.samples)

    this._currentCurve = {
      points,
      alphaBar: peak.alpha,
      D0: tauAt0,
      D1: -tauAt1,
      D2: tauAt2 / 1,
    }

    return this._currentCurve
  }

  // Binomial cascade (closed-form, no approximation)
  computeBinomialCurve(p = 0.6, qMin = -8, qMax = 8, steps = 40): SpectrumCurve {
    const points: SpectrumPoint[] = []
    const dq = 0.5

    const binomialTau = (q: number): number =>
      -Math.log2(Math.max(Math.pow(p, q) + Math.pow(1 - p, q), 1e-10))

    for (let step = 0; step <= steps; step++) {
      const q      = qMin + (step / steps) * (qMax - qMin)
      const tau    = binomialTau(q)
      const tauP   = binomialTau(q + dq)
      const tauM   = binomialTau(q - dq)
      const alpha  = (tauP - tauM) / (2 * dq)
      const fAlpha = q * alpha - tau
      const Dq     = Math.abs(q - 1) < 0.05 ? 1 : tau / (q - 1)
      points.push({ q, tau, alpha, fAlpha, Dq })
    }

    const peak = points.reduce((best, p2) => p2.fAlpha > best.fAlpha ? p2 : best, points[0])

    this._currentCurve = {
      points,
      alphaBar: peak.alpha,
      D0: binomialTau(0),
      D1: -binomialTau(1),
      D2: binomialTau(2),
    }

    return this._currentCurve
  }

  get currentCurve(): SpectrumCurve | null {
    return this._currentCurve
  }
}
