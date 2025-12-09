"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "./ui/CircularProgress"

const SECTIONS = [
  { id: "intro", label: "Intro", shortLabel: "00" },
  { id: "lazy-render", label: "Lazy Render", shortLabel: "01" },
  { id: "global-state", label: "Global State", shortLabel: "02" },
  { id: "rootkit", label: "Rootkit", shortLabel: "03" },
  { id: "time-artifact", label: "Time", shortLabel: "04" },
  { id: "consciousness", label: "Observer", shortLabel: "05" },
  { id: "anomalies", label: "Anomalies", shortLabel: "06" },
]

export function UIOverlay() {
  const [currentSection, setCurrentSection] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [time, setTime] = useState("")

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 1500)

    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }))
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollY / docHeight
      setScrollProgress(progress)
      const sectionIndex = Math.min(Math.floor(progress * SECTIONS.length), SECTIONS.length - 1)
      setCurrentSection(sectionIndex)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      clearTimeout(timeout)
      clearInterval(timeInterval)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div className={cn("transition-opacity duration-1000", isVisible ? "opacity-100" : "opacity-0")}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative w-8 h-8 border border-primary/60 flex items-center justify-center group cursor-pointer hover:border-primary transition-colors">
            <div className="w-3 h-3 bg-primary group-hover:scale-110 transition-transform" />
            <div className="absolute -top-px -left-px w-2 h-2 border-l border-t border-primary" />
            <div className="absolute -top-px -right-px w-2 h-2 border-r border-t border-primary" />
            <div className="absolute -bottom-px -left-px w-2 h-2 border-l border-b border-primary" />
            <div className="absolute -bottom-px -right-px w-2 h-2 border-r border-b border-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-foreground/90">
              Render Glitches
            </span>
            <span className="font-mono text-[8px] tracking-wider text-muted-foreground">ROOTKIT REALITY</span>
          </div>
        </div>

        {/* Center time display */}
        <div className="hidden md:flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
          <span className="tracking-wider">{time}</span>
          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          <span className="tracking-wider">SANDBOX</span>
        </div>

        <nav className="hidden lg:flex items-center gap-6 pointer-events-auto">
          {SECTIONS.slice(1).map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                const element = document.getElementById(section.id)
                element?.scrollIntoView({ behavior: "smooth" })
              }}
              className={cn(
                "relative font-mono text-[10px] tracking-wider uppercase transition-all duration-300 py-1",
                currentSection === index + 1 ? "text-primary" : "text-foreground/40 hover:text-foreground/70",
              )}
            >
              <span className="mr-1.5 text-[8px] opacity-50">{section.shortLabel}</span>
              {section.label}
              {currentSection === index + 1 && <div className="absolute -bottom-0 left-0 right-0 h-px bg-primary" />}
            </button>
          ))}
        </nav>
      </header>

      {/* Progress indicator - left side */}
      <div className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3">
        <div className="relative">
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                const element = document.getElementById(section.id)
                element?.scrollIntoView({ behavior: "smooth" })
              }}
              className="group flex items-center gap-3 relative py-1.5"
            >
              <div className="relative">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full border transition-all duration-300",
                    currentSection === index
                      ? "bg-primary border-primary scale-125 shadow-[0_0_10px_rgba(64,255,170,0.5)]"
                      : "border-foreground/30 group-hover:border-foreground/60",
                  )}
                />
                {currentSection === index && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/30 animate-ping" />
                )}
              </div>
              <span
                className={cn(
                  "font-mono text-[9px] tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-all duration-200",
                  currentSection === index ? "text-primary" : "text-foreground/50",
                )}
              >
                {section.shortLabel}
              </span>
            </button>
          ))}

          {/* Progress line */}
          <div className="absolute left-[3px] top-0 bottom-0 w-px bg-border/20 -z-10">
            <div
              className="w-full bg-gradient-to-b from-primary/70 to-primary/30 transition-all duration-500 ease-out"
              style={{ height: `${(currentSection / (SECTIONS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right side circular progress */}
      <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-4">
        <CircularProgress progress={scrollProgress * 100} size={56} strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-0.5 font-mono text-[8px] text-muted-foreground">
          <span>DEPTH</span>
          <span className="text-primary text-[10px]">{(scrollProgress * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Scroll progress bar - bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-border/20 z-40">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-150 ease-out relative"
          style={{ width: `${scrollProgress * 100}%` }}
        >
          <div className="absolute right-0 top-0 w-2 h-full bg-primary shadow-[0_0_8px_rgba(64,255,170,0.6)]" />
        </div>
      </div>

      {/* Bottom left data display */}
      <div className="fixed bottom-4 md:bottom-6 left-4 md:left-6 z-40 font-mono text-[9px] text-muted-foreground/50 tracking-wider hidden md:block">
        <div className="flex flex-col gap-0.5">
          <span>KERNEL: HIDDEN</span>
          <span>COLLAPSE: DEFERRED</span>
        </div>
      </div>

      {/* Coordinates display */}
      <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-40 font-mono text-[9px] text-muted-foreground/40 tracking-wider">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary/50" />
            <span>SECTION {String(currentSection + 1).padStart(2, "0")}</span>
          </div>
          <span className="text-[8px]">OF {String(SECTIONS.length).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  )
}
