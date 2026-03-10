"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { WebGLScene, type SceneControls }  from "@/lib/webgl/WebGLScene"
import { LoadingScreen }                   from "../loading-screen"
import { SpectrumHUD }                     from "../ui/SpectrumHUD"
import { ControlsPanel }                   from "../ui/ControlsPanel"
import type { AnalyzerState }              from "@/lib/multifractal/SpectrumAnalyzer"

export default function WebGLCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef     = useRef<WebGLScene | null>(null)
  const rafRef       = useRef<number>(0)

  const [isLoading,    setIsLoading]    = useState(true)
  const [specState,    setSpecState]    = useState<AnalyzerState | null>(null)
  const [hudTab,       setHudTab]       = useState<"fAlpha" | "tau">("fAlpha")

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new WebGLScene(containerRef.current, () => {
      setTimeout(() => setIsLoading(false), 800)
    })
    sceneRef.current = scene
    ;(window as any).webglScene = scene

    // Poll spectrum state at HUD rate (10 FPS)
    const pollSpectrum = () => {
      if (sceneRef.current) {
        const s = sceneRef.current.getSpectrumState()
        setSpecState({ ...s })
      }
      rafRef.current = requestAnimationFrame(pollSpectrum)
    }
    rafRef.current = requestAnimationFrame(pollSpectrum)

    return () => {
      cancelAnimationFrame(rafRef.current)
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  const handleControlsChange = useCallback((controls: Partial<SceneControls>) => {
    sceneRef.current?.applyControls(controls)
  }, [])

  return (
    <>
      {isLoading && <LoadingScreen />}

      <div
        ref={containerRef}
        className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: isLoading ? 0 : 1, touchAction: "none" }}
      />

      {!isLoading && (
        <>
          <SpectrumHUD
            state={specState}
            activeTab={hudTab}
            onTabChange={setHudTab}
          />

          <ControlsPanel onControlsChange={handleControlsChange} />
        </>
      )}
    </>
  )
}
