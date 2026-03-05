/**
 * SpacetimeWarpShader.ts
 * Full-screen quad vertex + fragment shaders for a z-axis space-time warp tunnel.
 *
 * Visual language:
 *   - Star-field streaks accelerating toward the viewer (z-travel illusion)
 *   - Layered Voronoi / procedural grid representing space-time lattice
 *   - Chromatic aberration + radial distortion at warp edges
 *   - Color palette: project tokens — deep teal (primary), cyan (accent), amber (warning), near-black (bg)
 */

export const SPACETIME_VERT = /* glsl */ `
  precision highp float;

  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

export const SPACETIME_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uWarpSpeed;   // 0.5 – 3.0
  uniform float uGridDensity; // 4.0 – 20.0
  uniform float uAberration;  // 0.0 – 1.0

  varying vec2 vUv;

  // ─── Math helpers ───────────────────────────────────────────────────────────

  #define PI  3.14159265358979
  #define TAU 6.28318530717959

  float hash1(float n) { return fract(sin(n) * 43758.5453123); }
  float hash1v(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  // Smooth voronoi — returns (dist, id)
  vec2 voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    float minDist = 8.0;
    float cellId   = 0.0;
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2  g = vec2(float(i), float(j));
      vec2  o = hash2(n + g);
      vec2  r = g + o - f;
      float d = dot(r, r);
      if (d < minDist) { minDist = d; cellId = hash1v(n + g); }
    }
    return vec2(sqrt(minDist), cellId);
  }

  // ─── Space-time grid lattice ────────────────────────────────────────────────

  // Perspective-projected grid moving along -Z
  // p.xy are NDC, returns distance to nearest grid line [0,1]
  float latticeGrid(vec2 ndc, float time, float density) {
    // Depth tunnel: distance from centre drives perspective Z
    float r   = length(ndc);
    float z   = 1.0 / max(r, 0.001);                     // perspective depth
    float zOff = mod(z - time * uWarpSpeed * 0.4, 1.0);  // scrolling Z layer

    // Project grid onto the convergence plane
    vec2 projected = ndc * z * density;

    // Two perpendicular grid families
    vec2 gf = abs(fract(projected) - 0.5);
    float lineH = smoothstep(0.48, 0.44, gf.x);
    float lineV = smoothstep(0.48, 0.44, gf.y);

    // Fade grid with distance from centre (depth fog)
    float depthFade = exp(-r * 2.5) * (1.0 - zOff * 0.5);
    return (lineH + lineV) * depthFade;
  }

  // ─── Star streaks ───────────────────────────────────────────────────────────

  // Returns brightness at fragCoord from a single star lane
  float starStreak(vec2 ndc, float time, float seed) {
    float angle  = hash1(seed) * TAU;
    float radius = hash1(seed + 0.1) * 0.05 + 0.001; // lane lateral width
    float dist   = hash1(seed + 0.2) * 0.8 + 0.1;   // radial spawn distance

    // Polar coords relative to screen centre
    float r = length(ndc);
    float a = atan(ndc.y, ndc.x);

    // This star's angular lane
    float angDiff = abs(mod(a - angle + PI, TAU) - PI);
    if (angDiff > 0.04) return 0.0;

    // Speed — inner stars move faster (parallax)
    float speed   = uWarpSpeed * (0.3 + hash1(seed + 0.3) * 0.7);
    float travel  = mod(time * speed + hash1(seed + 0.4), 1.0);

    // Streak length grows with warp speed
    float tailLen = 0.08 + uWarpSpeed * 0.05;

    // The star radiates from centre outward; position along ray
    float starR = dist * travel;
    float dR    = abs(r - starR);

    // Lateral softness
    float lateral = smoothstep(radius, 0.0, angDiff * r);
    float streak  = smoothstep(tailLen, 0.0, dR) * lateral;

    // Depth brightness — brighter near centre (just arrived)
    float brightness = (1.0 - travel) * 0.8 + 0.2;
    return streak * brightness;
  }

  // ─── Chromatic aberration helper ────────────────────────────────────────────

  // Sample a fake chromatic offset along radial direction
  vec3 chromaticSample(vec2 uv, float str) {
    vec2  dir  = (uv - 0.5) * str;
    float dist = length(uv - 0.5);
    return vec3(dist + sin(dist * 8.0 - uTime * 0.5) * str * 0.5);
  }

  // ─── Colour palette (mirrors project design tokens) ─────────────────────────

  // primary: teal  oklch(0.75 0.15 180) ≈ #28c8aa
  // accent:  cyan  oklch(0.70 0.12 200) ≈ #1db8d0
  // warning: amber oklch(0.75 0.18 80)  ≈ #e8a020
  // bg:      dark  oklch(0.08 0.01 260) ≈ #0a0b12

  vec3 warpColor(float t, float cellId) {
    vec3 teal  = vec3(0.157, 0.784, 0.667);
    vec3 cyan  = vec3(0.114, 0.722, 0.816);
    vec3 amber = vec3(0.910, 0.627, 0.125);
    vec3 deep  = vec3(0.039, 0.043, 0.071);

    // Outer ring: amber warp heat; mid: cyan lattice; core: teal
    float outerZone = smoothstep(0.5, 0.8, t);
    float midZone   = smoothstep(0.2, 0.5, t) - outerZone;
    float coreZone  = 1.0 - midZone - outerZone;

    return deep
      + teal  * coreZone  * 0.9
      + cyan  * midZone   * 0.7
      + amber * outerZone * 0.5;
  }

  // ─── Main ───────────────────────────────────────────────────────────────────

  void main() {
    vec2 uv  = vUv;
    vec2 res = uResolution;
    // Correct aspect
    vec2 ndc = (uv - 0.5) * vec2(res.x / res.y, 1.0) * 2.0;

    float r    = length(ndc);
    float time = uTime;

    // ── 1. Space-time lattice grid ──
    float grid = latticeGrid(ndc, time, uGridDensity);

    // ── 2. Voronoi cell overlay (space quanta) ──
    float speed  = uWarpSpeed;
    float zDepth = 1.0 / max(r, 0.05);
    vec2  vorUV  = ndc * zDepth * (uGridDensity * 0.25)
                 + vec2(0.0, time * speed * 0.25);
    vec2  vor    = voronoi(vorUV);
    float cell   = 1.0 - smoothstep(0.0, 0.12, vor.x);  // cell boundary glow

    // ── 3. Star streaks (64 lanes) ──
    float stars = 0.0;
    for (int i = 0; i < 64; i++) {
      stars += starStreak(ndc, time, float(i) * 0.137);
    }
    stars = clamp(stars, 0.0, 1.0);

    // ── 4. Radial warp tunnel vignette ──
    // Outer distortion ring
    float warpRing = smoothstep(0.6, 1.4, r + sin(r * 12.0 - time * speed * 3.0) * 0.04);
    float tunnel   = exp(-r * 1.4);           // core brightness falloff
    float edge     = smoothstep(0.9, 0.6, r); // hard vignette

    // ── 5. Temporal pulse (heartbeat of space-time) ──
    float pulse = 0.5 + 0.5 * sin(time * speed * 1.5) * exp(-r * 2.0);

    // ── 6. Compose base colour ──
    float t    = r / 1.5;
    vec3  base = warpColor(clamp(t, 0.0, 1.0), vor.y);

    vec3 col = base;
    col += grid  * vec3(0.157, 0.784, 0.667) * 0.6;   // teal grid
    col += cell  * vec3(0.114, 0.722, 0.816) * 0.5;   // cyan cell edges
    col += stars * vec3(0.95, 0.97, 1.0)     * 1.2;   // white-hot star streaks
    col += warpRing * vec3(0.910, 0.627, 0.125) * 0.3; // amber outer ring heat
    col *= tunnel + 0.05;
    col += pulse * vec3(0.157, 0.784, 0.667) * 0.15;  // core teal pulse

    // ── 7. Chromatic aberration ──
    if (uAberration > 0.001) {
      float aberrStr = uAberration * 0.018;
      vec2  dir      = normalize(ndc + 0.001) * aberrStr * r;
      // RGB fringing: shift red outward, blue inward
      vec2 uvR  = uv + dir;
      vec2 uvB  = uv - dir;
      // Approximate with a hue-shift of the radial direction
      float rCh = col.r + length(uvR - uv) * 1.5;
      float bCh = col.b + length(uvB - uv) * 1.5;
      col = vec3(clamp(rCh, 0.0, 1.5), col.g, clamp(bCh, 0.0, 1.5));
    }

    // ── 8. Vignette + tone map ──
    col *= edge;
    // Reinhard-ish
    col  = col / (col + 0.5);
    // Gamma
    col  = pow(max(col, 0.0), vec3(1.0 / 2.2));

    gl_FragColor = vec4(col, 1.0);
  }
`
