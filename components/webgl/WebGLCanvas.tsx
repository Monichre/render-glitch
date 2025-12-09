"use client"

import { useEffect, useRef, useState } from "react"
import { WebGLScene } from "@/lib/webgl/WebGLScene"
import { LoadingScreen } from "../loading-screen"

export default function WebGLCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<WebGLScene | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new WebGLScene(containerRef.current, () => {
      // Delay to show loading animation
      setTimeout(() => setIsLoading(false), 800)
    })
    sceneRef.current = scene

    // Expose scene for scroll animations
    ;(window as any).webglScene = scene

    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div
        ref={containerRef}
        className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: isLoading ? 0 : 1, touchAction: "none" }}
      />
    </>
  )
}
