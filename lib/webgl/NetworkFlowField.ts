/**
 * NetworkFlowField.ts
 *
 * Replicates the TSL `network` sketch in vanilla Three.js / WebGL.
 *
 * Architecture mirrors the original:
 *   flowFieldBuffer[instanceIndex] = angles.element(floor(hash(instanceIndex) * 5))
 *
 * Here:
 *   - instanceAngle attribute  = precomputed per-instance angle (replaces flowFieldBuffer)
 *   - instanceOffset attribute = 2D grid position (replaces the FlowField layout)
 *   - rows=32, columns=16 → 512 instances  (matching FlowField defaults)
 *   - flowFieldAngles=[1,1,1] → all buckets equally weighted (hash selects uniformly)
 *
 * The arrow glyph is a thin stem + chevron, built as indexed triangle geometry.
 * Instancing is done via InstancedMesh with per-instance float attributes injected
 * via BufferGeometry.setAttribute.
 */

import * as THREE from "three"
import {
  NetworkFlowFieldVertexShader,
  NetworkFlowFieldFragmentShader,
  NETWORK_ANGLES,
} from "./shaders/NetworkFlowFieldShader"

// ---------------------------------------------------------------------------
// Hash — matches Three TSL hash(instanceIndex) output range [0,1)
// A simple float hash that produces values in [0,1) for any uint32
// ---------------------------------------------------------------------------
function hashFloat(n: number): number {
  // Wang hash
  n = ((n >> 16) ^ n) * 0x45d9f3b
  n = ((n >> 16) ^ n) * 0x45d9f3b
  n = (n >> 16) ^ n
  // Normalize to [0,1) — use unsigned interpretation
  return (n >>> 0) / 4294967296
}

// ---------------------------------------------------------------------------
// Build arrow glyph geometry (local space, fits in [-0.5, 0.5] × [-0.5, 0.5])
// ---------------------------------------------------------------------------
function buildArrowGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()

  // Stem: a thin rectangle along +X axis from x=-0.35 to x=0.20
  // Head: a chevron (two triangles) from x=0.15 to x=0.50
  const STEM_HALF_W = 0.04
  const STEM_X0     = -0.40
  const STEM_X1     =  0.18
  const HEAD_X0     =  0.08
  const HEAD_X1     =  0.48
  const HEAD_HALF_W =  0.22

  // Positions (x, y, 0)
  const positions: number[] = []
  const uvs:       number[] = []
  const indices:   number[] = []

  let vi = 0 // vertex index counter

  // Helper: push quad (x0,y0) → (x1,y1) as 2 triangles
  const pushQuad = (x0: number, y0: number, x1: number, y1: number, u0 = 0, u1 = 1, v0 = 0, v1 = 1) => {
    const base = vi
    positions.push(x0, y0, 0,  x1, y0, 0,  x1, y1, 0,  x0, y1, 0)
    uvs.push(u0, v0,  u1, v0,  u1, v1,  u0, v1)
    indices.push(base, base + 1, base + 2,  base, base + 2, base + 3)
    vi += 4
  }

  // Stem
  pushQuad(STEM_X0, -STEM_HALF_W, STEM_X1, STEM_HALF_W, 0, HEAD_X1, 0, 1)

  // Chevron head — two triangles forming a ">" shape
  // Left wing: tip at (HEAD_X1, 0), base at (HEAD_X0, ±HEAD_HALF_W)
  const base = vi
  positions.push(
    HEAD_X0,  HEAD_HALF_W, 0,   // 0 top-left
    HEAD_X1,  0,           0,   // 1 tip
    HEAD_X0, -HEAD_HALF_W, 0,   // 2 bottom-left
    HEAD_X0 + 0.10,  HEAD_HALF_W * 0.35, 0, // 3 inner top
    HEAD_X0 + 0.10, -HEAD_HALF_W * 0.35, 0, // 4 inner bottom
  )
  uvs.push(
    HEAD_X0 + 0.5, 0,
    1.0,           0.5,
    HEAD_X0 + 0.5, 1,
    0.7,           0.35,
    0.7,           0.65,
  )
  // Outer triangles (chevron wings)
  indices.push(base, base + 1, base + 3)   // top wing outer
  indices.push(base + 1, base + 2, base + 4) // bottom wing outer
  // Inner fill between wings
  indices.push(base + 3, base + 1, base + 4)
  vi += 5

  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv",       new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return geo
}

// ---------------------------------------------------------------------------
// NetworkFlowField
// ---------------------------------------------------------------------------
export class NetworkFlowField {
  mesh:    THREE.Mesh
  material: THREE.ShaderMaterial
  scene:   THREE.Scene

  private rows:    number
  private columns: number
  private clock:   THREE.Clock

  constructor(scene: THREE.Scene, rows = 32, columns = 16) {
    this.scene   = scene
    this.rows    = rows
    this.columns = columns
    this.clock   = new THREE.Clock()

    const count     = rows * columns
    const glyph     = buildArrowGeometry()

    // Per-instance attributes
    const angles  = new Float32Array(count)
    const offsets = new Float32Array(count * 2)

    // Cell size in world-space units (fit to [-8, 8] × [-4, 4] window)
    const cellW = 16 / columns
    const cellH =  8 / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const i = r * columns + c

        // Replicate: angle = angles.element(floor(hash(instanceIndex) * 5))
        const bucket = Math.floor(hashFloat(i) * 5)
        angles[i]    = NETWORK_ANGLES[Math.min(bucket, 4)]

        // Grid position centred at origin
        offsets[i * 2]     = (c + 0.5) * cellW - 8         // x
        offsets[i * 2 + 1] = (r + 0.5) * cellH - 4         // y
      }
    }

    // Merge per-instance data into a single InstancedBufferGeometry
    const instGeo = new THREE.InstancedBufferGeometry()
    instGeo.index          = glyph.index
    instGeo.attributes     = { ...glyph.attributes }  // copy position, uv, normal
    instGeo.instanceCount  = count

    instGeo.setAttribute("instanceAngle",  new THREE.InstancedBufferAttribute(angles,  1))
    instGeo.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 2))

    this.material = new THREE.ShaderMaterial({
      vertexShader:   NetworkFlowFieldVertexShader,
      fragmentShader: NetworkFlowFieldFragmentShader,
      uniforms: {
        uTime:     { value: 0 },
        uCellSize: { value: Math.min(cellW, cellH) },
      },
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
      side:           THREE.DoubleSide,
    })

    this.mesh      = new THREE.Mesh(instGeo, this.material)
    this.mesh.name = "networkFlowField"
    this.mesh.frustumCulled = false
    scene.add(this.mesh)
  }

  /** Call every frame with elapsed time in seconds */
  update(elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed
  }

  /** Randomize per-instance angles (simulates flowFieldFn re-evaluation) */
  rerandomize(): void {
    const count   = this.rows * this.columns
    const angles  = new Float32Array(count)
    const seed    = Math.random() * 10000 | 0

    for (let i = 0; i < count; i++) {
      const bucket = Math.floor(hashFloat(i ^ seed) * 5)
      angles[i]    = NETWORK_ANGLES[Math.min(bucket, 4)]
    }

    const instGeo = this.mesh.geometry as THREE.InstancedBufferGeometry
    const attr    = instGeo.getAttribute("instanceAngle") as THREE.InstancedBufferAttribute
    attr.array    = angles
    attr.needsUpdate = true
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.scene.remove(this.mesh)
  }
}
