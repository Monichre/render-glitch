import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import { NoiseShader } from "./shaders/NoiseShader"
import { VignetteShader } from "./shaders/VignetteShader"
import { ChromaticAberrationShader } from "./shaders/ChromaticAberrationShader"
import { CameraRig } from "./CameraRig"
import { ParticleSystem } from "./ParticleSystem"

export class WebGLScene {
  container: HTMLElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  composer: EffectComposer
  cameraRig: CameraRig
  particles: ParticleSystem
  tree: THREE.Group | null = null
  clock: THREE.Clock
  mouse: THREE.Vector2
  isDisposed = false
  onLoadComplete?: () => void

  // Post-processing passes
  bloomPass: UnrealBloomPass | null = null
  noisePass: ShaderPass | null = null
  vignettePass: ShaderPass | null = null
  chromaticPass: ShaderPass | null = null

  // Lights for animation
  treeGlow: THREE.PointLight | null = null

  constructor(container: HTMLElement, onLoadComplete?: () => void) {
    this.container = container
    this.clock = new THREE.Clock()
    this.mouse = new THREE.Vector2()
    this.onLoadComplete = onLoadComplete

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x040608)
    this.scene.fog = new THREE.FogExp2(0x040608, 0.04)

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)

    // Camera Rig
    this.cameraRig = new CameraRig(this.camera)
    this.scene.add(this.cameraRig.outerRig)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    container.appendChild(this.renderer.domElement)

    // Post-processing
    this.composer = new EffectComposer(this.renderer)
    this.setupPostProcessing()

    // Particles
    this.particles = new ParticleSystem(this.scene)

    // Setup
    this.setupLights()
    this.setupEnvironment()
    this.createProceduralTree()
    this.setupEventListeners()
    this.animate()

    setTimeout(() => {
      this.onLoadComplete?.()
    }, 500)
  }

  setupPostProcessing() {
    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // Bloom pass
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.4, 0.88)
    this.composer.addPass(this.bloomPass)

    // Chromatic aberration (subtle)
    this.chromaticPass = new ShaderPass(ChromaticAberrationShader)
    this.chromaticPass.uniforms.amount.value = 0.0015
    this.composer.addPass(this.chromaticPass)

    // Noise/grain pass
    this.noisePass = new ShaderPass(NoiseShader)
    this.noisePass.uniforms.amount.value = 0.03
    this.noisePass.uniforms.speed.value = 1.0
    this.composer.addPass(this.noisePass)

    // Vignette pass
    this.vignettePass = new ShaderPass(VignetteShader)
    this.vignettePass.uniforms.darkness.value = 0.6
    this.vignettePass.uniforms.offset.value = 1.2
    this.composer.addPass(this.vignettePass)

    // Output pass
    const outputPass = new OutputPass()
    this.composer.addPass(outputPass)
  }

  setupLights() {
    // Ambient - slight blue tint
    const ambient = new THREE.AmbientLight(0x303540, 0.4)
    this.scene.add(ambient)

    // Key light - cyan
    const keyLight = new THREE.DirectionalLight(0x60ffff, 0.7)
    keyLight.position.set(5, 10, 5)
    this.scene.add(keyLight)

    // Fill light - deep blue
    const fillLight = new THREE.DirectionalLight(0x3050ff, 0.25)
    fillLight.position.set(-5, 3, -5)
    this.scene.add(fillLight)

    // Rim light - cyan accent
    const rimLight = new THREE.DirectionalLight(0x00ffaa, 0.15)
    rimLight.position.set(0, -3, -10)
    this.scene.add(rimLight)

    // Tree glow - animated point light
    this.treeGlow = new THREE.PointLight(0x30ff90, 0.6, 12)
    this.treeGlow.position.set(0, 2, 0)
    this.scene.add(this.treeGlow)

    // Secondary glow for foliage
    const foliageGlow = new THREE.PointLight(0x20ff80, 0.3, 8)
    foliageGlow.position.set(0, 4, 0)
    this.scene.add(foliageGlow)
  }

  setupEnvironment() {
    // Wireframe icosahedron background - primary
    const icoGeometry = new THREE.IcosahedronGeometry(35, 1)
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a2535,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    })
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial)
    icosahedron.name = "bgIco1"
    this.scene.add(icosahedron)

    // Secondary rotating background
    const icosahedron2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(28, 2),
      new THREE.MeshBasicMaterial({
        color: 0x102030,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      }),
    )
    icosahedron2.name = "bgIco2"
    this.scene.add(icosahedron2)

    // Floor grid
    const gridHelper = new THREE.GridHelper(60, 60, 0x1a2a3a, 0x080c12)
    gridHelper.position.y = -5
    this.scene.add(gridHelper)

    // Low-poly terrain floor
    const floorGeometry = new THREE.PlaneGeometry(120, 120, 40, 40)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x060810,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    })

    const positions = floorGeometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const dist = Math.sqrt(x * x + z * z)
      const wave = Math.sin(dist * 0.08) * 0.3 + Math.sin(dist * 0.15 + x * 0.1) * 0.15
      positions.setY(i, wave + (Math.random() - 0.5) * 0.1)
    }
    floorGeometry.computeVertexNormals()

    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -5
    this.scene.add(floor)

    // Compass ring
    const compassGeometry = new THREE.RingGeometry(10, 10.15, 64)
    const compassMaterial = new THREE.MeshBasicMaterial({
      color: 0x40ffaa,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    })
    const compass = new THREE.Mesh(compassGeometry, compassMaterial)
    compass.rotation.x = -Math.PI / 2
    compass.position.y = -4.95
    compass.name = "compass"
    this.scene.add(compass)

    // Inner compass ring
    const innerCompass = new THREE.Mesh(
      new THREE.RingGeometry(6, 6.08, 48),
      new THREE.MeshBasicMaterial({
        color: 0x40ffaa,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
      }),
    )
    innerCompass.rotation.x = -Math.PI / 2
    innerCompass.position.y = -4.94
    this.scene.add(innerCompass)

    // Compass tick marks
    const tickGeometry = new THREE.PlaneGeometry(0.04, 0.4)
    const tickMaterial = new THREE.MeshBasicMaterial({
      color: 0x40ffaa,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    })

    for (let i = 0; i < 36; i++) {
      const tick = new THREE.Mesh(tickGeometry, tickMaterial)
      const angle = (i / 36) * Math.PI * 2
      tick.position.set(Math.cos(angle) * 10, -4.9, Math.sin(angle) * 10)
      tick.rotation.x = -Math.PI / 2
      tick.rotation.z = -angle
      this.scene.add(tick)
    }

    // Cardinal direction markers
    const cardinalDirs = ["N", "E", "S", "W"]
    cardinalDirs.forEach((dir, i) => {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2
      const markerGeometry = new THREE.PlaneGeometry(0.08, 0.6)
      const marker = new THREE.Mesh(markerGeometry, tickMaterial.clone())
      marker.material.opacity = 0.4
      marker.position.set(Math.cos(angle) * 10, -4.88, Math.sin(angle) * 10)
      marker.rotation.x = -Math.PI / 2
      marker.rotation.z = -angle
      this.scene.add(marker)
    })
  }

  createProceduralTree() {
    this.tree = new THREE.Group()
    this.tree.name = "tree"

    const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.45, 6, 14, 12)
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1208,
      roughness: 0.9,
      metalness: 0.05,
    })

    const trunkPositions = trunkGeometry.attributes.position
    for (let i = 0; i < trunkPositions.count; i++) {
      const x = trunkPositions.getX(i)
      const y = trunkPositions.getY(i)
      const z = trunkPositions.getZ(i)
      const noise = Math.sin(y * 4) * 0.06 + Math.sin(y * 8 + x * 6) * 0.025 + Math.sin(y * 12 + z * 8) * 0.015
      trunkPositions.setX(i, x + noise * Math.sign(x || 0.1))
      trunkPositions.setZ(i, z + noise * Math.sign(z || 0.1))
    }
    trunkGeometry.computeVertexNormals()

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = -1 // Moved trunk higher so it's more visible
    trunk.name = "trunk"
    this.tree.add(trunk)

    this.createBranches()
    this.createFoliage()
    this.createRoots()

    this.scene.add(this.tree)
  }

  createBranches() {
    if (!this.tree) return

    const branchMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1208,
      roughness: 0.88,
      metalness: 0.05,
    })

    const branchConfigs = [
      { pos: [0.4, 1.5, 0.15], rot: [0.25, 0.4, -0.55], len: 2.2 },
      { pos: [-0.35, 1.8, 0.12], rot: [-0.15, -0.25, 0.65], len: 1.9 },
      { pos: [0.2, 2.2, -0.3], rot: [-0.35, 0.15, -0.35], len: 1.6 },
      { pos: [-0.25, 2.5, -0.15], rot: [0.25, -0.35, 0.45], len: 1.4 },
      { pos: [0.15, 2.8, 0.2], rot: [0.15, 0.25, -0.2], len: 1.2 },
      { pos: [-0.1, 3.1, 0.08], rot: [-0.08, -0.15, 0.25], len: 1.0 },
      { pos: [0.3, 2.0, -0.2], rot: [-0.2, 0.3, -0.4], len: 1.4 },
      { pos: [-0.2, 2.3, 0.25], rot: [0.2, -0.2, 0.35], len: 1.2 },
    ]

    branchConfigs.forEach(({ pos, rot, len }) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(len * 0.25, len * 0.15, len * 0.08),
        new THREE.Vector3(len * 0.6, len * 0.35, len * 0.15),
        new THREE.Vector3(len, len * 0.45, len * 0.1),
      ])

      const branchGeometry = new THREE.TubeGeometry(curve, 16, 0.07, 6, false)
      const branch = new THREE.Mesh(branchGeometry, branchMaterial)
      branch.position.set(pos[0], pos[1], pos[2])
      branch.rotation.set(rot[0], rot[1], rot[2])
      this.tree!.add(branch)
    })
  }

  createFoliage() {
    if (!this.tree) return

    const foliageGroup = new THREE.Group()
    foliageGroup.name = "foliage"

    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a3820,
      roughness: 0.75,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      emissive: 0x0f4025,
      emissiveIntensity: 0.35,
    })

    const foliagePositions = [
      { pos: [0, 4.2, 0], scale: 2.2 },
      { pos: [0.9, 3.7, 0.4], scale: 1.5 },
      { pos: [-0.8, 3.9, -0.3], scale: 1.6 },
      { pos: [0.4, 4.6, -0.5], scale: 1.2 },
      { pos: [-0.4, 4.4, 0.65], scale: 1.3 },
      { pos: [0, 5.2, 0], scale: 1.0 },
      { pos: [0.55, 4.8, 0.3], scale: 0.85 },
      { pos: [-0.45, 4.7, -0.4], scale: 0.9 },
      { pos: [0.3, 3.5, 0.55], scale: 1.0 },
      { pos: [-0.35, 3.6, -0.5], scale: 0.95 },
    ]

    foliagePositions.forEach(({ pos, scale }) => {
      const geometry = new THREE.IcosahedronGeometry(scale, 1)

      const positions = geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        const displacement = 0.15 + Math.random() * 0.35
        positions.setX(i, x * (1 + displacement))
        positions.setY(i, y * (1 + displacement * 0.6))
        positions.setZ(i, z * (1 + displacement))
      }
      geometry.computeVertexNormals()

      const foliage = new THREE.Mesh(geometry, foliageMaterial.clone())
      foliage.position.set(pos[0], pos[1], pos[2])
      foliageGroup.add(foliage)
    })

    this.tree.add(foliageGroup)
  }

  createRoots() {
    if (!this.tree) return

    const rootGroup = new THREE.Group()
    rootGroup.name = "roots"

    const rootMaterial = new THREE.MeshStandardMaterial({
      color: 0x100804,
      roughness: 0.95,
      metalness: 0,
    })

    const rootCount = 14
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const spread = 2.4 + Math.random() * 2.0
      const depth = -4.2 - Math.random() * 0.8

      const midAngle = angle + (Math.random() - 0.5) * 0.3

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -3.5, 0),
        new THREE.Vector3(Math.cos(angle) * 0.5, -3.8, Math.sin(angle) * 0.5),
        new THREE.Vector3(Math.cos(midAngle) * 1.4, -4.0, Math.sin(midAngle) * 1.4),
        new THREE.Vector3(Math.cos(angle) * spread, depth, Math.sin(angle) * spread),
      ])

      const thickness = 0.08 - i * 0.003
      const tubeGeometry = new THREE.TubeGeometry(curve, 18, Math.max(thickness, 0.035), 6, false)
      const root = new THREE.Mesh(tubeGeometry, rootMaterial)
      rootGroup.add(root)
    }

    this.tree.add(rootGroup)
  }

  setupEventListeners() {
    window.addEventListener("resize", this.onResize.bind(this))
    window.addEventListener("mousemove", this.onMouseMove.bind(this))
  }

  onResize() {
    const width = window.innerWidth
    const height = window.innerHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)

    if (this.bloomPass) {
      this.bloomPass.setSize(width, height)
    }
  }

  onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.cameraRig.onMouseMove(this.mouse)
  }

  setCameraPosition(progress: number, section: string) {
    this.cameraRig.setScrollProgress(progress, section)
  }

  setTreeRotation(rotation: number) {
    if (this.tree) {
      this.tree.rotation.y = rotation
    }
    this.particles.setFoliageRotation(rotation)
  }

  getTreeRotation(): number {
    return this.tree?.rotation.y || 0
  }

  animate() {
    if (this.isDisposed) return

    requestAnimationFrame(this.animate.bind(this))

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    // Update camera rig
    this.cameraRig.update(delta)

    // Update particles
    this.particles.update(elapsed, delta)

    const bgIco1 = this.scene.getObjectByName("bgIco1")
    const bgIco2 = this.scene.getObjectByName("bgIco2")
    if (bgIco1) {
      bgIco1.rotation.y += delta * 0.015
      bgIco1.rotation.x += delta * 0.008
    }
    if (bgIco2) {
      bgIco2.rotation.y -= delta * 0.01
      bgIco2.rotation.z += delta * 0.005
    }

    // Compass rotation
    const compass = this.scene.getObjectByName("compass") as THREE.Mesh
    if (compass) {
      compass.rotation.z = -elapsed * 0.1
    }

    // Animated tree glow
    if (this.treeGlow) {
      this.treeGlow.intensity = 0.5 + Math.sin(elapsed * 1.5) * 0.15
    }

    // Subtle tree sway
    if (this.tree) {
      const foliage = this.tree.getObjectByName("foliage")
      if (foliage) {
        foliage.rotation.x = Math.sin(elapsed * 0.4) * 0.012
        foliage.rotation.z = Math.cos(elapsed * 0.25) * 0.012
      }
    }

    // Update shader uniforms
    if (this.noisePass?.uniforms?.time) {
      this.noisePass.uniforms.time.value = elapsed
    }

    // Subtle chromatic aberration pulse
    if (this.chromaticPass?.uniforms?.amount) {
      this.chromaticPass.uniforms.amount.value = 0.0012 + Math.sin(elapsed * 0.5) * 0.0003
    }

    this.composer.render()
  }

  dispose() {
    this.isDisposed = true
    window.removeEventListener("resize", this.onResize.bind(this))
    window.removeEventListener("mousemove", this.onMouseMove.bind(this))

    this.particles.dispose()
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
