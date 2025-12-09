"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface TechLabelProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "accent" | "muted"
}

export function TechLabel({ children, className, variant = "default" }: TechLabelProps) {
  const variants = {
    default: "text-foreground/60 border-border/50",
    accent: "text-primary border-primary/50",
    muted: "text-muted-foreground border-border/30",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono text-[9px] tracking-[0.2em] uppercase",
        variants[variant],
        className,
      )}
    >
      <span className="w-1 h-1 bg-current opacity-60" />
      {children}
    </span>
  )
}
