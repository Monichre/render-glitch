/**
 * ParticleRenderShader.ts
 * Vertex + fragment shaders for the GPGPU particle render pass.
 * Reads from DataTextures; outputs spectral-tinted, bloom-ready particles.
 */

export const ParticleRenderVertexShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  uniform sampler2D positionTexture;
  uniform sampler2D velocityTexture;
  uniform sampler2D spectrumTexture;
  uniform sampler2D lifeTexture;
  uniform float     time;
  uniform float     qOrder;
  uniform float     particleSizeMin;
  uniform float     particleSizeMax;

  attribute vec2 particleUV;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vFAlpha;
  varying float vSpeed;
  varying float vLifeRatio;

  // Convert HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec4 posData  = texture2D(positionTexture, particleUV);
    vec4 velData  = texture2D(velocityTexture, particleUV);
    vec4 specData = texture2D(spectrumTexture, particleUV);
    vec4 lifeData = texture2D(lifeTexture,     particleUV);

    vec3  pos      = posData.xyz;
    vSpeed         = velData.w;
    vAlpha         = specData.x;   // Hölder exponent
    vFAlpha        = specData.y;   // f(α)
    float Dq       = specData.z;
    float age      = lifeData.x;
    float lifespan = lifeData.y;
    vLifeRatio     = clamp(age / max(lifespan, 0.001), 0.0, 1.0);

    // Hue: map alpha [0.2..2.5] → teal (0.50) to cyan (0.55) to amber (0.12)
    float t    = clamp((vAlpha - 0.2) / 2.3, 0.0, 1.0);
    float hue  = mix(0.50, 0.12, t);
    float sat  = 0.7 + Dq * 0.2;
    float val  = 0.5 + vFAlpha * 0.5;

    // q-order shifts saturation — strong singularities (q>0) = brighter
    if (qOrder > 0.0) {
      val += 0.15 * (qOrder / 10.0);
    } else {
      hue = mix(hue, 0.65, abs(qOrder) / 10.0); // cool blue for weak singularities
    }

    vColor = hsv2rgb(vec3(fract(hue), clamp(sat, 0.3, 1.0), clamp(val, 0.2, 1.0)));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Size: f(α) peak → largest; fade at birth and death
    float baseSize   = mix(particleSizeMin, particleSizeMax, vFAlpha);
    float lifeFade   = sin(vLifeRatio * 3.14159); // ramp up then down
    float speedBoost = 1.0 + clamp(vSpeed * 0.4, 0.0, 1.5);
    float finalSize  = baseSize * lifeFade * speedBoost * (300.0 / -gl_Position.z);

    gl_PointSize = clamp(finalSize, 1.0, 32.0);
  }
`

export const ParticleRenderFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vFAlpha;
  varying float vSpeed;
  varying float vLifeRatio;

  uniform float opacity;
  uniform float qOrder;

  void main() {
    // Soft circular disc
    vec2  uv   = gl_PointCoord * 2.0 - 1.0;
    float dist = dot(uv, uv);
    if (dist > 1.0) discard;

    // Soft glow falloff
    float glow = 1.0 - smoothstep(0.0, 1.0, dist);
    glow = pow(glow, mix(1.5, 3.0, 1.0 - vFAlpha));

    // Spectrum glow boost: bright at f(α) peak, dim at tails
    float spectrumGlow = vFAlpha * clamp(vSpeed * 0.5, 0.2, 1.2);
    if (qOrder > 0.0) spectrumGlow *= 1.4;

    // Life fade at ends
    float lifeFade = sin(vLifeRatio * 3.14159);

    vec3 finalColor = vColor * (1.0 + spectrumGlow * 0.8);
    float finalAlpha = glow * opacity * lifeFade;

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`
