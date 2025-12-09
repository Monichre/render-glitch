"use client"

export function ScanlineOverlay() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines opacity-[0.015]" />

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-6 h-6">
        <div className="absolute top-0 left-0 w-full h-px bg-primary/20" />
        <div className="absolute top-0 left-0 h-full w-px bg-primary/20" />
      </div>
      <div className="absolute top-4 right-4 w-6 h-6">
        <div className="absolute top-0 right-0 w-full h-px bg-primary/20" />
        <div className="absolute top-0 right-0 h-full w-px bg-primary/20" />
      </div>
      <div className="absolute bottom-4 left-4 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-full h-px bg-primary/20" />
        <div className="absolute bottom-0 left-0 h-full w-px bg-primary/20" />
      </div>
      <div className="absolute bottom-4 right-4 w-6 h-6">
        <div className="absolute bottom-0 right-0 w-full h-px bg-primary/20" />
        <div className="absolute bottom-0 right-0 h-full w-px bg-primary/20" />
      </div>

      {/* Animated scan line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-scan" />
    </div>
  )
}
