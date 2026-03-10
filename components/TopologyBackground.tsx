"use client"

import { useEffect, useState } from "react"

export function TopologyBackground() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = "/topology-bg.jpg"
    img.onload = () => setLoaded(true)
  }, [])

  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-[#040608]" />
      
      {/* Topology image - fixed position, no distortion */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: loaded ? "url('/topology-bg.jpg')" : "none",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: loaded ? 0.35 : 0,
          transition: "opacity 1.5s ease-out",
        }}
      />
      
      {/* Radial depth gradient - pushes focus to center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(4,6,8,0.6) 60%, rgba(4,6,8,0.95) 100%)",
        }}
      />

      {/* Top-to-bottom atmospheric gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(4,6,8,0.4) 0%, transparent 25%, transparent 75%, rgba(4,6,8,0.7) 100%)",
        }}
      />
    </div>
  )
}
