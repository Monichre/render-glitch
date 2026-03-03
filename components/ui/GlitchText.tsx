"use client"

import { cn } from "@/lib/utils"

interface GlitchTextProps {
  children: string
  className?: string
  as?: "h1" | "h2" | "h3" | "span"
}

export function GlitchText({ children, className, as: Tag = "span" }: GlitchTextProps) {
  return (
    <Tag
      className={cn("glitch-text", className)}
      data-text={children}
    >
      {children}
    </Tag>
  )
}
