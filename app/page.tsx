import { ScrollSections } from "@/components/scroll-sections"
import { UIOverlay } from "@/components/ui-overlay"
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay"
import { WebGLCanvasLoader } from "@/components/WebGLCanvasLoader"
import { TopologyBackground } from "@/components/TopologyBackground"

export default function HomePage() {
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      {/* CSS topology layer — visible during WebGL load & on low-power devices */}
      <TopologyBackground />
      {/* Fixed WebGL canvas sits above the CSS bg, below UI */}
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
