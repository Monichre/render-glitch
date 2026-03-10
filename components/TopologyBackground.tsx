"use client"

import { useEffect, useState } from "react"

export function TopologyBackground() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Preload the image
    const img = new Image()
    img.src = "/topology-bg.jpg"
    img.onload = () => setLoaded(true)
  }, [])

  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
        opacity: loaded ? 1 : 0,
        transition: "opacity 1s ease-in-out",
      }}
    >
      {/* Topology background - fixed and immersive */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/topology-bg.jpg')",
          backgroundAttachment: "fixed",
          filter: "brightness(0.6) contrast(1.2) saturate(1.1)",
          mixBlendMode: "screen",
        }}
      />
      
      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 20%, rgba(4, 6, 8, 0.4) 70%, rgba(4, 6, 8, 0.8) 100%),
            linear-gradient(to bottom, rgba(4, 6, 8, 0.3) 0%, transparent 30%, transparent 70%, rgba(4, 6, 8, 0.5) 100%)
          `,
        }}
      />

      {/* Animated scan line for tech aesthetic */}
      <div
        className="absolute inset-0 w-full h-full opacity-10"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(64, 255, 170, 0.05) 4px, rgba(64, 255, 170, 0.05) 6px)",
          animation: "topology-scan 20s linear infinite",
        }}
      />
      
      {/* Corner vignette for focus */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(4, 6, 8, 0.6) 80%)",
        }}
      />
    </div>
  )
}
