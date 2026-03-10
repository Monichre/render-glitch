/**
 * GPGPUCompute.ts
 * DataTexture ping-pong manager for 500k+ particle GPU simulation.
 * Four texture pairs: Position, Velocity, Life, Spectrum.
 * Uses a dedicated fullscreen-quad render pipeline per pass.
 */

import * as THREE from "three"
import {
  ParticleSimVertexShader,
  ParticleSimFragmentShader,
} from "./shaders/ParticleSimShader"
import {
  ParticleRenderVertexShader,
  ParticleRenderFragmentShader,
} from "./shaders/ParticleRenderShader"

// Texture resolution: 768×768 = 589,824 ≥ 500,000
const TEX_SIZE = 768

export interface GPGPUUniforms {
  qOrder:           number
  epsilon:          number
  gravityStrength:  number
  windStrength:     number
  physicsMultiplier:number
  attractorPos:     THREE.Vector3
  attractorStrength:number
  templateID:       number
  particleSizeMin:  number
  particleSizeMax:  number
  opacity:          number
}

const createDataTexture = (width: number, height: number): THREE.DataTexture => {
  const data = new Float32Array(width * height * 4)
  const tex  = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true
  return tex
}

const createRenderTarget = (width: number, height: number): THREE.WebGLRenderTarget =>
  new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format:    THREE.RGBAFormat,
    type:      THREE.FloatType,
    depthBuffer: false,
    stencilBuffer: false,
  })

export class GPGPUCompute {
  private renderer: THREE.WebGLRenderer

  // Ping-pong pairs
  private posRT:  [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private velRT:  [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private lifeRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private specRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private readIdx = 0

  // Sim shader materials (one per pass type)
  private simMaterials: THREE.ShaderMaterial[]

  // Render geometry (fullscreen quad for sim)
  private simScene:  THREE.Scene
  private simCamera: THREE.OrthographicCamera
  private simMesh:   THREE.Mesh

  // Particle render (points geometry)
  private renderGeometry: THREE.BufferGeometry
  private renderMaterial: THREE.ShaderMaterial
  public  renderPoints:   THREE.Points

  // Particle count (can be reduced for LOD)
  public particleCount: number

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer      = renderer
    this.particleCount = TEX_SIZE * TEX_SIZE

    // ---- Ping-pong render targets ----
    this.posRT  = [createRenderTarget(TEX_SIZE, TEX_SIZE), createRenderTarget(TEX_SIZE, TEX_SIZE)]
    this.velRT  = [createRenderTarget(TEX_SIZE, TEX_SIZE), createRenderTarget(TEX_SIZE, TEX_SIZE)]
    this.lifeRT = [createRenderTarget(TEX_SIZE, TEX_SIZE), createRenderTarget(TEX_SIZE, TEX_SIZE)]
    this.specRT = [createRenderTarget(TEX_SIZE, TEX_SIZE), createRenderTarget(TEX_SIZE, TEX_SIZE)]

    // ---- Initialize textures with spawn data ----
    this.initializeTextures()

    // ---- Fullscreen quad for sim passes ----
    this.simScene  = new THREE.Scene()
    this.simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const quadGeo = new THREE.PlaneGeometry(2, 2)

    // Create 4 sim materials (one per pass: pos, vel, life, spectrum)
    this.simMaterials = [0, 1, 2, 3].map(pass =>
      new THREE.ShaderMaterial({
        uniforms: {
          positionTexture:  { value: null },
          velocityTexture:  { value: null },
          lifeTexture:      { value: null },
          spectrumTexture:  { value: null },
          resolution:       { value: new THREE.Vector2(TEX_SIZE, TEX_SIZE) },
          time:             { value: 0 },
          delta:            { value: 0.016 },
          qOrder:           { value: 2.0 },
          epsilon:          { value: 0.3 },
          gravityStrength:  { value: 0.05 },
          windStrength:     { value: 0.3 },
          physicsMultiplier:{ value: 1.0 },
          attractorPos:     { value: new THREE.Vector3() },
          attractorStrength:{ value: 0.0 },
          templateID:       { value: 0 },
          pass:             { value: pass },
        },
        vertexShader:   ParticleSimVertexShader,
        fragmentShader: ParticleSimFragmentShader,
        depthWrite:     false,
        depthTest:      false,
      })
    )

    this.simMesh = new THREE.Mesh(quadGeo, this.simMaterials[0])
    this.simScene.add(this.simMesh)

    // ---- Particle render geometry ----
    const N   = TEX_SIZE * TEX_SIZE
    const uvs = new Float32Array(N * 2)
    for (let i = 0; i < N; i++) {
      uvs[i * 2]     = (i % TEX_SIZE + 0.5) / TEX_SIZE
      uvs[i * 2 + 1] = (Math.floor(i / TEX_SIZE) + 0.5) / TEX_SIZE
    }

    this.renderGeometry = new THREE.BufferGeometry()
    this.renderGeometry.setAttribute("position",   new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    this.renderGeometry.setAttribute("particleUV", new THREE.BufferAttribute(uvs, 2))

    this.renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        velocityTexture: { value: null },
        spectrumTexture: { value: null },
        lifeTexture:     { value: null },
        time:            { value: 0 },
        qOrder:          { value: 2.0 },
        particleSizeMin: { value: 0.5 },
        particleSizeMax: { value: 4.0 },
        opacity:         { value: 0.8 },
      },
      vertexShader:   ParticleRenderVertexShader,
      fragmentShader: ParticleRenderFragmentShader,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
    })

    this.renderPoints = new THREE.Points(this.renderGeometry, this.renderMaterial)
    this.renderPoints.frustumCulled = false
  }

  private initializeTextures(): void {
    // Seed position texture with sphere-distributed spawn positions
    const seedPos  = new Float32Array(TEX_SIZE * TEX_SIZE * 4)
    const seedVel  = new Float32Array(TEX_SIZE * TEX_SIZE * 4)
    const seedLife = new Float32Array(TEX_SIZE * TEX_SIZE * 4)
    const seedSpec = new Float32Array(TEX_SIZE * TEX_SIZE * 4)

    const goldenAngle = 2.399963
    for (let i = 0; i < TEX_SIZE * TEX_SIZE; i++) {
      const i4 = i * 4

      // Fibonacci sphere distribution
      const y   = 1 - (i / (TEX_SIZE * TEX_SIZE - 1)) * 2
      const r   = Math.sqrt(Math.max(1 - y * y, 0)) * (4 + Math.random() * 10)
      const phi = goldenAngle * i
      seedPos[i4]     = Math.cos(phi) * r
      seedPos[i4 + 1] = y * 10
      seedPos[i4 + 2] = Math.sin(phi) * r
      seedPos[i4 + 3] = 1.0

      seedVel[i4]     = (Math.random() - 0.5) * 0.3
      seedVel[i4 + 1] = (Math.random() - 0.5) * 0.3
      seedVel[i4 + 2] = (Math.random() - 0.5) * 0.3
      seedVel[i4 + 3] = 0.3

      seedLife[i4]     = Math.random() * 4.0  // age (randomized at start)
      seedLife[i4 + 1] = 2.0 + Math.random() * 8.0 // lifespan
      seedLife[i4 + 2] = 0.0  // templateID
      seedLife[i4 + 3] = Math.random() * 10000  // spawnSeed

      seedSpec[i4]     = 0.8 + Math.random() * 0.8  // alpha (Hölder)
      seedSpec[i4 + 1] = 0.3 + Math.random() * 0.7  // f(alpha)
      seedSpec[i4 + 2] = 0.5 + Math.random() * 1.0  // Dq
      seedSpec[i4 + 3] = 0.0  // tau
    }

    // Upload to both ping-pong slots via DataTexture → blit
    const upload = (data: Float32Array, rts: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]) => {
      const tex = new THREE.DataTexture(data, TEX_SIZE, TEX_SIZE, THREE.RGBAFormat, THREE.FloatType)
      tex.minFilter = THREE.NearestFilter
      tex.magFilter = THREE.NearestFilter
      tex.needsUpdate = true

      const blitMat    = new THREE.MeshBasicMaterial({ map: tex })
      const blitScene  = new THREE.Scene()
      const blitCam    = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      const blitQuad   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blitMat)
      blitScene.add(blitQuad)

      this.renderer.setRenderTarget(rts[0])
      this.renderer.render(blitScene, blitCam)
      this.renderer.setRenderTarget(rts[1])
      this.renderer.render(blitScene, blitCam)
      this.renderer.setRenderTarget(null)

      tex.dispose()
      blitMat.dispose()
    }

    upload(seedPos,  this.posRT)
    upload(seedVel,  this.velRT)
    upload(seedLife, this.lifeRT)
    upload(seedSpec, this.specRT)
  }

  private runSimPass(passIdx: number, time: number, delta: number, u: Partial<GPGPUUniforms>): void {
    const read  = this.readIdx
    const write = 1 - this.readIdx

    const mat = this.simMaterials[passIdx]
    mat.uniforms.positionTexture.value  = this.posRT[read].texture
    mat.uniforms.velocityTexture.value  = this.velRT[read].texture
    mat.uniforms.lifeTexture.value      = this.lifeRT[read].texture
    mat.uniforms.spectrumTexture.value  = this.specRT[read].texture
    mat.uniforms.time.value             = time
    mat.uniforms.delta.value            = delta
    if (u.qOrder           !== undefined) mat.uniforms.qOrder.value           = u.qOrder
    if (u.epsilon          !== undefined) mat.uniforms.epsilon.value          = u.epsilon
    if (u.gravityStrength  !== undefined) mat.uniforms.gravityStrength.value  = u.gravityStrength
    if (u.windStrength     !== undefined) mat.uniforms.windStrength.value     = u.windStrength
    if (u.physicsMultiplier!== undefined) mat.uniforms.physicsMultiplier.value= u.physicsMultiplier
    if (u.attractorPos     !== undefined) mat.uniforms.attractorPos.value.copy(u.attractorPos)
    if (u.attractorStrength!== undefined) mat.uniforms.attractorStrength.value= u.attractorStrength
    if (u.templateID       !== undefined) mat.uniforms.templateID.value       = u.templateID

    this.simMesh.material = mat

    const targetMap = [this.posRT, this.velRT, this.lifeRT, this.specRT]
    this.renderer.setRenderTarget(targetMap[passIdx][write])
    this.renderer.render(this.simScene, this.simCamera)
    this.renderer.setRenderTarget(null)
  }

  update(time: number, delta: number, uniforms: Partial<GPGPUUniforms>): void {
    // Run all 4 sim passes
    for (let pass = 0; pass < 4; pass++) {
      this.runSimPass(pass, time, delta, uniforms)
    }

    // Swap ping-pong
    this.readIdx = 1 - this.readIdx

    // Feed render material with fresh textures
    const r = this.readIdx
    this.renderMaterial.uniforms.positionTexture.value = this.posRT[r].texture
    this.renderMaterial.uniforms.velocityTexture.value = this.velRT[r].texture
    this.renderMaterial.uniforms.spectrumTexture.value = this.specRT[r].texture
    this.renderMaterial.uniforms.lifeTexture.value     = this.lifeRT[r].texture
    this.renderMaterial.uniforms.time.value            = time
    if (uniforms.qOrder          !== undefined) this.renderMaterial.uniforms.qOrder.value          = uniforms.qOrder
    if (uniforms.particleSizeMin !== undefined) this.renderMaterial.uniforms.particleSizeMin.value = uniforms.particleSizeMin
    if (uniforms.particleSizeMax !== undefined) this.renderMaterial.uniforms.particleSizeMax.value = uniforms.particleSizeMax
    if (uniforms.opacity         !== undefined) this.renderMaterial.uniforms.opacity.value         = uniforms.opacity
  }

  setTemplateID(id: number): void {
    this.simMaterials.forEach(m => { m.uniforms.templateID.value = id })
  }

  dispose(): void {
    this.posRT.forEach(rt  => rt.dispose())
    this.velRT.forEach(rt  => rt.dispose())
    this.lifeRT.forEach(rt => rt.dispose())
    this.specRT.forEach(rt => rt.dispose())
    this.simMaterials.forEach(m => m.dispose())
    this.renderMaterial.dispose()
    this.renderGeometry.dispose()
  }
}
