import { NetworkFlowFieldCanvas } from "@/components/webgl/NetworkFlowFieldCanvas"

export const metadata = {
  title: "Network Flow Field — Render Glitches",
  description: "A flow field sketch exploring quantized trigonometric angles via hash-based instance routing.",
}

export default function NetworkSketchPage() {
  return (
    <main className="fixed inset-0 bg-background">
      <NetworkFlowFieldCanvas
        rows={32}
        columns={16}
        className="w-full h-full"
        showHUD
      />
    </main>
  )
}
