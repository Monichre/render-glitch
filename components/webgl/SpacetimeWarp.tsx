"use client"

import { useEffect, useRef, useCallback } from "react"
import { SPACETIME_VERT, SPACETIME_FRAG } from "@/lib/webgl/shaders/SpacetimeWarpShader"

// ─── WebGL helpers ────────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? "shader compile error")
  }
  return s
}

function createProgram(gl: WebGLRenderingContext, vert: string, frag: string): WebGLProgram {
  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vert))
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) ?? "program link error")
  }
  return prog
}

// Full-screen triangle (two triangles as a quad, -1 to +1)
const QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1])

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarpUniforms {
  uTime: WebGLUniformLocation | null
  uResolution: WebGLUniformLocation | null
  uWarpSpeed: WebGLUniformLocation | null
  uGridDensity: WebGLUniformLocation | null
  uAberration: WebGLUniformLocation | null
}

export interface SpacetimeWarpProps {
  warpSpeed?: number    // 0.5 – 3.0,  default 1.0
  gridDensity?: number  // 4.0 – 20.0, default 8.0
  aberration?: number   // 0.0 – 1.0,  default 0.6
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpacetimeWarp({
  warpSpeed   = 1.0,
  gridDensity = 8.0,
  aberration  = 0.6,
  className   = "",
}: SpacetimeWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const glRef     = useRef<WebGLRenderingContext | null>(null)
  const uRef      = useRef<WarpUniforms | null>(null)
  const t0Ref     = useRef<number>(performance.now())

  // Live-update uniforms when props change without re-mounting
  const warpSpeedRef   = useRef(warpSpeed)
  const gridDensityRef = useRef(gridDensity)
  const aberrationRef  = useRef(aberration)
  warpSpeedRef.current   = warpSpeed
  gridDensityRef.current = gridDensity
  aberrationRef.current  = aberration

  const render = useCallback(() => {
    const gl = glRef.current
    const u  = uRef.current
    if (!gl || !u) return

    const t = (performance.now() - t0Ref.current) * 0.001

    gl.uniform1f(u.uTime,        t)
    gl.uniform2f(u.uResolution,  gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform1f(u.uWarpSpeed,   warpSpeedRef.current)
    gl.uniform1f(u.uGridDensity, gridDensityRef.current)
    gl.uniform1f(u.uAberration,  aberrationRef.current)

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    rafRef.current = requestAnimationFrame(render)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    }) as WebGLRenderingContext | null

    if (!gl) return
    glRef.current = gl

    // Build program
    const prog = createProgram(gl, SPACETIME_VERT, SPACETIME_FRAG)
    gl.useProgram(prog)

    // Quad buffer
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, "position")
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    // Cache uniform locations
    uRef.current = {
      uTime:        gl.getUniformLocation(prog, "uTime"),
      uResolution:  gl.getUniformLocation(prog, "uResolution"),
      uWarpSpeed:   gl.getUniformLocation(prog, "uWarpSpeed"),
      uGridDensity: gl.getUniformLocation(prog, "uGridDensity"),
      uAberration:  gl.getUniformLocation(prog, "uAberration"),
    }

    // Resize observer — keeps pixel ratio correct
    const observer = new ResizeObserver(() => {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width  = canvas.clientWidth  * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    })
    observer.observe(canvas)

    // Kick off render loop
    t0Ref.current = performance.now()
    rafRef.current = requestAnimationFrame(render)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      aria-label="Space-time warp animation"
    />
  )
}
