/**
 * TemplateRegistry.ts
 * 25 template definitions: ID, name, category, default q-order, epsilon,
 * spawn radius, and physics modifiers used by GPGPUCompute and the UI.
 */

export type TemplateCategory = "structured" | "fractal"

export interface ParticleTemplate {
  id:           number
  name:         string
  category:     TemplateCategory
  defaultQ:     number
  defaultEps:   number
  spawnRadius:  number
  gravityScale: number
  windScale:    number
  description:  string
  binomialP?:   number   // only for template 22
}

export const TEMPLATES: ParticleTemplate[] = [
  // ---- Structured Forms (0–9) ----
  {
    id: 0,  name: "Heart",
    category: "structured", defaultQ: 0, defaultEps: 0.3,
    spawnRadius: 4, gravityScale: 0.05, windScale: 0.2,
    description: "16sin³t, 13cost−5cos2t−2cos3t−cos4t + Gaussian noise",
  },
  {
    id: 1,  name: "Flower Petal Vortex",
    category: "structured", defaultQ: 1, defaultEps: 0.25,
    spawnRadius: 8, gravityScale: 0.0, windScale: 0.3,
    description: "Logarithmic spiral r=ae^bθ + Fibonacci phyllotaxis",
  },
  {
    id: 2,  name: "Galaxy Spiral",
    category: "structured", defaultQ: 2, defaultEps: 0.4,
    spawnRadius: 14, gravityScale: 0.0, windScale: 0.1,
    description: "Logarithmic arms + density wave perturbation, 3 arms",
  },
  {
    id: 3,  name: "DNA Helix",
    category: "structured", defaultQ: 1, defaultEps: 0.2,
    spawnRadius: 2, gravityScale: 0.0, windScale: 0.1,
    description: "Parametric double helix with base-pair bridges",
  },
  {
    id: 4,  name: "Sphere Shell",
    category: "structured", defaultQ: 0, defaultEps: 0.35,
    spawnRadius: 5, gravityScale: 0.0, windScale: 0.2,
    description: "Uniform spherical distribution with surface attraction",
  },
  {
    id: 5,  name: "Torus Knot",
    category: "structured", defaultQ: 2, defaultEps: 0.3,
    spawnRadius: 5, gravityScale: 0.0, windScale: 0.15,
    description: "(2,3)-torus knot parametric with writhe noise",
  },
  {
    id: 6,  name: "Lorenz Attractor Vortex",
    category: "fractal",    defaultQ: 2, defaultEps: 0.3,
    spawnRadius: 8, gravityScale: 0.0, windScale: 0.05,
    description: "ODE σ=10, ρ=28, β=8/3; multifractal streamline modulates ρ",
  },
  {
    id: 7,  name: "Sierpinski Tetrahedron",
    category: "fractal",    defaultQ: 3, defaultEps: 0.25,
    spawnRadius: 3, gravityScale: 0.0, windScale: 0.0,
    description: "IFS recursive subdivision; D_q for LOD depth",
  },
  {
    id: 8,  name: "Möbius Strip",
    category: "structured", defaultQ: 0, defaultEps: 0.3,
    spawnRadius: 5, gravityScale: 0.0, windScale: 0.1,
    description: "Möbius band with half-twist boundary",
  },
  {
    id: 9,  name: "Planetary Rings",
    category: "structured", defaultQ: -2, defaultEps: 0.4,
    spawnRadius: 10, gravityScale: 0.0, windScale: 0.05,
    description: "Keplerian orbit r=p/(1+ecosθ) with inclination perturbations",
  },
  // ---- Fractal Suite (10–24) ----
  {
    id: 10, name: "Buddhist Mandala",
    category: "fractal",    defaultQ: 2, defaultEps: 0.25,
    spawnRadius: 8, gravityScale: 0.0, windScale: 0.05,
    description: "Mandelbrot escape-time measure → Z(q,ε) density modulation",
  },
  {
    id: 11, name: "Molecular Cloud",
    category: "fractal",    defaultQ: 1, defaultEps: 0.4,
    spawnRadius: 12, gravityScale: 0.05, windScale: 0.6,
    description: "Brownian + Lévy flights; τ(q) biases flight toward high f(α)",
  },
  {
    id: 12, name: "Menger Sponge",
    category: "fractal",    defaultQ: 2, defaultEps: 0.2,
    spawnRadius: 4, gravityScale: 0.0, windScale: 0.0,
    description: "Cubic drilling; geodesic diffusion scaled by α(q)=dτ/dq",
  },
  {
    id: 13, name: "Julia Set Hyper-Mesh",
    category: "fractal",    defaultQ: -2, defaultEps: 0.3,
    spawnRadius: 5, gravityScale: 0.0, windScale: 0.2,
    description: "Quaternion Julia z⁴+c; f(α) asymmetry → color gradients",
  },
  {
    id: 14, name: "Koch Snowflake Nebula",
    category: "fractal",    defaultQ: 0, defaultEps: 0.35,
    spawnRadius: 7, gravityScale: 0.05, windScale: 0.3,
    description: "Icosahedral Koch curves; α → orbital velocities, spectrum tails → bursts",
  },
  {
    id: 15, name: "Apollonian Gasket Cloud",
    category: "fractal",    defaultQ: 2, defaultEps: 0.3,
    spawnRadius: 6, gravityScale: 0.0, windScale: 0.1,
    description: "Inversive packing; n-body weighted by Z_q(ε), D₂ for clustering",
  },
  {
    id: 16, name: "Multifractal Prime Cascade",
    category: "fractal",    defaultQ: 5, defaultEps: 0.25,
    spawnRadius: 8, gravityScale: 0.0, windScale: 0.2,
    description: "Prime sieve gaps → Pareto lifespans; f(α) from partition sums",
  },
  {
    id: 17, name: "RFM Dendritic Network",
    category: "fractal",    defaultQ: 1, defaultEps: 0.3,
    spawnRadius: 6, gravityScale: 0.1, windScale: 0.4,
    description: "L-systems + DLA; singularity strengths α bias branching",
  },
  {
    id: 18, name: "IFS Crystal Lattice",
    category: "fractal",    defaultQ: 3, defaultEps: 0.2,
    spawnRadius: 5, gravityScale: 0.0, windScale: 0.0,
    description: "Probabilistic IFS; gesture-perturbed codes evolve τ(q) bifurcations",
  },
  {
    id: 19, name: "Fireworks Burst",
    category: "structured", defaultQ: -1, defaultEps: 0.5,
    spawnRadius: 1, gravityScale: 0.8, windScale: 0.5,
    description: "Ballistic a=−gz+w, opacity α=e^−λt Pareto burst",
  },
  {
    id: 20, name: "Flowing River / Smoke",
    category: "structured", defaultQ: 1, defaultEps: 0.4,
    spawnRadius: 10, gravityScale: 0.0, windScale: 0.9,
    description: "SPH kernel W(r,h) for viscosity-driven flow",
  },
  {
    id: 21, name: "Turbulent Multifractal Flow",
    category: "fractal",    defaultQ: 2, defaultEps: 0.3,
    spawnRadius: 10, gravityScale: 0.0, windScale: 0.8,
    description: "Navier-Stokes + multifractal dissipation; wavelet leaders → α modulates vorticity",
  },
  {
    id: 22, name: "Binomial Cascade Nebula",
    category: "fractal",    defaultQ: 2, defaultEps: 0.3,
    spawnRadius: 8, gravityScale: 0.05, windScale: 0.3,
    description: "τ(q)=−log₂(p^q+(1−p)^q); real-time Legendre for emission",
    binomialP: 0.6,
  },
  {
    id: 23, name: "Singularity Anomaly Cluster",
    category: "fractal",    defaultQ: -5, defaultEps: 0.15,
    spawnRadius: 6, gravityScale: 0.0, windScale: 0.2,
    description: "MMT-filtered spectra; particles attracted to α_min hotspots",
  },
  {
    id: 24, name: "AI Pseudofractal",
    category: "fractal",    defaultQ: 2, defaultEps: 0.3,
    spawnRadius: 7, gravityScale: 0.0, windScale: 0.3,
    description: "Shader-based convolution estimates f(α) for adaptive singularities",
  },
]

export const getTemplate = (id: number): ParticleTemplate =>
  TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0]

export const getTemplatesByCategory = (cat: TemplateCategory): ParticleTemplate[] =>
  TEMPLATES.filter(t => t.category === cat)
