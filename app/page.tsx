import { ScrollSections } from "@/components/scroll-sections"
import { UIOverlay } from "@/components/ui-overlay"
import { SmoothScroll } from "@/components/smooth-scroll"
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay"
import { WebGLCanvasLoader } from "@/components/WebGLCanvasLoader"

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <WebGLCanvasLoader />
        <UIOverlay />
        <ScrollSections />
        <ScanlineOverlay />
      </main>
    </SmoothScroll>
  )
}
