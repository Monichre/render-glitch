"use client"

import dynamic from "next/dynamic"

const WebGLCanvas = dynamic(() => import("@/components/webgl/WebGLCanvas"), {
  ssr: false,
  loading: () => null,
})

export function WebGLCanvasLoader() {
  return <WebGLCanvas />
}
