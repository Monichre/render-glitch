/**
 * ParticleSystem.ts
 * GPU-accelerated particle system using GPGPUCompute (DataTexture ping-pong).
 * Replaces the previous CPU-side Float32Array system.
 * Preserves the existing setFoliageRotation API for backward compatibility.
 */

import * as THREE from "three"
import { GPGPUCompute, type GPGPUUniforms } from "./GPGPUCompute"
import { getTemplate } from "../multifractal/templates/TemplateRegistry"

export interface ParticleSystemOptions {
  templateID?:       number
  qOrder?:           number
  epsilon?:          number
  gravityStrength?:  number
  windStrength?:     number
  physicsMultiplier?:number
  particleSizeMin?:  number
  particleSizeMax?:  number
  opacity?:          number
}

export class ParticleSystem {
  scene:   THREE.Scene
  gpgpu:   GPGPUCompute

  // Current uniforms state
  private uniforms: GPGPUUniforms
  private currentTemplateID = 0
  private attractorPos      = new THREE.Vector3()
  private attractorStrength = 0.0

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, options: ParticleSystemOptions = {}) {
    this.scene = scene

    this.gpgpu = new GPGPUCompute(renderer)

    const template = getTemplate(options.templateID ?? 0)

    this.uniforms = {
      qOrder:            options.qOrder            ?? template.defaultQ,
      epsilon:           options.epsilon            ?? template.defaultEps,
      gravityStrength:   options.gravityStrength    ?? template.gravityScale,
      windStrength:      options.windStrength       ?? template.windScale,
      physicsMultiplier: options.physicsMultiplier  ?? 1.0,
      attractorPos:      this.attractorPos,
      attractorStrength: 0.0,
      templateID:        options.templateID         ?? 0,
      particleSizeMin:   options.particleSizeMin    ?? 0.5,
      particleSizeMax:   options.particleSizeMax    ?? 4.0,
      opacity:           options.opacity            ?? 0.7,
    }

    scene.add(this.gpgpu.renderPoints)
  }

  update(elapsed: number, delta: number): void {
    this.uniforms.attractorPos      = this.attractorPos
    this.uniforms.attractorStrength = this.attractorStrength

    this.gpgpu.update(elapsed, delta, this.uniforms)
  }

  setTemplate(id: number): void {
    if (id === this.currentTemplateID) return
    this.currentTemplateID = id
    const tpl = getTemplate(id)
    this.uniforms.qOrder          = tpl.defaultQ
    this.uniforms.epsilon         = tpl.defaultEps
    this.uniforms.gravityStrength = tpl.gravityScale
    this.uniforms.windStrength    = tpl.windScale
    this.uniforms.templateID      = id
    this.gpgpu.setTemplateID(id)
  }

  setQOrder(q: number): void           { this.uniforms.qOrder           = q }
  setEpsilon(e: number): void          { this.uniforms.epsilon           = e }
  setGravity(g: number): void          { this.uniforms.gravityStrength   = g }
  setWind(w: number): void             { this.uniforms.windStrength      = w }
  setPhysics(p: number): void          { this.uniforms.physicsMultiplier = p }
  setSizeMin(s: number): void          { this.uniforms.particleSizeMin   = s }
  setSizeMax(s: number): void          { this.uniforms.particleSizeMax   = s }
  setOpacity(o: number): void          { this.uniforms.opacity           = o }

  // Gesture-driven attractor (fingertip world position)
  setAttractor(pos: THREE.Vector3, strength: number): void {
    this.attractorPos.copy(pos)
    this.attractorStrength = strength
  }

  // Backward-compatible API from old foliage system (no-op in GPU mode)
  setFoliageRotation(_rotation: number): void { /* no-op — GPU system has no foliage subset */ }

  dispose(): void {
    this.gpgpu.dispose()
    this.scene.remove(this.gpgpu.renderPoints)
  }
}
