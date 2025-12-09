import * as THREE from "three"

interface CameraPosition {
  position: THREE.Vector3
  lookAt: THREE.Vector3
  fov?: number
}

const CAMERA_POSITIONS: Record<string, CameraPosition> = {
  intro: {
    position: new THREE.Vector3(0, 1, 10),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 50,
  },
  solarPanels: {
    position: new THREE.Vector3(4, 4, 5),
    lookAt: new THREE.Vector3(0, 3, 0),
    fov: 38,
  },
  waterCycle: {
    position: new THREE.Vector3(-4, 0.5, 6),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 45,
  },
  climateControl: {
    position: new THREE.Vector3(5, 1.5, 7),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 48,
  },
  carbonStorage: {
    position: new THREE.Vector3(2, -1.5, 6),
    lookAt: new THREE.Vector3(0, -3, 0),
    fov: 42,
  },
  biodiversity: {
    position: new THREE.Vector3(0, 2, 12),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 50,
  },
}

// Easing functions
const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)
const easeInOutQuart = (x: number): number => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2)

// Utility functions
const clamp = (min: number, max: number, value: number): number => (value < min ? min : value > max ? max : value)

const mapProgress = (inMin: number, inMax: number, outMin: number, outMax: number, value: number): number => {
  const clamped = clamp(inMin, inMax, value)
  return ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

export class CameraRig {
  outerRig: THREE.Object3D
  innerRig: THREE.Object3D
  camera: THREE.PerspectiveCamera

  targetRotation: THREE.Vector2
  currentRotation: THREE.Vector2
  mouseInfluence: number
  smoothness: number

  currentSection: string
  scrollProgress: number
  targetPosition: THREE.Vector3
  targetLookAt: THREE.Vector3
  currentLookAt: THREE.Vector3

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera

    // Create rig hierarchy
    this.outerRig = new THREE.Object3D()
    this.outerRig.name = "cameraOuterRig"

    this.innerRig = new THREE.Object3D()
    this.innerRig.name = "cameraInnerRig"

    this.outerRig.add(this.innerRig)
    this.innerRig.add(camera)

    // Mouse interaction
    this.targetRotation = new THREE.Vector2()
    this.currentRotation = new THREE.Vector2()
    this.mouseInfluence = 0.04
    this.smoothness = 0.06

    // Position tracking
    this.currentSection = "intro"
    this.scrollProgress = 0
    this.targetPosition = CAMERA_POSITIONS.intro.position.clone()
    this.targetLookAt = CAMERA_POSITIONS.intro.lookAt.clone()
    this.currentLookAt = CAMERA_POSITIONS.intro.lookAt.clone()

    // Set initial position
    this.camera.position.copy(this.targetPosition)
  }

  onMouseMove(mouse: THREE.Vector2) {
    this.targetRotation.x = mouse.y * this.mouseInfluence
    this.targetRotation.y = mouse.x * this.mouseInfluence
  }

  setScrollProgress(progress: number, section: string) {
    this.scrollProgress = progress

    if (section !== this.currentSection) {
      this.currentSection = section
    }

    const pos = CAMERA_POSITIONS[section]
    if (pos) {
      // Apply easing to the transition
      const easedProgress = easeOutQuart(progress)

      // Get previous section for interpolation
      const prevSection = this.getPreviousSection(section)
      const prevPos = CAMERA_POSITIONS[prevSection]

      if (prevPos && progress < 0.5) {
        // Interpolate from previous to current
        const t = mapProgress(0, 0.5, 0, 1, progress)
        const easedT = easeInOutQuart(t)

        this.targetPosition.lerpVectors(prevPos.position, pos.position, easedT)
        this.targetLookAt.lerpVectors(prevPos.lookAt, pos.lookAt, easedT)

        if (pos.fov && prevPos.fov) {
          const targetFov = THREE.MathUtils.lerp(prevPos.fov, pos.fov, easedT)
          this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.08)
          this.camera.updateProjectionMatrix()
        }
      } else {
        this.targetPosition.copy(pos.position)
        this.targetLookAt.copy(pos.lookAt)

        if (pos.fov) {
          this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, pos.fov, 0.05)
          this.camera.updateProjectionMatrix()
        }
      }
    }
  }

  getPreviousSection(current: string): string {
    const sections = ["intro", "solarPanels", "waterCycle", "climateControl", "carbonStorage", "biodiversity"]
    const index = sections.indexOf(current)
    return index > 0 ? sections[index - 1] : current
  }

  update(delta: number) {
    // Smooth mouse rotation with clamping
    this.currentRotation.x = THREE.MathUtils.lerp(
      this.currentRotation.x,
      THREE.MathUtils.clamp(this.targetRotation.x, -0.1, 0.1),
      this.smoothness,
    )
    this.currentRotation.y = THREE.MathUtils.lerp(
      this.currentRotation.y,
      THREE.MathUtils.clamp(this.targetRotation.y, -0.15, 0.15),
      this.smoothness,
    )

    // Apply to inner rig
    this.innerRig.rotation.x = this.currentRotation.x
    this.innerRig.rotation.y = this.currentRotation.y

    // Smooth camera position
    this.camera.position.lerp(this.targetPosition, 0.04)

    // Smooth lookAt
    this.currentLookAt.lerp(this.targetLookAt, 0.04)

    // Create a temporary lookAt target that combines position and lookAt
    const lookAtWorld = this.currentLookAt.clone()
    this.camera.lookAt(lookAtWorld)
  }
}
