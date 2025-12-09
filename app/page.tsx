import dynamic from "next/dynamic"
import { ScrollSections } from "@/components/scroll-sections"
import { UIOverlay } from "@/components/ui-overlay"
import { SmoothScroll } from "@/components/smooth-scroll"
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay"

const WebGLCanvas = dynamic(() => import("@/components/webgl/WebGLCanvas"), {
  ssr: false,
})

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <WebGLCanvas />
        <UIOverlay />
        <ScrollSections />
        <ScanlineOverlay />
      </main>
    </SmoothScroll>
  )
}
