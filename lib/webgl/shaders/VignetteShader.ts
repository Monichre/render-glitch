export const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 0.5 },
    offset: { value: 1.0 },
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
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Compute distance from center
      vec2 center = vUv - 0.5;
      float dist = length(center);
      
      // Create smooth vignette
      float vignette = smoothstep(0.8, offset * 0.5, dist * (darkness + offset));
      
      // Apply vignette
      color.rgb *= vignette;
      
      // Add subtle blue tint to dark areas
      float darknessAmount = 1.0 - vignette;
      color.rgb += vec3(0.0, 0.02, 0.04) * darknessAmount;
      
      gl_FragColor = color;
    }
  `,
}
