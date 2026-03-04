/**
 * NetworkFlowFieldShader.ts
 * Replicates the TSL `network` sketch using raw GLSL.
 *
 * Each instance is assigned one of 5 quantized angles:
 *   { 0°, 90°, 180°, 270°, 360° }
 * via:  index = floor(hash(instanceIndex) * 5)
 *
 * The vertex shader rotates a unit arrow glyph by that angle
 * and adds a time-based flow animation. The fragment shader
 * draws the arrow with a teal-primary glow matching the project palette.
 */

export const NETWORK_ANGLES = [0, 90, 180, 270, 360].map((d) => (d * Math.PI) / 180)

export const NetworkFlowFieldVertexShader = /* glsl */ `
  attribute float instanceAngle;
  attribute vec2  instanceOffset;  // grid position in [-1,1] NDC-like space

  uniform float uTime;
  uniform float uCellSize;

  varying float vAngle;
  varying float vAlpha;
  varying vec2  vUv;

  // Arrow glyph: a thin stem + chevron head, all in [-0.5, 0.5] local space
  // position.x = along shaft, position.y = lateral
  // We encode the glyph as a set of triangles via the geometry buffer.

  void main() {
    vUv    = uv;
    vAngle = instanceAngle;

    // Subtle per-instance pulse driven by angle bucket + time
    float bucket  = floor(instanceAngle / (3.14159265 * 0.5) + 0.5);
    float pulse   = sin(uTime * 1.4 + bucket * 1.3 + instanceOffset.x * 2.1 + instanceOffset.y * 1.7) * 0.5 + 0.5;
    vAlpha = 0.35 + pulse * 0.55;

    // Rotate local glyph by instanceAngle
    float s = sin(instanceAngle);
    float c = cos(instanceAngle);
    vec2 rotated = vec2(
      position.x * c - position.y * s,
      position.x * s + position.y * c
    );

    // Scale to cell size and translate to grid position
    vec2 worldPos = rotated * uCellSize * 0.38 + instanceOffset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 0.0, 1.0);
  }
`

export const NetworkFlowFieldFragmentShader = /* glsl */ `
  uniform float uTime;

  varying float vAngle;
  varying float vAlpha;
  varying vec2  vUv;

  void main() {
    // Map angle bucket to teal/cyan/amber palette matching project tokens
    // 0°   -> primary teal   oklch(0.75 0.15 180) -> ~#40d9c0
    // 90°  -> cyan           oklch(0.70 0.18 200) -> ~#22c8e8
    // 180° -> accent         oklch(0.70 0.12 200) -> ~#4ab8d8
    // 270° -> warning amber  oklch(0.75 0.18 80)  -> ~#dba840
    // 360° -> primary teal (same as 0°)
    float bucket = mod(floor(vAngle / (3.14159265 * 0.5) + 0.01), 4.0);

    vec3 col;
    if (bucket < 0.5) {
      col = vec3(0.25, 0.85, 0.75);   // teal
    } else if (bucket < 1.5) {
      col = vec3(0.13, 0.78, 0.91);   // cyan
    } else if (bucket < 2.5) {
      col = vec3(0.29, 0.72, 0.85);   // accent blue-cyan
    } else {
      col = vec3(0.86, 0.66, 0.25);   // warning amber
    }

    // Soft glow: fade edges of the glyph along vUv.y (lateral)
    float edgeFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
    edgeFade = pow(max(edgeFade, 0.0), 1.6);

    // Head brightness boost at tip (vUv.x near 1.0)
    float headBoost = smoothstep(0.7, 1.0, vUv.x) * 0.6;

    float alpha = vAlpha * edgeFade;
    vec3  finalCol = col * (1.0 + headBoost);

    gl_FragColor = vec4(finalCol, alpha);
  }
`
