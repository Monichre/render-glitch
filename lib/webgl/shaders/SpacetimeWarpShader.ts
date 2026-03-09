/**
 * SpacetimeWarpShader.ts
 *
 * Visual language extracted from reference image:
 *   - Near-black (#080a06) background
 *   - Amber/gold (#c8a84b) orthogonal rectangular grid over entire frame
 *   - Large dark planet (right side) with gold particle-dust scatter on surface
 *   - Small receding spheres along a central horizontal axis (left)
 *   - Floating monospace telemetry annotations (centre)
 *   - Subtle teal atmospheric glow on planet limb
 *   - Moving through Z: grid lines converge to a vanishing point on the horizon
 */

export const SPACETIME_VERT = /* glsl */ `
  precision highp float;
  attribute vec2 position;
  varying   vec2 vUv;
  void main() {
    vUv         = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

export const SPACETIME_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uWarpSpeed;     // 0.5 – 3.0
  uniform float uGridDensity;   // 4.0 – 20.0
  uniform float uAberration;    // 0.0 – 1.0
  uniform float uPlanetScale;   // 0.5 – 2.0  (new)
  uniform float uDustDensity;   // 0.0 – 1.0  (new)

  varying vec2 vUv;

  // ── Palette ─────────────────────────────────────────────────────────────────
  #define BG      vec3(0.031, 0.039, 0.024)   // #080a06 near-black
  #define GOLD    vec3(0.784, 0.659, 0.294)   // #c8a84b amber/gold
  #define GOLD_DIM vec3(0.392, 0.329, 0.147)  // dimmed gold
  #define TEAL    vec3(0.098, 0.471, 0.431)   // #197066 teal limb glow
  #define DUST    vec3(0.820, 0.706, 0.392)   // #d1b464 hot dust

  // ── Math ────────────────────────────────────────────────────────────────────
  #define PI  3.14159265358979
  #define TAU 6.28318530717959

  float hash1(float n)  { return fract(sin(n) * 43758.5453); }
  float hash1v(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2  hash2(vec2 p)   {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  // 2-D smooth noise [0,1]
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash1v(i),
          b = hash1v(i + vec2(1,0)),
          c = hash1v(i + vec2(0,1)),
          d = hash1v(i + vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  // ── Perspective grid ─────────────────────────────────────────────────────────
  // Rectangular grid in 3-D receding to a central vanishing point.
  // Returns (line brightness, horizontal line flag)
  vec2 perspGrid(vec2 ndc, float aspect, float time, float density) {
    // Horizon is at ndc.y = 0 (centre). Perspective: y scale = 1/(|y|+eps)
    float eps  = 0.15;
    float yAbs = abs(ndc.y) + eps;

    // Z scroll: tiles stream toward the viewer along Y (above/below horizon)
    float zScroll = mod(time * uWarpSpeed * 0.3, 1.0);

    // Scale X by perspective depth, Y by linear depth + scroll
    float px = ndc.x * density / yAbs;
    float py = (1.0 / yAbs) * density * 0.5 + zScroll * density;

    // Grid fract distance from line
    vec2  gf   = abs(fract(vec2(px, py)) - 0.5);
    float lineW = 0.015 * density / yAbs;  // lines thinner at distance
    float h     = smoothstep(lineW, 0.0, gf.x);
    float v     = smoothstep(lineW * 0.5, 0.0, gf.y);

    // Fade with distance from camera (top/bottom edges) and with depth
    float depthFade = exp(-abs(ndc.y) * 1.2);
    float horiz     = smoothstep(0.08, 0.0, abs(ndc.y));  // fade at horizon seam

    return vec2((h + v) * depthFade * (1.0 - horiz), h);
  }

  // ── Planet SDF + shading ─────────────────────────────────────────────────────
  // Returns (sdf, limb_t, is_inside)
  vec3 planetSDF(vec2 uv, vec2 center, float radius) {
    float d    = length(uv - center) - radius;
    float limb = 1.0 - clamp((length(uv - center) - radius * 0.82) / (radius * 0.18), 0.0, 1.0);
    float ins  = d < 0.0 ? 1.0 : 0.0;
    return vec3(d, limb, ins);
  }

  // ── Planet dust particles ────────────────────────────────────────────────────
  // Scatter gold specks across the planet surface (latitude/longitude texture)
  float planetDust(vec2 uv, vec2 center, float radius, float density) {
    vec2  local = (uv - center) / radius;  // [-1,1] within planet
    float r     = length(local);
    if (r > 1.0) return 0.0;

    // Map to spherical coords
    float lon = atan(local.y, local.x);
    float lat = asin(clamp(r, -1.0, 1.0));

    // Tile a high-frequency noise field on the sphere
    vec2 tileCoord = vec2(lon / PI, lat / (PI * 0.5)) * density;
    float n1 = noise2(tileCoord * 8.0 + vec2(1.3, 0.7));
    float n2 = noise2(tileCoord * 16.0 + vec2(0.2, 2.1));

    // Speckle: high-freq threshold
    float speckle = step(0.72, n1 * n2);

    // Concentration toward right/lit limb (x > 0 in local space)
    float limbConc = smoothstep(-0.2, 0.8, local.x);

    // Streak clusters (fault lines / ridges)
    float streak = smoothstep(0.85, 1.0, noise2(vec2(lon * 6.0, lat * 3.0) + uTime * 0.01));

    return (speckle + streak * 0.4) * limbConc * 0.9;
  }

  // ── Small receding spheres (left axis) ───────────────────────────────────────
  // Returns brightness of asteroid field along the central horizontal axis
  float asteroidField(vec2 uv, float aspect, float time) {
    float total = 0.0;
    // 6 spheres at increasing depth along the z-axis (represented as x-scale)
    float sizes[6];
    sizes[0] = 0.032; sizes[1] = 0.020; sizes[2] = 0.013;
    sizes[3] = 0.008; sizes[4] = 0.005; sizes[5] = 0.003;

    float xPositions[6];
    xPositions[0] = 0.12; xPositions[1] = 0.22; xPositions[2] = 0.30;
    xPositions[3] = 0.37; xPositions[4] = 0.43; xPositions[5] = 0.48;

    for (int i = 0; i < 6; i++) {
      float xi  = xPositions[i];
      float ri  = sizes[i];
      // Slight vertical drift with time (very slow)
      float yi  = 0.5 + sin(time * 0.05 + float(i) * 1.1) * 0.005;
      float d   = length(uv - vec2(xi, yi)) - ri;
      float brt = smoothstep(0.002, 0.0, d);
      // Slight teal/gold rim lighting
      float rim = smoothstep(ri * 1.2, ri, length(uv - vec2(xi, yi)));
      total += brt * 0.55 + rim * 0.15;
    }
    return clamp(total, 0.0, 1.0);
  }

  // ── Telemetry annotation "glow regions" ──────────────────────────────────────
  // Returns a soft glow field simulating floating text density
  float telemetryGlow(vec2 uv, float time) {
    float glow = 0.0;
    // 3 clusters of annotation density
    vec2 clusters[4];
    clusters[0] = vec2(0.36, 0.48);
    clusters[1] = vec2(0.44, 0.46);
    clusters[2] = vec2(0.52, 0.47);
    clusters[3] = vec2(0.42, 0.54);

    float widths[4];
    widths[0] = 0.055; widths[1] = 0.04; widths[2] = 0.035; widths[3] = 0.03;

    for (int i = 0; i < 4; i++) {
      float d = length((uv - clusters[i]) * vec2(2.0, 1.0)) / widths[i];
      glow += exp(-d * d) * (0.5 + 0.5 * sin(time * 0.2 + float(i) * 0.8));
    }
    return clamp(glow * 0.35, 0.0, 1.0);
  }

  // ── Background star field ────────────────────────────────────────────────────
  float starField(vec2 uv, float time) {
    // Two layers of sparse stars at different scales
    float s1 = step(0.992, hash1v(floor(uv * 120.0)));
    float s2 = step(0.988, hash1v(floor(uv * 80.0 + 37.3)));
    // Slow twinkle
    float twinkle = 0.7 + 0.3 * sin(time * 0.8 + hash1v(floor(uv * 120.0)) * TAU);
    return (s1 + s2 * 0.6) * twinkle;
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  void main() {
    vec2 uv      = vUv;
    float aspect = uResolution.x / uResolution.y;
    // NDC: [-aspect,+aspect] × [-1,+1], horizon at y=0
    vec2 ndc = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;

    float time = uTime;

    // ── 1. Background ──
    vec3 col = BG;

    // ── 2. Star field ──
    float stars = starField(uv, time);
    col += stars * vec3(0.70, 0.68, 0.55) * 0.6;

    // ── 3. Perspective grid (amber/gold, fine lines) ──
    vec2  gridVal   = perspGrid(ndc, aspect, time, uGridDensity);
    float gridBrt   = gridVal.x;
    // Primary grid lines: gold, dim
    col += GOLD_DIM * gridBrt * 0.55;

    // Accent: a single bright horizontal horizon line
    float horizLine = smoothstep(0.008, 0.0, abs(uv.y - 0.5)) * 0.5;
    col += GOLD * horizLine * 0.4;

    // ── 4. Planet (right-centre, large) ──
    // Planet centre in UV space: x≈0.74, y≈0.48 — matches image
    float pScale  = uPlanetScale;
    vec2  pCentre = vec2(0.74, 0.48);
    float pRadius = 0.30 * pScale;

    vec3  pResult = planetSDF(uv, pCentre, pRadius);
    float pDist   = pResult.x;
    float pLimb   = pResult.y;
    float pInside = pResult.z;

    // Planet body: very dark, slightly textured
    if (pInside > 0.5) {
      // Base dark body with very subtle surface noise
      vec2  pLocal  = (uv - pCentre) / pRadius;
      float surfN   = noise2(pLocal * 4.0 + time * 0.02) * 0.5
                    + noise2(pLocal * 9.0 + time * 0.015) * 0.25;
      vec3  bodyCol = BG + vec3(0.02, 0.025, 0.018) * surfN;
      col = mix(col, bodyCol, 1.0);

      // Gold particle dust
      float dust = planetDust(uv, pCentre, pRadius, uDustDensity * 12.0 + 6.0);
      col += DUST * dust * 0.7;
    }

    // Teal atmospheric limb glow (very thin ring outside the planet)
    float limbGlow = smoothstep(0.0, -0.025 * pRadius, pDist)
                   * smoothstep(-0.06 * pRadius, 0.0, pDist);
    col += TEAL * limbGlow * 0.55;

    // Outer soft halo
    float halo = exp(-max(pDist, 0.0) / (0.12 * pRadius));
    col += TEAL * halo * 0.07;

    // ── 5. Small asteroid spheres (left, receding along z-axis) ──
    float asteroids = asteroidField(uv, aspect, time);
    col += asteroids * (GOLD_DIM + BG * 0.3);

    // Horizontal "z-axis beam" connecting the asteroid chain
    float beam = exp(-pow((uv.y - 0.5) * 40.0, 2.0))
               * smoothstep(0.55, 0.10, uv.x)
               * smoothstep(0.10, 0.55, uv.x)
               * 0.12;
    col += GOLD_DIM * beam;

    // ── 6. Telemetry glow regions ──
    float tel = telemetryGlow(uv, time);
    col += GOLD * tel * 0.18;

    // ── 7. Subtle chromatic aberration ──
    if (uAberration > 0.001) {
      float str  = uAberration * 0.012;
      vec2  dir  = (uv - 0.5) * str;
      // Red channel shifted outward, blue inward
      float rOff = noise2(uv * 3.0 + time * 0.1) * str * 0.5;
      col.r = clamp(col.r + rOff, 0.0, 1.0);
      col.b = clamp(col.b - rOff * 0.5, 0.0, 1.0);
    }

    // ── 8. Screen-edge vignette ──
    vec2  vigUv = (uv - 0.5) * 2.0;
    float vig   = 1.0 - dot(vigUv * 0.55, vigUv * 0.55);
    vig = clamp(vig, 0.0, 1.0);
    col *= 0.30 + 0.70 * vig;

    // ── 9. Tone map + gamma ──
    col  = col / (col + 0.4);
    col  = pow(max(col, 0.0), vec3(1.0 / 2.2));

    gl_FragColor = vec4(col, 1.0);
  }
`
