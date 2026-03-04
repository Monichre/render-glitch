"use client"

import { useEffect, useRef, useState } from "react"

const BOOT_LINES = [
  { text: "[SYS] ROOTKIT_REALITY v1.0.0 — BOOT SEQUENCE", delay: 0, type: "system" as const },
  { text: "[OK]  SANDBOX_ENV loaded", delay: 400, type: "ok" as const },
  { text: "[OK]  OBSERVER_MODULE linked", delay: 800, type: "ok" as const },
  { text: "[OK]  LAZY_RENDER pipeline active", delay: 1200, type: "ok" as const },
  { text: "[WARN] COLLAPSE deferred — observer not committed", delay: 1700, type: "warn" as const },
  { text: "[OK]  ENTANGLEMENT state-sync enabled", delay: 2200, type: "ok" as const },
  { text: "[OK]  TIME_LOG compiler initialized", delay: 2600, type: "ok" as const },
  { text: "[WARN] CONSCIOUSNESS runtime — access level: SANDBOX", delay: 3100, type: "warn" as const },
  { text: "[OK]  ANOMALY_DETECTION protocol armed", delay: 3600, type: "ok" as const },
  { text: "[SYS] All subsystems nominal. Render loop active.", delay: 4200, type: "system" as const },
  { text: "", delay: 4600, type: "empty" as const },
  { text: '> "The most merciful thing is the inability to correlate all its contents."', delay: 5000, type: "quote" as const },
  { text: ">   — H.P. LOVECRAFT", delay: 5500, type: "quote" as const },
]

export function TerminalBlock() {
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    BOOT_LINES.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [...prev, index])
        if (preRef.current) {
          preRef.current.scrollTop = preRef.current.scrollHeight
        }
      }, line.delay)
      timersRef.current.push(timer)
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [hasStarted])

  const getLineColor = (type: string) => {
    switch (type) {
      case "system": return "text-primary"
      case "ok": return "text-primary/70"
      case "warn": return "text-warning"
      case "quote": return "text-muted-foreground/50 italic"
      case "empty": return ""
      default: return "text-muted-foreground"
    }
  }

  return (
    <div ref={containerRef} className="relative bg-background/80 border border-primary/20 overflow-hidden">
      {/* Terminal header bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-primary/20 bg-card/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary/60" />
          <span className="w-2 h-2 rounded-full bg-warning/60" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        </div>
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          rootkit_reality.log
        </span>
      </div>

      {/* Terminal body */}
      <pre
        ref={preRef}
        className="p-4 md:p-6 font-mono text-[10px] md:text-xs leading-relaxed overflow-y-auto max-h-64 scrollbar-thin"
      >
        {BOOT_LINES.map((line, index) => (
          <div
            key={index}
            className={`transition-all duration-200 ${getLineColor(line.type)}`}
            style={{
              opacity: visibleLines.includes(index) ? 1 : 0,
              transform: visibleLines.includes(index) ? "translateX(0)" : "translateX(-8px)",
            }}
          >
            {line.text || "\u00A0"}
          </div>
        ))}
        {hasStarted && visibleLines.length >= BOOT_LINES.length && (
          <div className="text-primary/80 mt-1">
            {'> '}<span className="terminal-cursor inline-block w-2 h-3.5 bg-primary/80 align-text-bottom" />
          </div>
        )}
      </pre>
    </div>
  )
}
