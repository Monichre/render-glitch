/**
 * MultifractalShader.ts
 * GLSL kernels: Z(q,ε), τ(q), α(q), f(α) — computed in fragment shader
 * Outputs spectrum values per particle UV for the simulation pipeline.
 */

export const MULTIFRACTAL_GLSL = /* glsl */ `
  // ----------------------------------------------------------------
  // Simplex noise (Ashima Arts) — used for density sampling
  // ----------------------------------------------------------------
  vec3 mod289_mf(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289_mf(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute_mf(vec3 x) { return mod289_mf(((x * 34.0) + 1.0) * x); }

  float snoise_mf(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_mf(i);
    vec3 p = permute_mf(permute_mf(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // ----------------------------------------------------------------
  // Partition function  Z(q, ε) — box-counting density proxy
  // mu(pos, ε) = local density estimated via smoothstep noise kernel
  // ----------------------------------------------------------------
  float particleDensity(vec3 pos, float epsilon) {
    float d = snoise_mf(pos.xz * (1.0 / epsilon))
            * 0.5 + 0.5;
    d += snoise_mf(pos.xy * (1.0 / epsilon) * 0.5) * 0.25 + 0.25;
    return clamp(d, 0.001, 1.0);
  }

  // Z(q, ε) = sum of mu^q  (single-box approximation for per-particle GPU)
  float partitionFunction(vec3 pos, float q, float epsilon) {
    float mu   = particleDensity(pos, epsilon);
    // For q=1 use direct, otherwise power
    if (abs(q) < 0.01) return 1.0;
    return pow(mu, q);
  }

  // ----------------------------------------------------------------
  // τ(q)  — mass scaling exponent  (log Z / log ε)
  // ----------------------------------------------------------------
  float massExponent(vec3 pos, float q, float epsilon) {
    float Z = partitionFunction(pos, q, epsilon);
    float logZ = log(max(Z, 1e-7));
    float logE = log(max(epsilon, 1e-7));
    return logZ / logE;
  }

  // ----------------------------------------------------------------
  // α(q) = dτ/dq  (central finite difference, δq = 0.5)
  // ----------------------------------------------------------------
  float holderExponent(vec3 pos, float q, float epsilon) {
    float dq   = 0.5;
    float tau_p = massExponent(pos, q + dq, epsilon);
    float tau_m = massExponent(pos, q - dq, epsilon);
    return (tau_p - tau_m) / (2.0 * dq);
  }

  // ----------------------------------------------------------------
  // f(α) = q·α − τ(q)  — Legendre transform
  // ----------------------------------------------------------------
  float spectrumFAlpha(vec3 pos, float q, float epsilon) {
    float tau   = massExponent(pos, q, epsilon);
    float alpha = holderExponent(pos, q, epsilon);
    return q * alpha - tau;
  }

  // ----------------------------------------------------------------
  // D_q = τ(q) / (q-1)  — generalized dimension (q≠1)
  // ----------------------------------------------------------------
  float generalizedDimension(vec3 pos, float q, float epsilon) {
    if (abs(q - 1.0) < 0.01) {
      // Information dimension: limit q→1 is Shannon entropy proxy
      float mu = particleDensity(pos, epsilon);
      return -mu * log(max(mu, 1e-7));
    }
    float tau = massExponent(pos, q, epsilon);
    return tau / (q - 1.0);
  }

  // ----------------------------------------------------------------
  // Binomial cascade (closed-form for Binomial Nebula template)
  // ----------------------------------------------------------------
  float binomialTau(float q, float p) {
    // τ(q) = -log2(p^q + (1-p)^q)
    float sum = pow(p, q) + pow(1.0 - p, q);
    return -log2(max(sum, 1e-7));
  }

  // ----------------------------------------------------------------
  // Multifractal force gradient  ∇(q·α − τ(q))
  // ----------------------------------------------------------------
  vec3 multifractalForce(vec3 pos, float q, float epsilon, float strength) {
    float alpha  = holderExponent(pos, q, epsilon);
    float fAlpha = spectrumFAlpha(pos, q, epsilon);
    float alphaMean = 1.0; // baseline
    float deviation = alpha - alphaMean;
    // Force pulls toward high f(α) regions
    return -normalize(pos + 0.001) * (q * deviation * fAlpha) * strength;
  }

  // ----------------------------------------------------------------
  // Spawn helpers
  // ----------------------------------------------------------------
  float pseudorandom(float seed) {
    return fract(sin(seed * 127.1 + 311.7) * 43758.5453);
  }

  // Pareto-distributed lifespan biased by local alpha
  // Long lifespans at strong singularities (low alpha)
  float paretoLifespan(float seed, float alpha) {
    float base = 2.0 + pseudorandom(seed) * 6.0;
    float bias = 1.0 / max(alpha, 0.1);
    return clamp(base * bias, 1.0, 20.0);
  }
`

export const MultifractalShader = {
  uniforms: {
    qOrder:   { value: 2.0 },
    epsilon:  { value: 0.3 },
    binomialP:{ value: 0.6 },
  },
}
