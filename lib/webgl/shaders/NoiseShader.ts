export const NoiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.05 },
    speed: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float speed;
    varying vec2 vUv;

    // Improved noise function
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Film grain noise
      float grain = noise(vUv * 500.0 + time * speed * 10.0) * amount;
      
      // Scanline effect (subtle)
      float scanline = sin(vUv.y * 800.0 + time * 2.0) * 0.02 * amount;
      
      // Vignette
      vec2 center = vUv - 0.5;
      float vignette = 1.0 - dot(center, center) * 0.5;
      
      // Apply effects
      color.rgb += grain - amount * 0.5;
      color.rgb += scanline;
      color.rgb *= vignette;
      
      // Subtle color grading - push towards cyan in shadows
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec3 shadowTint = vec3(0.0, 0.05, 0.08);
      color.rgb += shadowTint * (1.0 - luminance) * 0.15;
      
      gl_FragColor = color;
    }
  `,
}
