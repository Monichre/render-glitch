"use client"

import { cn } from "@/lib/utils"

interface DataDisplayProps {
  label: string
  value: string | number
  unit?: string
  className?: string
  animated?: boolean
}

export function DataDisplay({ label, value, unit, className, animated = false }: DataDisplayProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-mono text-lg tabular-nums text-foreground", animated && "animate-pulse-glow")}>
          {value}
        </span>
        {unit && <span className="font-mono text-[10px] text-primary/70">{unit}</span>}
      </div>
    </div>
  )
}
