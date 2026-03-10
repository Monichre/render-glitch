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

const QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1])

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarpUniforms {
  uTime:        WebGLUniformLocation | null
  uResolution:  WebGLUniformLocation | null
  uWarpSpeed:   WebGLUniformLocation | null
  uGridDensity: WebGLUniformLocation | null
  uAberration:  WebGLUniformLocation | null
  uPlanetScale: WebGLUniformLocation | null
  uDustDensity: WebGLUniformLocation | null
}

export interface SpacetimeWarpProps {
  warpSpeed?:   number  // 0.2 – 3.0,  default 0.6
  gridDensity?: number  // 4.0 – 20.0, default 9.0
  aberration?:  number  // 0.0 – 1.0,  default 0.4
  planetScale?: number  // 0.5 – 2.0,  default 1.0
  dustDensity?: number  // 0.0 – 1.0,  default 0.7
  className?:   string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpacetimeWarp({
  warpSpeed   = 0.6,
  gridDensity = 9.0,
  aberration  = 0.4,
  planetScale = 1.0,
  dustDensity = 0.7,
  className   = "",
}: SpacetimeWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const glRef     = useRef<WebGLRenderingContext | null>(null)
  const uRef      = useRef<WarpUniforms | null>(null)
  const t0Ref     = useRef<number>(performance.now())

  // Live ref copies — changing props never causes remount
  const wsRef  = useRef(warpSpeed);   wsRef.current  = warpSpeed
  const gdRef  = useRef(gridDensity); gdRef.current  = gridDensity
  const abRef  = useRef(aberration);  abRef.current  = aberration
  const psRef  = useRef(planetScale); psRef.current  = planetScale
  const ddRef  = useRef(dustDensity); ddRef.current  = dustDensity

  const render = useCallback(() => {
    const gl = glRef.current
    const u  = uRef.current
    if (!gl || !u) return

    const t = (performance.now() - t0Ref.current) * 0.001

    gl.uniform1f(u.uTime,        t)
    gl.uniform2f(u.uResolution,  gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform1f(u.uWarpSpeed,   wsRef.current)
    gl.uniform1f(u.uGridDensity, gdRef.current)
    gl.uniform1f(u.uAberration,  abRef.current)
    gl.uniform1f(u.uPlanetScale, psRef.current)
    gl.uniform1f(u.uDustDensity, ddRef.current)

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

    const prog = createProgram(gl, SPACETIME_VERT, SPACETIME_FRAG)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, "position")
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    uRef.current = {
      uTime:        gl.getUniformLocation(prog, "uTime"),
      uResolution:  gl.getUniformLocation(prog, "uResolution"),
      uWarpSpeed:   gl.getUniformLocation(prog, "uWarpSpeed"),
      uGridDensity: gl.getUniformLocation(prog, "uGridDensity"),
      uAberration:  gl.getUniformLocation(prog, "uAberration"),
      uPlanetScale: gl.getUniformLocation(prog, "uPlanetScale"),
      uDustDensity: gl.getUniformLocation(prog, "uDustDensity"),
    }

    const observer = new ResizeObserver(() => {
      const dpr    = Math.min(window.devicePixelRatio, 2)
      canvas.width  = canvas.clientWidth  * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    })
    observer.observe(canvas)

    t0Ref.current  = performance.now()
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
      aria-label="Deep space cartographic animation"
    />
  )
}
