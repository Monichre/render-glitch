"use client"

/**
 * ControlsPanel.tsx
 * Tweakpane-style controls panel for the particle system.
 * Auto-fades when idle; restores on mouse entry.
 * Fires onControlsChange with a partial SceneControls diff.
 */

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { TEMPLATES } from "@/lib/multifractal/templates/TemplateRegistry"
import type { SceneControls } from "@/lib/webgl/WebGLScene"

interface ControlsPanelProps {
  onControlsChange: (controls: Partial<SceneControls>) => void
  className?: string
}

interface SliderRowProps {
  label:    string
  value:    number
  min:      number
  max:      number
  step:     number
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="font-mono text-[9px] text-muted-foreground/60 w-28 shrink-0 uppercase tracking-wider">
        {label}
      </span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-[2px] accent-primary cursor-pointer"
      />
      <span className="font-mono text-[9px] text-primary/60 w-8 text-right shrink-0">
        {value.toFixed(step < 0.1 ? 2 : 1)}
      </span>
    </div>
  )
}

interface ToggleRowProps {
  label:    string
  value:    boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "font-mono text-[9px] px-2 py-0.5 border transition-colors",
          value
            ? "border-primary/60 bg-primary/10 text-primary"
            : "border-border/30 text-muted-foreground/40 hover:border-primary/30"
        )}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1">
      <span className="font-mono text-[8px] text-primary/40 uppercase tracking-[0.2em]">{label}</span>
      <div className="flex-1 h-px bg-primary/10" />
    </div>
  )
}

export function ControlsPanel({ onControlsChange, className }: ControlsPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // State mirrors SceneControls defaults
  const [templateID,        setTemplateID]        = useState(0)
  const [qOrder,            setQOrder]             = useState(2.0)
  const [epsilon,           setEpsilon]            = useState(0.3)
  const [gravityStrength,   setGravityStrength]    = useState(0.05)
  const [windStrength,      setWindStrength]       = useState(0.3)
  const [physicsMultiplier, setPhysicsMultiplier]  = useState(1.0)
  const [particleSizeMin,   setParticleSizeMin]    = useState(0.5)
  const [particleSizeMax,   setParticleSizeMax]    = useState(4.0)
  const [opacity,           setOpacity]            = useState(0.7)
  const [bloomIntensity,    setBloomIntensity]     = useState(0.7)
  const [chromaticAmount,   setChromaticAmount]    = useState(0.0015)
  const [anomalyDetection,  setAnomalyDetection]   = useState(false)
  const [spectrumMode,      setSpectrumMode]       = useState<"legendre" | "wavelet">("legendre")
  const [hudVisible,        setHudVisible]         = useState(true)

  const emit = useCallback((diff: Partial<SceneControls>) => {
    onControlsChange(diff)
  }, [onControlsChange])

  const handleMouseEnter = () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    setIsHovered(true)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    fadeTimer.current = setTimeout(() => setIsVisible(false), 2000)
  }

  // Trigger button (always visible in corner)
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(v => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "font-mono text-[9px] tracking-widest uppercase",
          "px-3 py-2 border border-primary/30 bg-background/80 backdrop-blur-sm",
          "text-primary/60 hover:text-primary hover:border-primary/60 transition-colors"
        )}
      >
        {isVisible ? "CLOSE" : "CONTROLS"}
      </button>

      {/* Panel */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed bottom-16 right-6 z-50 w-72",
          "border border-primary/20 bg-background/90 backdrop-blur-md",
          "transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
          <span className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">
            Particle Controls
          </span>
          <span className="font-mono text-[7px] text-muted-foreground/30">
            v1.0
          </span>
        </div>

        <div className="px-3 pb-3 overflow-y-auto max-h-[70vh] space-y-0">

          {/* Template */}
          <SectionHeader label="Template" />
          <div className="flex items-center gap-2 py-1">
            <span className="font-mono text-[9px] text-muted-foreground/60 w-28 shrink-0 uppercase tracking-wider">
              Scene
            </span>
            <select
              value={templateID}
              onChange={e => {
                const v = parseInt(e.target.value)
                setTemplateID(v)
                emit({ templateID: v })
              }}
              className="flex-1 bg-background border border-border/30 text-foreground font-mono text-[9px] px-1 py-0.5 focus:outline-none focus:border-primary/40"
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.id.toString().padStart(2,"0")} {t.name}</option>
              ))}
            </select>
          </div>

          {/* Multifractal */}
          <SectionHeader label="Multifractal" />
          <SliderRow label="q-Order"  value={qOrder}   min={-10} max={10}  step={0.1}
            onChange={v => { setQOrder(v);   emit({ qOrder: v }) }} />
          <SliderRow label="ε Scale"  value={epsilon}  min={0.01} max={1.0} step={0.01}
            onChange={v => { setEpsilon(v);  emit({ epsilon: v }) }} />

          <div className="flex items-center justify-between py-1">
            <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Spectrum Mode
            </span>
            <div className="flex gap-1">
              {(["legendre", "wavelet"] as const).map(mode => (
                <button key={mode}
                  onClick={() => { setSpectrumMode(mode); emit({ spectrumMode: mode }) }}
                  className={cn(
                    "font-mono text-[8px] px-2 py-0.5 border transition-colors",
                    spectrumMode === mode
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border/20 text-muted-foreground/30 hover:border-primary/30"
                  )}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow label="Anomaly Detection" value={anomalyDetection}
            onChange={v => { setAnomalyDetection(v); emit({ anomalyDetection: v }) }} />

          {/* Physics */}
          <SectionHeader label="Physics" />
          <SliderRow label="Gravity"   value={gravityStrength}   min={0} max={2}   step={0.01}
            onChange={v => { setGravityStrength(v);   emit({ gravityStrength: v }) }} />
          <SliderRow label="Wind"      value={windStrength}      min={0} max={1}   step={0.01}
            onChange={v => { setWindStrength(v);      emit({ windStrength: v }) }} />
          <SliderRow label="Physics ×" value={physicsMultiplier} min={0} max={2}   step={0.01}
            onChange={v => { setPhysicsMultiplier(v); emit({ physicsMultiplier: v }) }} />

          {/* Particles */}
          <SectionHeader label="Particles" />
          <SliderRow label="Size Min"  value={particleSizeMin} min={0.01} max={5}  step={0.01}
            onChange={v => { setParticleSizeMin(v); emit({ particleSizeMin: v }) }} />
          <SliderRow label="Size Max"  value={particleSizeMax} min={0.01} max={10} step={0.01}
            onChange={v => { setParticleSizeMax(v); emit({ particleSizeMax: v }) }} />
          <SliderRow label="Opacity"   value={opacity}         min={0}    max={1}  step={0.01}
            onChange={v => { setOpacity(v);         emit({ opacity: v }) }} />

          {/* Post FX */}
          <SectionHeader label="Post FX" />
          <SliderRow label="Bloom"     value={bloomIntensity}  min={0}    max={2}     step={0.01}
            onChange={v => { setBloomIntensity(v);  emit({ bloomIntensity: v }) }} />
          <SliderRow label="Chromatic" value={chromaticAmount} min={0}    max={0.01}  step={0.0001}
            onChange={v => { setChromaticAmount(v); emit({ chromaticAmount: v }) }} />

          {/* HUD */}
          <SectionHeader label="Overlay" />
          <ToggleRow label="Spectrum HUD" value={hudVisible}
            onChange={v => setHudVisible(v)} />
        </div>
      </div>
    </>
  )
}
