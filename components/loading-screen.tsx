"use client"

import { useEffect, useState } from "react"

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  const phases = ["Initializing scene", "Loading geometry", "Compiling shaders", "Rendering"]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 8 + 2
        if (newProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        setPhase(Math.min(Math.floor(newProgress / 25), 3))
        return newProgress
      })
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines opacity-30" />

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo/Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border border-primary/50 flex items-center justify-center rotate-45">
            <div className="w-4 h-4 bg-primary -rotate-45" />
          </div>
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-primary mt-4">Nature Beyond</span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-px w-64 bg-border overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-200 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            {/* Glow effect */}
            <div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
              style={{
                left: `${Math.min(progress, 100)}%`,
                transform: "translateX(-50%)",
              }}
            />
          </div>

          {/* Phase text */}
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground h-4">
            {phases[phase]}...
          </div>
        </div>

        {/* Percentage */}
        <div className="font-mono text-3xl text-foreground tabular-nums tracking-wider">
          {String(Math.min(Math.round(progress), 100)).padStart(3, "0")}
          <span className="text-primary">%</span>
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-8 -left-8 w-4 h-4 border-l border-t border-primary/30" />
        <div className="absolute -top-8 -right-8 w-4 h-4 border-r border-t border-primary/30" />
        <div className="absolute -bottom-8 -left-8 w-4 h-4 border-l border-b border-primary/30" />
        <div className="absolute -bottom-8 -right-8 w-4 h-4 border-r border-b border-primary/30" />
      </div>
    </div>
  )
}
