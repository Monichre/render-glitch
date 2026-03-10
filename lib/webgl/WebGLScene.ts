/**
 * WebGLScene.ts
 * Extends the existing Three.js scene with GPGPU particle system,
 * SpectrumAnalyzer, and a public API for gesture/controls bridges.
 * All original tree, lights, environment, and post-processing are preserved.
 */

import * as THREE from "three"
import { EffectComposer }       from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass }           from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass }      from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass }           from "three/addons/postprocessing/OutputPass.js"
import { ShaderPass }           from "three/addons/postprocessing/ShaderPass.js"
import { NoiseShader }          from "./shaders/NoiseShader"
import { VignetteShader }       from "./shaders/VignetteShader"
import { ChromaticAberrationShader } from "./shaders/ChromaticAberrationShader"
import { CameraRig }            from "./CameraRig"
import { ParticleSystem }       from "./ParticleSystem"
import { SpectrumAnalyzer }     from "../multifractal/SpectrumAnalyzer"

export interface SceneControls {
  templateID?:       number
  qOrder?:           number
  epsilon?:          number
  gravityStrength?:  number
  windStrength?:     number
  physicsMultiplier?:number
  particleSizeMin?:  number
  particleSizeMax?:  number
  opacity?:          number
  bloomIntensity?:   number
  chromaticAmount?:  number
  anomalyDetection?: boolean
  spectrumMode?:     "legendre" | "wavelet"
  attractorPos?:     THREE.Vector3
  attractorStrength?:number
}

export class WebGLScene {
  container:   HTMLElement
  scene:       THREE.Scene
  camera:      THREE.PerspectiveCamera
  renderer:    THREE.WebGLRenderer
  composer:    EffectComposer
  cameraRig:   CameraRig
  particles:   ParticleSystem
  spectrum:    SpectrumAnalyzer
  tree:        THREE.Group | null = null
  clock:       THREE.Clock
  mouse:       THREE.Vector2
  isDisposed = false
  onLoadComplete?: () => void

  // Post-processing
  bloomPass:    UnrealBloomPass | null = null
  noisePass:    ShaderPass | null = null
  vignettePass: ShaderPass | null = null
  chromaticPass:ShaderPass | null = null

  treeGlow: THREE.PointLight | null = null

  constructor(container: HTMLElement, onLoadComplete?: () => void) {
    this.container      = container
    this.clock          = new THREE.Clock()
    this.mouse          = new THREE.Vector2()
    this.onLoadComplete = onLoadComplete

    // Scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x040608, 0.04)

    // Load topology image as a fixed equirectangular background texture
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      "/topology-bg.jpg",
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping
        tex.colorSpace = THREE.SRGBColorSpace
        this.scene.background = tex
      },
      undefined,
      () => {
        // Fallback to solid color if texture fails to load
        this.scene.background = new THREE.Color(0x040608)
      }
    )

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)

    // Camera Rig
    this.cameraRig = new CameraRig(this.camera)
    this.scene.add(this.cameraRig.outerRig)

    // Renderer (WebGL2 for GPGPU)
    this.renderer = new THREE.WebGLRenderer({
      antialias:        true,
      alpha:            false,
      powerPreference:  "high-performance",
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping        = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure= 1.1
    container.appendChild(this.renderer.domElement)

    // Spectrum analyzer (JS-side, feeds HUD + uniforms)
    this.spectrum = new SpectrumAnalyzer()

    // Post-processing
    this.composer = new EffectComposer(this.renderer)
    this.setupPostProcessing()

    // GPU Particle System
    this.particles = new ParticleSystem(this.scene, this.renderer)

    // Scene setup
    this.setupLights()
    this.setupEnvironment()
    this.createProceduralTree()
    this.setupEventListeners()
    this.animate()

    setTimeout(() => { this.onLoadComplete?.() }, 500)
  }

  // ----------------------------------------------------------------
  // Public API for controls / gesture bridge
  // ----------------------------------------------------------------
  applyControls(controls: SceneControls): void {
    const p = this.particles

    if (controls.templateID       !== undefined) p.setTemplate(controls.templateID)
    if (controls.qOrder           !== undefined) {
      p.setQOrder(controls.qOrder)
      this.spectrum.setQOrder(controls.qOrder)
    }
    if (controls.epsilon          !== undefined) {
      p.setEpsilon(controls.epsilon)
      this.spectrum.setEpsilon(controls.epsilon)
    }
    if (controls.gravityStrength  !== undefined) p.setGravity(controls.gravityStrength)
    if (controls.windStrength     !== undefined) p.setWind(controls.windStrength)
    if (controls.physicsMultiplier!== undefined) p.setPhysics(controls.physicsMultiplier)
    if (controls.particleSizeMin  !== undefined) p.setSizeMin(controls.particleSizeMin)
    if (controls.particleSizeMax  !== undefined) p.setSizeMax(controls.particleSizeMax)
    if (controls.opacity          !== undefined) p.setOpacity(controls.opacity)
    if (controls.attractorPos     !== undefined && controls.attractorStrength !== undefined) {
      p.setAttractor(controls.attractorPos, controls.attractorStrength)
    }
    if (controls.bloomIntensity   !== undefined && this.bloomPass) {
      this.bloomPass.strength = controls.bloomIntensity
    }
    if (controls.chromaticAmount  !== undefined && this.chromaticPass) {
      this.chromaticPass.uniforms.amount.value = controls.chromaticAmount
    }
    if (controls.anomalyDetection !== undefined) {
      this.spectrum.setAnomalyDetection(controls.anomalyDetection)
    }
    if (controls.spectrumMode !== undefined) {
      this.spectrum.setMode(controls.spectrumMode)
    }
  }

  getSpectrumState() {
    return this.spectrum.getState()
  }

  // ----------------------------------------------------------------
  // Post-processing (unchanged from original)
  // ----------------------------------------------------------------
  setupPostProcessing(): void {
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.4, 0.88
    )
    this.composer.addPass(this.bloomPass)

    this.chromaticPass = new ShaderPass(ChromaticAberrationShader)
    this.chromaticPass.uniforms.amount.value = 0.0015
    this.composer.addPass(this.chromaticPass)

    this.noisePass = new ShaderPass(NoiseShader)
    this.noisePass.uniforms.amount.value = 0.03
    this.noisePass.uniforms.speed.value  = 1.0
    this.composer.addPass(this.noisePass)

    this.vignettePass = new ShaderPass(VignetteShader)
    this.vignettePass.uniforms.darkness.value = 0.6
    this.vignettePass.uniforms.offset.value   = 1.2
    this.composer.addPass(this.vignettePass)

    const outputPass = new OutputPass()
    this.composer.addPass(outputPass)
  }

  // ----------------------------------------------------------------
  // Lights (unchanged)
  // ----------------------------------------------------------------
  setupLights(): void {
    const ambient  = new THREE.AmbientLight(0x303540, 0.4)
    this.scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0x60ffff, 0.7)
    keyLight.position.set(5, 10, 5)
    this.scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x3050ff, 0.25)
    fillLight.position.set(-5, 3, -5)
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x00ffaa, 0.15)
    rimLight.position.set(0, -3, -10)
    this.scene.add(rimLight)

    this.treeGlow = new THREE.PointLight(0x30ff90, 0.6, 12)
    this.treeGlow.position.set(0, 2, 0)
    this.scene.add(this.treeGlow)

    const foliageGlow = new THREE.PointLight(0x20ff80, 0.3, 8)
    foliageGlow.position.set(0, 4, 0)
    this.scene.add(foliageGlow)
  }

  // ----------------------------------------------------------------
  // Environment (unchanged)
  // ----------------------------------------------------------------
  setupEnvironment(): void {
    const icoGeo = new THREE.IcosahedronGeometry(35, 1)
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x1a2535, wireframe: true, transparent: true, opacity: 0.1,
    })
    const icosahedron = new THREE.Mesh(icoGeo, icoMat)
    icosahedron.name  = "bgIco1"
    this.scene.add(icosahedron)

    const icosahedron2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(28, 2),
      new THREE.MeshBasicMaterial({
        color: 0x102030, wireframe: true, transparent: true, opacity: 0.06,
      }),
    )
    icosahedron2.name = "bgIco2"
    this.scene.add(icosahedron2)

    const gridHelper = new THREE.GridHelper(60, 60, 0x1a2a3a, 0x080c12)
    gridHelper.position.y = -5
    this.scene.add(gridHelper)

    const floorGeo = new THREE.PlaneGeometry(120, 120, 40, 40)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x060810, roughness: 0.95, metalness: 0.05, flatShading: true,
    })
    const positions = floorGeo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const d = Math.sqrt(x * x + z * z)
      positions.setY(i, Math.sin(d * 0.08) * 0.3 + Math.sin(d * 0.15 + x * 0.1) * 0.15 + (Math.random() - 0.5) * 0.1)
    }
    floorGeo.computeVertexNormals()
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -5
    this.scene.add(floor)

    // Compass rings + tick marks (unchanged)
    const compassMat = new THREE.MeshBasicMaterial({
      color: 0x40ffaa, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
    })
    const compass = new THREE.Mesh(new THREE.RingGeometry(10, 10.15, 64), compassMat)
    compass.rotation.x = -Math.PI / 2
    compass.position.y = -4.95
    compass.name = "compass"
    this.scene.add(compass)

    const innerCompass = new THREE.Mesh(
      new THREE.RingGeometry(6, 6.08, 48),
      new THREE.MeshBasicMaterial({ color: 0x40ffaa, transparent: true, opacity: 0.06, side: THREE.DoubleSide }),
    )
    innerCompass.rotation.x = -Math.PI / 2
    innerCompass.position.y = -4.94
    this.scene.add(innerCompass)

    const tickGeo = new THREE.PlaneGeometry(0.04, 0.4)
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0x40ffaa, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    })
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2
      const tick  = new THREE.Mesh(tickGeo, tickMat)
      tick.position.set(Math.cos(angle) * 10, -4.9, Math.sin(angle) * 10)
      tick.rotation.x = -Math.PI / 2
      tick.rotation.z = -angle
      this.scene.add(tick)
    }
  }

  // ----------------------------------------------------------------
  // Tree (unchanged)
  // ----------------------------------------------------------------
  createProceduralTree(): void {
    this.tree      = new THREE.Group()
    this.tree.name = "tree"

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 6, 14, 12)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.9, metalness: 0.05 })
    const trunkPos = trunkGeo.attributes.position
    for (let i = 0; i < trunkPos.count; i++) {
      const x = trunkPos.getX(i); const y = trunkPos.getY(i); const z = trunkPos.getZ(i)
      const n = Math.sin(y*4)*0.06 + Math.sin(y*8+x*6)*0.025 + Math.sin(y*12+z*8)*0.015
      trunkPos.setX(i, x + n * Math.sign(x || 0.1))
      trunkPos.setZ(i, z + n * Math.sign(z || 0.1))
    }
    trunkGeo.computeVertexNormals()
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = -1
    trunk.name       = "trunk"
    this.tree.add(trunk)

    this.createBranches()
    this.createFoliage()
    this.createRoots()
    this.scene.add(this.tree)
  }

  createBranches(): void {
    if (!this.tree) return
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.88, metalness: 0.05 })
    const configs = [
      { pos:[0.4,1.5,0.15],  rot:[0.25,0.4,-0.55],   len:2.2 },
      { pos:[-0.35,1.8,0.12],rot:[-0.15,-0.25,0.65],  len:1.9 },
      { pos:[0.2,2.2,-0.3],  rot:[-0.35,0.15,-0.35],  len:1.6 },
      { pos:[-0.25,2.5,-0.15],rot:[0.25,-0.35,0.45],  len:1.4 },
      { pos:[0.15,2.8,0.2],  rot:[0.15,0.25,-0.2],    len:1.2 },
      { pos:[-0.1,3.1,0.08], rot:[-0.08,-0.15,0.25],  len:1.0 },
      { pos:[0.3,2.0,-0.2],  rot:[-0.2,0.3,-0.4],     len:1.4 },
      { pos:[-0.2,2.3,0.25], rot:[0.2,-0.2,0.35],     len:1.2 },
    ]
    configs.forEach(({ pos, rot, len }) => {
      const curve  = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(len*0.25,len*0.15,len*0.08),
        new THREE.Vector3(len*0.6,len*0.35,len*0.15),
        new THREE.Vector3(len,len*0.45,len*0.1),
      ])
      const branch = new THREE.Mesh(new THREE.TubeGeometry(curve,16,0.07,6,false), mat)
      branch.position.set(pos[0],pos[1],pos[2])
      branch.rotation.set(rot[0],rot[1],rot[2])
      this.tree!.add(branch)
    })
  }

  createFoliage(): void {
    if (!this.tree) return
    const foliageGroup = new THREE.Group()
    foliageGroup.name  = "foliage"
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a3820, roughness: 0.75, metalness: 0.1,
      transparent: true, opacity: 0.88, side: THREE.DoubleSide,
      emissive: 0x0f4025, emissiveIntensity: 0.35,
    })
    const foliagePositions = [
      {pos:[0,4.2,0],scale:2.2},{pos:[0.9,3.7,0.4],scale:1.5},
      {pos:[-0.8,3.9,-0.3],scale:1.6},{pos:[0.4,4.6,-0.5],scale:1.2},
      {pos:[-0.4,4.4,0.65],scale:1.3},{pos:[0,5.2,0],scale:1.0},
      {pos:[0.55,4.8,0.3],scale:0.85},{pos:[-0.45,4.7,-0.4],scale:0.9},
      {pos:[0.3,3.5,0.55],scale:1.0},{pos:[-0.35,3.6,-0.5],scale:0.95},
    ]
    foliagePositions.forEach(({ pos, scale }) => {
      const geo = new THREE.IcosahedronGeometry(scale, 1)
      const p   = geo.attributes.position
      for (let i = 0; i < p.count; i++) {
        const d = 0.15 + Math.random() * 0.35
        p.setX(i, p.getX(i) * (1 + d))
        p.setY(i, p.getY(i) * (1 + d * 0.6))
        p.setZ(i, p.getZ(i) * (1 + d))
      }
      geo.computeVertexNormals()
      const mesh = new THREE.Mesh(geo, mat.clone())
      mesh.position.set(pos[0], pos[1], pos[2])
      foliageGroup.add(mesh)
    })
    this.tree.add(foliageGroup)
  }

  createRoots(): void {
    if (!this.tree) return
    const rootGroup = new THREE.Group()
    rootGroup.name  = "roots"
    const mat = new THREE.MeshStandardMaterial({ color: 0x100804, roughness: 0.95, metalness: 0 })
    for (let i = 0; i < 14; i++) {
      const angle  = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const spread = 2.4 + Math.random() * 2.0
      const depth  = -4.2 - Math.random() * 0.8
      const mid    = angle + (Math.random() - 0.5) * 0.3
      const curve  = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,-3.5,0),
        new THREE.Vector3(Math.cos(angle)*0.5,-3.8,Math.sin(angle)*0.5),
        new THREE.Vector3(Math.cos(mid)*1.4,-4.0,Math.sin(mid)*1.4),
        new THREE.Vector3(Math.cos(angle)*spread,depth,Math.sin(angle)*spread),
      ])
      const root = new THREE.Mesh(
        new THREE.TubeGeometry(curve,18,Math.max(0.08-i*0.003,0.035),6,false), mat
      )
      rootGroup.add(root)
    }
    this.tree.add(rootGroup)
  }

  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  setupEventListeners(): void {
    window.addEventListener("resize",    this.onResize.bind(this))
    window.addEventListener("mousemove", this.onMouseMove.bind(this))
  }

  onResize(): void {
    const w = window.innerWidth; const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
    this.bloomPass?.setSize(w, h)
  }

  onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth)  * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    this.cameraRig.onMouseMove(this.mouse)
  }

  // ----------------------------------------------------------------
  // External API (used by scroll-sections + WebGLCanvas)
  // ----------------------------------------------------------------
  setCameraPosition(progress: number, section: string): void {
    this.cameraRig.setScrollProgress(progress, section)
  }

  setTreeRotation(rotation: number): void {
    if (this.tree) this.tree.rotation.y = rotation
    this.particles.setFoliageRotation(rotation)
  }

  getTreeRotation(): number {
    return this.tree?.rotation.y ?? 0
  }

  // ----------------------------------------------------------------
  // Render loop
  // ----------------------------------------------------------------
  animate(): void {
    if (this.isDisposed) return
    requestAnimationFrame(this.animate.bind(this))

    const delta   = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    this.cameraRig.update(delta)
    this.particles.update(elapsed, delta)

    // Tick spectrum analyzer at reduced rate (10 FPS budget)
    this.spectrum.tick(elapsed * 1000, (this.particles as any).currentTemplateID ?? 0)

    // Background icosahedra rotation
    const bgIco1 = this.scene.getObjectByName("bgIco1")
    const bgIco2 = this.scene.getObjectByName("bgIco2")
    if (bgIco1) { bgIco1.rotation.y += delta * 0.015; bgIco1.rotation.x += delta * 0.008 }
    if (bgIco2) { bgIco2.rotation.y -= delta * 0.01;  bgIco2.rotation.z += delta * 0.005 }

    const compass = this.scene.getObjectByName("compass") as THREE.Mesh | undefined
    if (compass) compass.rotation.z = -elapsed * 0.1

    if (this.treeGlow) this.treeGlow.intensity = 0.5 + Math.sin(elapsed * 1.5) * 0.15

    if (this.tree) {
      const foliage = this.tree.getObjectByName("foliage")
      if (foliage) {
        foliage.rotation.x = Math.sin(elapsed * 0.4)  * 0.012
        foliage.rotation.z = Math.cos(elapsed * 0.25) * 0.012
      }
    }

    if (this.noisePass?.uniforms?.time) this.noisePass.uniforms.time.value = elapsed

    if (this.chromaticPass?.uniforms?.amount) {
      this.chromaticPass.uniforms.amount.value = 0.0012 + Math.sin(elapsed * 0.5) * 0.0003
    }

    this.composer.render()
  }

  dispose(): void {
    this.isDisposed = true
    window.removeEventListener("resize",    this.onResize.bind(this))
    window.removeEventListener("mousemove", this.onMouseMove.bind(this))
    this.particles.dispose()
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
