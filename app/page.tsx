import { ScrollSections } from "@/components/scroll-sections"
import { UIOverlay } from "@/components/ui-overlay"
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay"
import { WebGLCanvasLoader } from "@/components/WebGLCanvasLoader"

export default function HomePage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      {/* Fixed WebGL canvas sits behind everything */}
      <WebGLCanvasLoader />
      {/* Fixed HUD chrome */}
      <UIOverlay />
      {/* Z-depth scroll engine: phantom tall div + fixed layer stack */}
      <ScrollSections />
      {/* Fixed scanline post-fx */}
      <ScanlineOverlay />
    </main>
  )
}
