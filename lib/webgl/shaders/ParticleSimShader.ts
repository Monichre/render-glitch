/**
 * ParticleSimShader.ts
 * GPGPU fragment shader — position/velocity/life/spectrum simulation.
 * Runs once per particle per frame via DataTexture ping-pong.
 */
import { MULTIFRACTAL_GLSL } from "./MultifractalShader"

export const ParticleSimVertexShader = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const ParticleSimFragmentShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  uniform sampler2D positionTexture;
  uniform sampler2D velocityTexture;
  uniform sampler2D lifeTexture;
  uniform sampler2D spectrumTexture;

  uniform vec2  resolution;
  uniform float time;
  uniform float delta;
  uniform float qOrder;
  uniform float epsilon;
  uniform float gravityStrength;
  uniform float windStrength;
  uniform float physicsMultiplier;
  uniform vec3  attractorPos;
  uniform float attractorStrength;
  uniform int   templateID;
  uniform int   pass;       // 0=position, 1=velocity, 2=life, 3=spectrum

  // Inject multifractal GLSL library
  ${MULTIFRACTAL_GLSL}

  // ----------------------------------------------------------------
  // Wind — Perlin octaves scaled by Dq
  // ----------------------------------------------------------------
  vec3 computeWind(vec3 pos, float t, float Dq) {
    float s = windStrength * (0.5 + Dq * 0.5);
    return vec3(
      snoise_mf(pos.xz * 0.08 + t * 0.25) * s,
      snoise_mf(pos.xy * 0.06 + t * 0.18 + 50.0) * s * 0.3,
      snoise_mf(pos.yz * 0.08 + t * 0.22 + 100.0) * s
    );
  }

  // ----------------------------------------------------------------
  // Template-specific spawn positions
  // ----------------------------------------------------------------
  vec3 spawnPosition(float seed, int tID, float t) {
    float r1 = pseudorandom(seed);
    float r2 = pseudorandom(seed + 1.0);
    float r3 = pseudorandom(seed + 2.0);
    float r4 = pseudorandom(seed + 3.0);

    // 0 Heart
    if (tID == 0) {
      float angle = r1 * 6.2832;
      float x = 16.0 * pow(sin(angle), 3.0);
      float y = 13.0 * cos(angle) - 5.0*cos(2.0*angle) - 2.0*cos(3.0*angle) - cos(4.0*angle);
      return vec3(x, y, (r3 - 0.5) * 2.0) * 0.25;
    }
    // 1 Flower / Fibonacci spiral
    if (tID == 1) {
      float n   = r1 * 800.0;
      float phi = 2.399963 * n;
      float rad = sqrt(n / 800.0) * 8.0;
      return vec3(cos(phi)*rad, (r3-0.5)*1.5, sin(phi)*rad);
    }
    // 2 Galaxy spiral
    if (tID == 2) {
      float arm   = floor(r4 * 3.0);
      float theta = r1 * 12.0 + arm * 2.094;
      float rad   = 1.5 + r2 * 14.0;
      float x     = cos(theta + log(rad)*0.5) * rad;
      float z     = sin(theta + log(rad)*0.5) * rad;
      return vec3(x, (r3-0.5)*1.2, z);
    }
    // 3 DNA helix
    if (tID == 3) {
      float strand = step(0.5, r4);
      float ht = r1 * 16.0 - 8.0;
      float a  = ht * 1.5 + strand * 3.14159;
      return vec3(cos(a)*1.5, ht, sin(a)*1.5);
    }
    // 4 Sphere shell
    if (tID == 4) {
      float phi2   = acos(2.0*r1 - 1.0);
      float theta2 = r2 * 6.2832;
      float rad2   = 5.0 + (r3-0.5)*0.8;
      return vec3(sin(phi2)*cos(theta2)*rad2, sin(phi2)*sin(theta2)*rad2, cos(phi2)*rad2);
    }
    // 5 Torus knot
    if (tID == 5) {
      float p = 2.0; float q2 = 3.0;
      float angle = r1 * 6.2832;
      float r_big = 4.0; float r_small = 1.5;
      float x = (r_big + r_small * cos(q2*angle)) * cos(p*angle);
      float y = (r_big + r_small * cos(q2*angle)) * sin(p*angle);
      float z = r_small * sin(q2*angle);
      return vec3(x,y,z) * 0.7 + vec3((r2-0.5),(r3-0.5),(r4-0.5))*0.3;
    }
    // 6 Lorenz attractor
    if (tID == 6) {
      float lx = (r1-0.5)*40.0;
      float ly = (r2-0.5)*40.0;
      float lz = r3 * 50.0;
      // Rough attractor region seeding
      return vec3(lx, ly - 10.0, lz) * 0.18;
    }
    // 7 Sierpinski/Fractal IFS
    if (tID == 7) {
      vec3 p3 = vec3(r1, r2, r3) * 6.0 - 3.0;
      for (int i = 0; i < 6; i++) {
        p3 = abs(p3);
        if (p3.x < p3.y) p3.xy = p3.yx;
        if (p3.x < p3.z) p3.xz = p3.zx;
        if (p3.y < p3.z) p3.yz = p3.zy;
        p3 = p3 * 2.0 - 1.0;
      }
      return p3 * 0.5;
    }
    // 8 Möbius strip
    if (tID == 8) {
      float u = r1 * 6.2832;
      float v = (r2-0.5) * 2.0;
      float R = 4.0;
      return vec3(
        (R + v*0.5*cos(u*0.5)) * cos(u),
        v * 0.5 * sin(u * 0.5),
        (R + v*0.5*cos(u*0.5)) * sin(u)
      );
    }
    // 9 Planetary rings
    if (tID == 9) {
      float theta3 = r1 * 6.2832;
      float rad3   = 4.0 + r2 * 6.0;
      float e      = 0.15;
      float rk     = rad3 * (1.0 - e*e) / (1.0 + e*cos(theta3));
      return vec3(cos(theta3)*rk, (r3-0.5)*0.4, sin(theta3)*rk);
    }
    // Fractal templates 10-24: multifractal-seeded emission
    float phi3   = acos(2.0*r1 - 1.0);
    float theta4 = r2 * 6.2832;
    float rad4   = 2.0 + r3 * 8.0;
    // Perturb radial distribution by qOrder bias (seeded)
    rad4 *= 0.5 + pseudorandom(seed + float(tID) * 13.7) * 1.5;
    return vec3(
      sin(phi3)*cos(theta4)*rad4,
      sin(phi3)*sin(theta4)*rad4 * 0.6,
      cos(phi3)*rad4
    );
  }

  vec3 spawnVelocity(float seed, int tID) {
    float r1 = pseudorandom(seed + 10.0);
    float r2 = pseudorandom(seed + 11.0);
    float r3 = pseudorandom(seed + 12.0);
    vec3 base = vec3(r1-0.5, r2-0.5, r3-0.5) * 0.5;

    if (tID == 6) {
      // Lorenz init — small perturbation for attractor seeding
      base = vec3(0.01, 0.01, 0.0) + base * 0.1;
    }
    return base;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    vec4 posData  = texture2D(positionTexture,  uv);
    vec4 velData  = texture2D(velocityTexture,  uv);
    vec4 lifeData = texture2D(lifeTexture,      uv);
    vec4 specData = texture2D(spectrumTexture,  uv);

    vec3  pos      = posData.xyz;
    vec3  vel      = velData.xyz;
    float age      = lifeData.x;
    float lifespan = lifeData.y;
    float tIDf     = lifeData.z;
    float spawnSeed= lifeData.w;
    float alpha    = specData.x;
    float fAlpha   = specData.y;
    float Dq       = specData.z;
    float tau      = specData.w;

    int tID = int(tIDf);

    // ---- Recompute spectrum for current position ----
    float newAlpha  = holderExponent(pos, qOrder, epsilon);
    float newFAlpha = spectrumFAlpha(pos, qOrder, epsilon);
    float newDq     = generalizedDimension(pos, qOrder, epsilon);
    float newTau    = massExponent(pos, qOrder, epsilon);

    // ---- Forces ----
    vec3 force = vec3(0.0);

    // Gravity
    force.y -= 9.8 * gravityStrength;

    // Wind (Perlin, scaled by Dq)
    force += computeWind(pos, time, newDq);

    // Multifractal gradient force
    force += multifractalForce(pos, qOrder, epsilon, 0.6);

    // Attractor (gesture-driven)
    vec3 toAttr = attractorPos - pos;
    float attrDist = length(toAttr);
    force += normalize(toAttr) * attractorStrength * newFAlpha
             / max(attrDist * attrDist * 0.1, 0.5);

    // Boids flocking proxy — weak cohesion toward origin scaled by 1-alpha
    force += normalize(-pos + 0.001) * (1.0 - clamp(newAlpha, 0.1, 2.0)) * 0.15;

    force *= physicsMultiplier;

    // ---- Semi-implicit Euler integration ----
    vel += force * delta;
    vel *= mix(0.97, 0.99, clamp(newAlpha, 0.0, 1.0)); // drag varies with alpha
    pos += vel * delta;

    // ---- Boundary: soft spherical wrap at radius 20 ----
    float dist = length(pos);
    if (dist > 18.0) {
      pos = normalize(pos) * (18.0 - 0.5);
      vel = reflect(vel, -normalize(pos)) * 0.3;
    }

    // ---- Respawn if dead ----
    age += delta;
    if (age > lifespan || dist > 22.0) {
      pos      = spawnPosition(spawnSeed, tID, time);
      vel      = spawnVelocity(spawnSeed, tID);
      age      = 0.0;
      lifespan = paretoLifespan(spawnSeed + time, newAlpha);
    }

    // ---- Write outputs (selected by pass uniform) ----
    if (pass == 0) {
      gl_FragColor = vec4(pos, 1.0);
    } else if (pass == 1) {
      gl_FragColor = vec4(vel, length(vel));
    } else if (pass == 2) {
      gl_FragColor = vec4(age, lifespan, tIDf, spawnSeed);
    } else {
      gl_FragColor = vec4(newAlpha, newFAlpha, newDq, newTau);
    }
  }
`
