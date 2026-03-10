# Advanced Real-Time Interactive 3D Particle System
## Multifractal Spectrum Integration — Technical Specification

**Project:** Render Glitch — Nature Beyond Clone  
**Version:** 1.0.0  
**Date:** 2026-03-03  
**Status:** Spec / Pre-Implementation

---

## 1. Overview

Extend the existing Three.js WebGL scene (`lib/webgl/WebGLScene.ts`) and particle system (`lib/webgl/ParticleSystem.ts`) into a high-performance, GPU-accelerated interactive 3D particle engine supporting **500,000+ particles** with:

- Real-time hand gesture control via **MediaPipe Hands**
- **Multifractal spectrum analysis** — f(α) curves drive emergent particle behaviors
- **25+ procedural templates** (15+ fractal-based, multifractal-enhanced)
- **60 FPS** on desktop and mobile via WebGL 2.0 + GPGPU
- **Minimalist adaptive UI** (Tweakpane/Lil-GUI) with live spectrum controls

**Central innovation:** Local Hölder exponents α modulate particle densities, velocities, and visual properties — enabling quantifiable irregularity and self-similar hierarchies. All hand gestures map to q-order adjustments in real-time f(α) spectrum computation.

---

## 2. Architecture

### 2.1 System Diagram

```
MediaPipe Hands (WebRTC 30+ FPS)
        ↓
GestureClassifier (21 keypoints × 2 hands)
        ↓  pose + bimanual metrics
MultifractalEngine
├── PartitionFunction  Z(q, ε) = Σ μ(Bᵢ)^q
├── MassExponent       τ(q) = lim[ε→0] log Z(q,ε) / log ε
├── HolderExponent     α(q) = dτ/dq
└── SpectrumCurve      f(α) = qα − τ(q)   [Legendre transform]
        ↓  α, f(α), Dq per particle
GPGPUParticleSystem (WebGL2 DataTexture ping-pong)
├── PositionTexture    (RGBA32F, √N × √N)
├── VelocityTexture    (RGBA32F)
├── LifeTexture        (RGBA32F — lifespan, age, α, f(α))
└── RenderPass         (instanced Points + ShaderMaterial)
        ↓
PostProcessingComposer (existing pipeline)
├── UnrealBloomPass
├── ChromaticAberrationShader
├── NoiseShader
└── VignetteShader
        ↓
UIOverlay (Tweakpane panel + HUD overlays)
├── SpectrumPlot       f(α) curve HUD wireframe
├── TauPlot            τ(q) curve
└── ControlsPanel      (all sliders, dropdowns, toggles)
```

### 2.2 New Module Map

```
lib/
├── webgl/
│   ├── WebGLScene.ts              ← extend: add GPGPU init, gesture bridge
│   ├── ParticleSystem.ts          ← replace: GPU ping-pong, 500k particles
│   ├── GPGPUCompute.ts            ← new: DataTexture ping-pong manager
│   ├── CameraRig.ts               ← unchanged
│   └── shaders/
│       ├── ParticleSimShader.ts   ← new: position/velocity GPGPU frag shader
│       ├── ParticleRenderShader.ts← new: vertex/frag for render pass
│       ├── MultifractalShader.ts  ← new: Z(q,ε), τ(q), α, f(α) GLSL kernels
│       ├── NoiseShader.ts         ← unchanged
│       ├── VignetteShader.ts      ← unchanged
│       └── ChromaticAberrationShader.ts ← unchanged
├── multifractal/
│   ├── MultifractalEngine.ts      ← new: JS-side spectrum computation
│   ├── SpectrumAnalyzer.ts        ← new: Legendre + wavelet leader modes
│   └── templates/
│       ├── TemplateRegistry.ts    ← new: 25+ template definitions
│       ├── FractalTemplates.ts    ← new: 15 fractal-based generators
│       └── StructuredTemplates.ts ← new: 10 structured form generators
└── gesture/
    ├── HandTracker.ts             ← new: MediaPipe Hands bridge
    ├── GestureClassifier.ts       ← new: 20+ pose detection
    └── BimanualMapper.ts          ← new: distance/twist/scale mapping
components/
├── ui/
│   ├── SpectrumHUD.tsx            ← new: f(α) + τ(q) canvas overlay
│   └── ControlsPanel.tsx          ← new: Tweakpane-style control panel
└── webgl/
    └── WebGLCanvas.tsx            ← extend: gesture video element
hooks/
└── useParticleControls.ts         ← new: unified state for all controls
```

---

## 3. Multifractal Mathematics

### 3.1 Partition Function

$$Z(q, \epsilon) = \sum_{i} \mu(B_i)^q$$

Where:
- $\mu(B_i)$ = measure (particle density) in box $B_i$ of size $\epsilon$
- $q \in [-10, 10]$ = moment order (UI slider)
- $\epsilon \in [0.01, 1.0]$ = box size (UI slider)

### 3.2 Mass Scaling Exponents

$$\tau(q) = \lim_{\epsilon \to 0} \frac{\log Z(q, \epsilon)}{\log \epsilon}$$

Approximated at finite ε as: `τ(q) ≈ log Z(q,ε) / log ε`

### 3.3 Hölder Exponent (local singularity strength)

$$\alpha(q) = \frac{d\tau}{dq}$$

Computed via finite difference: `α(q) ≈ [τ(q+δq) − τ(q−δq)] / 2δq`

### 3.4 Multifractal Spectrum (Legendre Transform)

$$f(\alpha(q)) = q \cdot \alpha(q) - \tau(q)$$

The f(α) curve encodes the fractal dimension of the set of points with singularity strength α. Its peak at $\bar{\alpha}$ is the most probable Hölder exponent.

### 3.5 Generalized Dimensions

$$D_q = \frac{\tau(q)}{q - 1} \quad (q \neq 1)$$

Used for adaptive LOD: refine geometry/particle density where $D_2$ (correlation dimension) is highest.

### 3.6 Binomial Cascade (closed-form, for Binomial Nebula template)

$$\tau(q) = -\log_2(p^q + (1-p)^q)$$
$$f(\alpha(q)) = q\alpha(q) - \tau(q)$$

Where $p = 0.6$ (configurable). This is computed analytically, no approximation needed.

---

## 4. Hand Gesture System

### 4.1 MediaPipe Setup

```typescript
// lib/gesture/HandTracker.ts
import { Hands } from "@mediapipe/hands"

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
})

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.6
})
```

**Processing rate:** 30+ FPS via `requestAnimationFrame` on a hidden `<video>` element fed from `getUserMedia`.

### 4.2 Bimanual Scaling

Euclidean distance between hand centroids (derived from keypoint convex hull centroids):

$$d = \sqrt{(x_{h1} - x_{h2})^2 + (y_{h1} - y_{h2})^2 + (z_{h1} - z_{h2})^2}$$

Non-linear scale mapping (exponential easing):

$$s = s_{\min} + (s_{\max} - s_{\min}) \cdot \frac{1 - e^{-\alpha d}}{1 - e^{-\alpha d_{\max}}}$$

- $\alpha = 0.5$ (sensitivity, tunable 0.1–1.0 via UI)
- $s_{\min} = 0.2$, $s_{\max} = 3.0$
- Transition smoothed via Catmull-Rom spline over 100–200ms
- Also maps $\alpha$ sensitivity → q-order for real-time spectrum probing

**Close hands** ($d < \theta_{\text{close}}$): inverse-square attraction $F_{\text{attr}} = -k/d^2$ toward group center; amplify clustering at weak singularities ($\alpha > \bar{\alpha}$).

**Wide hands** ($d > \theta_{\text{open}}$): radial repulsion $F_{\text{rep}} = k \cdot d$; enhance dispersion at strong singularities ($\alpha < \bar{\alpha}$).

### 4.3 Rotation Control

**Single hand (right hand):** Palm orientation quaternion → yaw angle:

$$\phi = \text{atan2}(n_y, n_x)$$

$$R_y(\phi) = \begin{pmatrix} \cos\phi & 0 & \sin\phi \\ 0 & 1 & 0 \\ -\sin\phi & 0 & \cos\phi \end{pmatrix}$$

Damped angular velocity: $\omega = \beta(\phi_{\text{target}} - \phi_{\text{current}})$, $\beta = 0.8$

**Bimanual twist:** Cross-product torque from hand velocities:

$$\tau = \|\vec{v}_{h1} \times \vec{v}_{h2}\|$$

Multi-axis rotation via Euler decomposition + quaternion slerp to avoid gimbal lock.

### 4.4 Pose Classification (20+ poses)

| Pose | Detection Rule | Particle Effect | q-Order Bias |
|---|---|---|---|
| Open Palm | All finger curls $c_i > 0.7$ | Relaxed emission | $q < 0$ (weak singularities) |
| Closed Fist | All $c_i < 0.3$ | Implosion burst: $\vec{v} += \vec{r} \cdot 5$ | $q > 0$ (strong singularities) |
| Peace Sign | Index+middle extended, rest closed | Split → 2 Voronoi streams | $q = 0$ (uniform) |
| Thumbs Up | Thumb extended, rest closed | Buoyancy $F_b = mg \cdot 1.2$ | $q = 2$ (correlation dim) |
| OK Sign | Thumb+index loop, rest extended | Circular vortex $\omega = 2\pi/2s$ | $q = 1$ (information dim) |
| Rock | Fist + index extended slightly | Densify cluster | $q = 5$ |
| Paper | Flat open hand | Flatten to plane | $q = -2$ |
| Scissors | Index+middle spread, rest closed | Slice + separate subgroups | $q = -5$ |
| Wave | Horizontal rapid motion $\|\dot{c}\| > 0.5$ | Sine shear wave $\Delta x = A\sin(2\pi ft + kz)$ | $q$ oscillates |
| Point | Single index extended | Attract to fingertip (IK chain) | $q = 3$ |
| Pinch | Thumb+index close $< 20px$ | Scale down emitter | $q = 8$ |
| Spread | All fingers maximally extended | Maximum dispersion | $q = -8$ |
| L-Shape | Thumb + index at 90° | L-system branching burst | $q$ sweep |
| Hang Loose | Thumb + pinky extended | Low-frequency oscillation | $q = -1$ |
| Three Fingers | Index+middle+ring | Triple stream fork | $q = 3$ |
| Four Fingers | All but thumb | Quad symmetric emission | $q = 4$ |
| Crossed | Index over middle | Interference pattern | $q = 2$ |
| Wrist Roll | Palm facing ±Z flip | Axis inversion | Negate q |
| Double Fist | Both hands fist | Global implosion | $q = 10$ |
| Both Open | Both hands open | Max dispersion, all weak singularities | $q = -10$ |

**Finger curl metric:** $c_i = \frac{\|p_{\text{tip},i} - p_{\text{mcp},i}\|}{\|p_{\text{pip},i} - p_{\text{mcp},i}\|}$, closed when $c_i < 0.3$.

Each pose triggers a 500ms–2s effect with configurable intensity, blended via weighted finite state machine (FSM) for seamless transitions.

---

## 5. GPGPU Particle System

### 5.1 Data Layout

Four `DataTexture` pairs (ping-pong), each `√N × √N` pixels at `THREE.RGBAFormat`, `THREE.FloatType`:

| Texture | R | G | B | A |
|---|---|---|---|---|
| Position | x | y | z | 1.0 |
| Velocity | vx | vy | vz | speed |
| Life | age | lifespan | templateID | spawnSeed |
| Spectrum | α (Hölder) | f(α) | Dq | τ(q) |

For **500,000 particles**: textures are `768 × 768 = 589,824` pixels (next power-of-two-ish that covers 500k).

### 5.2 Simulation Shader (ParticleSimShader.ts)

```glsl
// Fragment shader — runs once per particle per frame
uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D lifeTexture;
uniform sampler2D spectrumTexture;

uniform float time;
uniform float delta;
uniform float qOrder;
uniform float epsilon;
uniform float gravityStrength;
uniform float windStrength;
uniform vec3  attractorPos;
uniform float attractorStrength;
uniform int   templateID;

// Forces
vec3 computeGravity(vec3 vel) {
  return vec3(0.0, -9.8 * gravityStrength, 0.0);
}

vec3 computeWind(vec3 pos, float t) {
  // Perlin octaves scaled by Dq (from spectrum.a)
  return vec3(
    snoise(pos * 0.1 + t * 0.3) * windStrength,
    0.0,
    snoise(pos * 0.1 + t * 0.2 + 100.0) * windStrength
  );
}

vec3 computeMultifractalForce(vec3 pos, float alpha, float fAlpha) {
  // F ∝ ∇(qα − τ(q)) — gradient of Legendre function
  float dAlpha = alpha - 1.0; // deviation from mean
  return pos * (-qOrder * dAlpha * fAlpha) * 0.001;
}

vec3 computeFlocking(vec3 pos, vec3 vel, float alpha) {
  // Boids separation scaled by local f(α)
  // (simplified — full version uses neighbor texture lookup)
  return normalize(-pos) * (1.0 - alpha) * 0.002;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData  = texture2D(positionTexture, uv);
  vec4 velData  = texture2D(velocityTexture, uv);
  vec4 lifeData = texture2D(lifeTexture, uv);
  vec4 specData = texture2D(spectrumTexture, uv);

  vec3  pos     = posData.xyz;
  vec3  vel     = velData.xyz;
  float age     = lifeData.x;
  float lifespan= lifeData.y;
  float alpha   = specData.x;   // Hölder exponent
  float fAlpha  = specData.y;   // f(α)

  // Accumulate forces
  vec3 force = vec3(0.0);
  force += computeGravity(vel);
  force += computeWind(pos, time);
  force += computeMultifractalForce(pos, alpha, fAlpha);
  force += computeFlocking(pos, vel, alpha);

  // Attractor (gesture-driven)
  vec3 toAttractor = attractorPos - pos;
  force += toAttractor * attractorStrength * fAlpha;

  // Semi-implicit Euler integration
  vel += force * delta;
  vel *= 0.98; // drag
  pos += vel * delta;

  // Respawn if dead
  age += delta;
  if (age > lifespan) {
    pos = spawnPosition(lifeData.w, templateID, time);
    vel = spawnVelocity(lifeData.w, templateID);
    age = 0.0;
    lifespan = paretoLifespan(lifeData.w, alpha); // Pareto-biased by spectrum tail
  }

  gl_FragColor = vec4(pos, 1.0); // write to position output
  // (velocity, life, spectrum outputs written in separate passes)
}
```

### 5.3 Render Shader (ParticleRenderShader.ts)

```glsl
// Vertex shader
uniform sampler2D positionTexture;
uniform sampler2D spectrumTexture;
uniform float     time;
uniform vec3      baseColor;
uniform vec3      secondaryColor;
uniform float     qOrder;
uniform float     epsilon;

attribute vec2    particleUV; // maps particle index → texture UV
varying vec3      vVelocity;
varying float     vProximity;
varying float     vAlpha;
varying float     vFAlpha;

void main() {
  vec4 posData  = texture2D(positionTexture, particleUV);
  vec4 specData = texture2D(spectrumTexture, particleUV);

  vAlpha  = specData.x;
  vFAlpha = specData.y;
  vProximity = 1.0 - length(posData.xyz) / 50.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(posData.xyz, 1.0);
  gl_PointSize = max(1.0, (2.0 + vFAlpha * 4.0) * (1.0 / -gl_Position.z));
}

// Fragment shader
void main() {
  float speed = length(vVelocity);
  vec3 hueShift = mix(baseColor, secondaryColor, smoothstep(0.0, 5.0, speed));
  vec3 tint = mix(hueShift, vec3(1.0), vProximity * (vAlpha - 1.0));
  float spectrumGlow = pow(vFAlpha * speed * vProximity, 2.0)
                     * (qOrder > 0.0 ? 1.5 : 0.8);
  gl_FragColor = vec4(tint * (1.0 + spectrumGlow), opacity);
}
```

### 5.4 Lifecycle

- **Lifespan:** Pareto-distributed with tail biased by spectrum: long lifespans at strong singularities ($\alpha < \bar{\alpha}$)
- **Emission:** Singularity-enhanced Poisson process — higher emission rate at $f(\alpha)$ peak
- **LOD:** Particle count scales with $D_0$ (capacity dimension); reduce at far camera distances

---

## 6. Templates (25+)

### 6.1 Structured Forms (10)

| # | Template | Core Math |
|---|---|---|
| 1 | Heart | $x = 16\sin^3 t$, $y = 13\cos t - 5\cos 2t - 2\cos 3t - \cos 4t$ + Gaussian noise |
| 2 | Flower Petal Vortex | Logarithmic spiral $r = ae^{b\theta}$ + Fibonacci phyllotaxis |
| 3 | Planetary Rings | Keplerian orbit $r = p/(1 + e\cos\theta)$ with inclination perturbations |
| 4 | Fireworks Burst | Ballistic $\vec{a} = -g\hat{z} + \vec{w}$, opacity $\alpha = e^{-\lambda t}$ |
| 5 | Flowing River/Smoke | SPH kernel $W(r,h) = \frac{8}{\pi h^3}(1 - r/h)^3$ for viscosity |
| 6 | Galaxy Spiral | Logarithmic arms + density wave perturbation |
| 7 | DNA Helix | Parametric double helix with base-pair bridges |
| 8 | Sphere Shell | Uniform spherical distribution with surface attraction |
| 9 | Torus Knot | $(p, q)$-torus knot parametric with writhe |
| 10 | Möbius Strip | Möbius band with half-twist boundary |

### 6.2 Multifractal-Enhanced Fractal Suite (15)

| # | Template | Multifractal Integration |
|---|---|---|
| 11 | Buddhist Mandala | Mandelbrot $z_{n+1} = z_n^2 + c$; escape-time measure μ → $Z(q,\epsilon)$ → $f(\alpha)$ density modulation |
| 12 | Molecular Cloud | Brownian + Lévy flights; $\tau(q)$ biases flight direction toward high $f(\alpha)$ regions |
| 13 | Sierpinski Tetrahedron | Recursive subdivision; binomial cascade $D_q = \tau(q)/(q-1)$ for LOD |
| 14 | Menger Sponge | Cubic drilling; geodesic diffusion scaled by $\alpha(q) = d\tau/dq$ |
| 15 | Julia Set Hyper-Mesh | Quaternion Julia $z_{n+1} = z_n^4 + c$; $f(\alpha)$ asymmetry → color gradients |
| 16 | Koch Snowflake Nebula | Icosahedral Koch curves; Hölder $\alpha$ → orbital velocities, spectrum tails trigger bursts |
| 17 | Apollonian Gasket Cloud | Inversive packing; n-body forces weighted by $Z_q(\epsilon)$, $D_2$ for clustering |
| 18 | Lorenz Attractor Vortex | ODE $(\sigma=10, \rho=28, \beta=8/3)$; multifractal streamline analysis modulates $\rho$ |
| 19 | Multifractal Prime Cascade | Prime sieve gaps → Pareto lifespans; $f(\alpha)$ from partition sums |
| 20 | RFM Dendritic Network | L-systems + DLA; singularity strengths $\alpha$ bias branching |
| 21 | IFS Crystal Lattice | Probabilistic IFS; gesture-perturbed codes evolve $\tau(q)$ bifurcations |
| 22 | Binomial Cascade Nebula | $\tau(q) = -\log_2(p^q + (1-p)^q)$; real-time Legendre transform for emission |
| 23 | Turbulent Multifractal Flow | Navier-Stokes + multifractal dissipation; wavelet leaders → $\alpha$ modulates vorticity |
| 24 | Singularity Anomaly Cluster | MMT-filtered spectra; particles attracted to $\alpha_{\min}$ hotspots |
| 25 | AI Pseudofractal | Shader-based CNN convolutions estimate $f(\alpha)$ for adaptive singularities |

All fractal templates support:
- **Iteration depth slider:** 1–15
- **q-range selector:** $q \in [-10, 10]$
- **Spectrum HUD wireframe overlay** showing live $f(\alpha)$ curve
- **ε scale selector:** 0.01–1.0

---

## 7. UI Controls Panel

Built with **Tweakpane** (or `lil-gui` as fallback). Dark theme, auto-fade on gesture detection, auto-restore on mouse entry.

### 7.1 Full Control Spec

| Control | Type | Range / Options | Affects |
|---|---|---|---|
| Particle Count | Slider | 1,000 – 1,000,000 | `GPGPUCompute` texture resize |
| Particle Size Min | Slider | 0.01 – 1.0 | Render shader `gl_PointSize` min |
| Particle Size Max | Slider | 0.01 – 1.0 | Render shader `gl_PointSize` max |
| Physics Multiplier | Slider | 0.0 – 2.0 | Force scale uniform |
| Template Selector | Dropdown | 25+ options | `TemplateRegistry` spawn function |
| Base Color | Color Picker | HSV wheel | Render shader `baseColor` |
| Secondary Color | Color Picker | HSV wheel | Render shader `secondaryColor` |
| Gesture Sensitivity α | Slider | 0.1 – 1.0 | `BimanualMapper` exponential α |
| Pose Threshold | Slider | 0.5 – 0.9 | `GestureClassifier` confidence gate |
| q-Order | Slider | -10 – 10 | `MultifractalEngine` moment order |
| ε Scale | Slider | 0.01 – 1.0 | Box size for partition function |
| Spectrum Mode | Dropdown | Legendre / Wavelet | `SpectrumAnalyzer` backend |
| Anomaly Detection | Toggle | On / Off | MMT filter in `SpectrumAnalyzer` |
| f(α) Visualization | Toggle | On / Off | `SpectrumHUD` canvas overlay |
| τ(q) Plot | Toggle | On / Off | `SpectrumHUD` canvas overlay |
| D_q LOD | Toggle | On / Off | LOD threshold in `GPGPUCompute` |
| Singularity Bias | Toggle | On / Off | `computeMultifractalForce` in sim |
| Gravity Strength | Slider | 0.0 – 2.0 | `computeGravity` uniform |
| Wind Strength | Slider | 0.0 – 1.0 | `computeWind` uniform |
| Bloom Intensity | Slider | 0.0 – 2.0 | `bloomPass.strength` |
| Chromatic Amount | Slider | 0.0 – 0.01 | `chromaticPass.uniforms.amount` |

### 7.2 Spectrum HUD (`SpectrumHUD.tsx`)

Canvas-based overlay (top-right corner, 240×160px), dark background, teal line:
- **f(α) curve:** X-axis = α range, Y-axis = f(α) value, live-updated at 10 FPS
- **τ(q) curve:** Secondary tab, X-axis = q, Y-axis = τ(q)
- **Crosshair:** Shows current q-order position on curve
- **α-bar indicator:** Vertical line at peak $\bar{\alpha}$

---

## 8. Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| Frame time | < 16ms (60 FPS) | GPGPU ping-pong, no CPU particle loops |
| Particle count | 500,000+ | WebGL2 DataTexture, instanced rendering |
| Gesture latency | < 33ms | 30 FPS MediaPipe, WebRTC stream |
| Spectrum update | < 2ms | Legendre computed in GLSL fragment shader |
| Memory | < 512MB GPU | Float16 textures where possible |
| Mobile | 60 FPS (reduced N) | $D_0$-based LOD, adaptive $\Delta t$ |

### 8.1 LOD Strategy

```
Camera distance → D0 threshold → particle count tier
< 10 units  → 500,000 particles (full)
10–30 units → 200,000 particles
30–60 units → 50,000 particles
> 60 units  → 10,000 particles (background)
```

---

## 9. Integration with Existing Codebase

### 9.1 `WebGLScene.ts` Changes

- Add `HandTracker` initialization (lazy — only when gesture panel opened)
- Add `GPGPUCompute` initialization alongside existing `ParticleSystem`
- Bridge `GestureClassifier` output to `GPGPUCompute.uniforms`
- Keep existing tree, lights, environment, and post-processing pipeline unchanged

### 9.2 `WebGLCanvas.tsx` Changes

- Add hidden `<video>` element for MediaPipe camera feed
- Add `<canvas>` overlay for `SpectrumHUD`
- Pass gesture enable toggle from parent

### 9.3 New Route

Create `app/particle-lab/page.tsx` as a standalone fullscreen experience — does not disrupt existing scroll-based sections. The particle lab is accessible from a new nav item in `ui-overlay.tsx`.

### 9.4 Globals / Tokens

No new design tokens required — particle lab uses existing `--primary`, `--background`, `--foreground`, `--warning`, `--fringe` tokens for UI chrome.

---

## 10. Dependencies

| Package | Purpose | Version |
|---|---|---|
| `three` | Core WebGL | existing |
| `@mediapipe/hands` | Hand tracking | `^0.4.1675469240` |
| `@mediapipe/camera_utils` | WebRTC camera | `^0.3.1675466862` |
| `tweakpane` | Controls UI | `^4.0.5` |
| `@tweakpane/plugin-essentials` | Additional controls | `^0.2.1` |

No additional build tooling required — all CDN-compatible for Squarespace conversion target.

---

## 11. Squarespace Conversion Notes

When converting to Squarespace embed (per project custom instructions):

- Replace `app/particle-lab/page.tsx` with standalone HTML/JS snippet
- MediaPipe loaded via CDN: `https://cdn.jsdelivr.net/npm/@mediapipe/hands/`
- Three.js via CDN: `https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js`
- GPGPU textures: use `OES_texture_float` extension check for Safari fallback
- Tweakpane via CDN: `https://cdn.jsdelivr.net/npm/tweakpane@4/dist/tweakpane.min.js`
- Wrap in `#rg-particle-lab` root for CSS scoping
- TypeScript compiled to plain ES2020 JS (no build step in embed)

---

## 12. Implementation Order

1. `lib/multifractal/MultifractalEngine.ts` + `SpectrumAnalyzer.ts` — math core, unit-testable in isolation
2. `lib/webgl/shaders/MultifractalShader.ts` — GLSL kernels for Z(q,ε), τ(q), α, f(α)
3. `lib/webgl/GPGPUCompute.ts` — DataTexture ping-pong manager
4. `lib/webgl/shaders/ParticleSimShader.ts` + `ParticleRenderShader.ts` — GPU sim + render
5. Replace `lib/webgl/ParticleSystem.ts` with new GPGPU-backed version
6. `lib/gesture/HandTracker.ts` + `GestureClassifier.ts` + `BimanualMapper.ts`
7. `lib/multifractal/templates/` — all 25 template generators
8. `components/ui/SpectrumHUD.tsx` + `ControlsPanel.tsx`
9. `app/particle-lab/page.tsx` — route wiring
10. Squarespace conversion pass — bundle, scope, CDN-ify
