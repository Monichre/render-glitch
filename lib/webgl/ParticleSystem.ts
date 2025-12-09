import * as THREE from "three"

const AMBIENT_PARTICLE_COUNT = 1800
const FOLIAGE_PARTICLE_COUNT = 1200

export class ParticleSystem {
  scene: THREE.Scene

  // Ambient particles (background)
  ambientGeometry: THREE.BufferGeometry
  ambientMaterial: THREE.PointsMaterial
  ambientPoints: THREE.Points
  ambientVelocities: Float32Array
  ambientOriginalPositions: Float32Array

  // Foliage particles (concentrated around tree)
  foliageGeometry: THREE.BufferGeometry
  foliageMaterial: THREE.PointsMaterial
  foliagePoints: THREE.Points
  foliageOriginalPositions: Float32Array

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // Create ambient particles
    this.ambientGeometry = new THREE.BufferGeometry()
    const ambientPositions = new Float32Array(AMBIENT_PARTICLE_COUNT * 3)
    const ambientColors = new Float32Array(AMBIENT_PARTICLE_COUNT * 3)
    const ambientSizes = new Float32Array(AMBIENT_PARTICLE_COUNT)
    this.ambientVelocities = new Float32Array(AMBIENT_PARTICLE_COUNT * 3)
    this.ambientOriginalPositions = new Float32Array(AMBIENT_PARTICLE_COUNT * 3)

    const color = new THREE.Color()

    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Position - spread in a spherical shell
      const radius = 10 + Math.random() * 30
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      ambientPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      ambientPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 2
      ambientPositions[i3 + 2] = radius * Math.cos(phi)

      this.ambientOriginalPositions[i3] = ambientPositions[i3]
      this.ambientOriginalPositions[i3 + 1] = ambientPositions[i3 + 1]
      this.ambientOriginalPositions[i3 + 2] = ambientPositions[i3 + 2]

      this.ambientVelocities[i3] = (Math.random() - 0.5) * 0.006
      this.ambientVelocities[i3 + 1] = (Math.random() - 0.5) * 0.004
      this.ambientVelocities[i3 + 2] = (Math.random() - 0.5) * 0.006

      // Color - cyan/teal spectrum
      const hue = 0.45 + Math.random() * 0.15
      const saturation = 0.35 + Math.random() * 0.35
      const lightness = 0.35 + Math.random() * 0.35
      color.setHSL(hue, saturation, lightness)

      ambientColors[i3] = color.r
      ambientColors[i3 + 1] = color.g
      ambientColors[i3 + 2] = color.b

      ambientSizes[i] = 0.02 + Math.random() * 0.03
    }

    this.ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientPositions, 3))
    this.ambientGeometry.setAttribute("color", new THREE.BufferAttribute(ambientColors, 3))
    this.ambientGeometry.setAttribute("size", new THREE.BufferAttribute(ambientSizes, 1))

    this.ambientMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    this.ambientPoints = new THREE.Points(this.ambientGeometry, this.ambientMaterial)
    scene.add(this.ambientPoints)

    // Create foliage particles - concentrated around tree crown
    this.foliageGeometry = new THREE.BufferGeometry()
    const foliagePositions = new Float32Array(FOLIAGE_PARTICLE_COUNT * 3)
    const foliageColors = new Float32Array(FOLIAGE_PARTICLE_COUNT * 3)
    const foliageSizes = new Float32Array(FOLIAGE_PARTICLE_COUNT)
    this.foliageOriginalPositions = new Float32Array(FOLIAGE_PARTICLE_COUNT * 3)

    for (let i = 0; i < FOLIAGE_PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Concentrated around tree foliage area (y: 3-6, radius: 0-3)
      const radius = Math.pow(Math.random(), 0.7) * 3.5
      const theta = Math.random() * Math.PI * 2
      const y = 3 + Math.random() * 3.5

      foliagePositions[i3] = Math.cos(theta) * radius
      foliagePositions[i3 + 1] = y
      foliagePositions[i3 + 2] = Math.sin(theta) * radius

      this.foliageOriginalPositions[i3] = foliagePositions[i3]
      this.foliageOriginalPositions[i3 + 1] = foliagePositions[i3 + 1]
      this.foliageOriginalPositions[i3 + 2] = foliagePositions[i3 + 2]

      // Green spectrum for foliage
      const hue = 0.32 + Math.random() * 0.12
      const saturation = 0.6 + Math.random() * 0.3
      const lightness = 0.35 + Math.random() * 0.3
      color.setHSL(hue, saturation, lightness)

      foliageColors[i3] = color.r
      foliageColors[i3 + 1] = color.g
      foliageColors[i3 + 2] = color.b

      foliageSizes[i] = 0.03 + Math.random() * 0.05
    }

    this.foliageGeometry.setAttribute("position", new THREE.BufferAttribute(foliagePositions, 3))
    this.foliageGeometry.setAttribute("color", new THREE.BufferAttribute(foliageColors, 3))
    this.foliageGeometry.setAttribute("size", new THREE.BufferAttribute(foliageSizes, 1))

    this.foliageMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    this.foliagePoints = new THREE.Points(this.foliageGeometry, this.foliageMaterial)
    scene.add(this.foliagePoints)
  }

  update(elapsed: number, delta: number) {
    // Update ambient particles
    const ambientPositions = this.ambientGeometry.attributes.position.array as Float32Array

    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
      const i3 = i * 3

      const noiseX =
        Math.sin(elapsed * 0.3 + this.ambientOriginalPositions[i3] * 0.05) *
        Math.cos(elapsed * 0.2 + this.ambientOriginalPositions[i3 + 2] * 0.08)
      const noiseY =
        Math.sin(elapsed * 0.25 + this.ambientOriginalPositions[i3 + 1] * 0.06) *
        Math.cos(elapsed * 0.35 + this.ambientOriginalPositions[i3] * 0.04)
      const noiseZ =
        Math.sin(elapsed * 0.28 + this.ambientOriginalPositions[i3 + 2] * 0.05) *
        Math.cos(elapsed * 0.22 + this.ambientOriginalPositions[i3 + 1] * 0.07)

      ambientPositions[i3] += this.ambientVelocities[i3] + noiseX * 0.002
      ambientPositions[i3 + 1] += this.ambientVelocities[i3 + 1] + noiseY * 0.0015
      ambientPositions[i3 + 2] += this.ambientVelocities[i3 + 2] + noiseZ * 0.002

      // Soft boundary wrapping
      const bound = 45
      const softBound = 38

      for (let j = 0; j < 3; j++) {
        const idx = i3 + j
        if (Math.abs(ambientPositions[idx]) > softBound) {
          const factor = (Math.abs(ambientPositions[idx]) - softBound) / (bound - softBound)
          ambientPositions[idx] -= Math.sign(ambientPositions[idx]) * factor * 0.08
        }
        if (Math.abs(ambientPositions[idx]) > bound) {
          ambientPositions[idx] = -Math.sign(ambientPositions[idx]) * (bound - 1)
        }
      }
    }

    this.ambientGeometry.attributes.position.needsUpdate = true

    // Update foliage particles - gentler, more contained movement
    const foliagePositions = this.foliageGeometry.attributes.position.array as Float32Array

    for (let i = 0; i < FOLIAGE_PARTICLE_COUNT; i++) {
      const i3 = i * 3

      const baseX = this.foliageOriginalPositions[i3]
      const baseY = this.foliageOriginalPositions[i3 + 1]
      const baseZ = this.foliageOriginalPositions[i3 + 2]

      // Gentle swaying motion
      const swayX = Math.sin(elapsed * 0.5 + baseY * 0.5) * 0.15
      const swayY = Math.sin(elapsed * 0.3 + baseX * 0.4) * 0.08
      const swayZ = Math.cos(elapsed * 0.4 + baseZ * 0.6) * 0.15

      // Occasional upward drift
      const drift = Math.sin(elapsed * 0.2 + i * 0.1) * 0.02

      foliagePositions[i3] = baseX + swayX
      foliagePositions[i3 + 1] = baseY + swayY + drift
      foliagePositions[i3 + 2] = baseZ + swayZ
    }

    this.foliageGeometry.attributes.position.needsUpdate = true

    // Subtle rotation
    this.ambientPoints.rotation.y += delta * 0.012
    this.ambientPoints.rotation.x += delta * 0.004

    // Foliage follows tree rotation more closely
    this.foliagePoints.rotation.y += delta * 0.005
  }

  // Allow external control of foliage rotation (for tree drag)
  setFoliageRotation(rotation: number) {
    this.foliagePoints.rotation.y = rotation
  }

  dispose() {
    this.ambientGeometry.dispose()
    this.ambientMaterial.dispose()
    this.scene.remove(this.ambientPoints)

    this.foliageGeometry.dispose()
    this.foliageMaterial.dispose()
    this.scene.remove(this.foliagePoints)
  }
}
