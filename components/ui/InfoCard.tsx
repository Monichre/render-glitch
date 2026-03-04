"use client"

import { cn } from "@/lib/utils"
import { TechLabel } from "./TechLabel"
import { useDecodeText } from "@/hooks/useDecodeText"

interface Stat {
  label: string
  value: string
}

interface InfoCardProps {
  number: string
  title: string
  subtitle: string
  description: string
  stats: Stat[]
  className?: string
}

export function InfoCard({ number, title, subtitle, description, stats, className }: InfoCardProps) {
  const { displayText, elementRef } = useDecodeText(description, { speed: 20, stagger: 1.5 })
  return (
    <div
      className={cn(
        "info-card relative bg-card/50 backdrop-blur-md border border-border/40 p-6 md:p-8",
        "before:absolute before:top-0 before:left-0 before:w-full before:h-px before:bg-gradient-to-r before:from-primary/60 before:via-primary before:to-primary/60",
        "after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/40 after:to-transparent",
        "hover:bg-card/60 transition-colors duration-500",
        className,
      )}
    >
      {/* Corner accents - enhanced */}
      <div className="absolute top-0 left-0 w-5 h-5">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
        <div className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
      </div>
      <div className="absolute top-0 right-0 w-5 h-5">
        <div className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
        <div className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
      </div>
      <div className="absolute bottom-0 left-0 w-5 h-5">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/40" />
        <div className="absolute bottom-0 left-0 h-full w-0.5 bg-primary/40" />
      </div>
      <div className="absolute bottom-0 right-0 w-5 h-5">
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/40" />
        <div className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/40" />
      </div>

      {/* Number badge */}
      <div className="absolute -top-3 left-6 bg-background px-3 py-0.5 border border-primary/30">
        <span className="font-mono text-xs text-primary tracking-[0.15em]">[{number}]</span>
      </div>

      {/* Status indicator */}
      <div className="absolute -top-3 right-6 bg-background px-2 py-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[8px] text-muted-foreground tracking-wider">ACTIVE</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight">{title}</h2>
          <TechLabel variant="accent">{subtitle}</TechLabel>
        </div>

        {/* Description - with decode effect */}
        <p
          ref={elementRef as React.RefObject<HTMLParagraphElement>}
          className="text-sm md:text-base text-muted-foreground leading-relaxed font-mono"
        >
          {displayText}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/30">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-1 group">
              <div className="font-mono text-lg md:text-xl text-foreground tabular-nums group-hover:text-primary transition-colors">
                {stat.value}
              </div>
              <div className="font-mono text-[8px] md:text-[9px] text-muted-foreground tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02] rounded-none">
        <div className="absolute inset-0 scanlines" />
      </div>

      {/* Animated scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          style={{
            animation: "scan 4s linear infinite",
            top: 0,
          }}
        />
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
      </div>
    </div>
  )
}
