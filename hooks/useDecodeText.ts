"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`01"

export function useDecodeText(
  text: string,
  options: { speed?: number; stagger?: number } = {}
) {
  const { speed = 30, stagger = 2 } = options
  const [displayText, setDisplayText] = useState(text)
  const [hasDecoded, setHasDecoded] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  const frameRef = useRef<number>(0)
  const hasTriggeredRef = useRef(false)

  const decode = useCallback(() => {
    if (hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    let iteration = 0
    const totalIterations = text.length * stagger

    const run = () => {
      const decoded = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " "
          if (i < iteration / stagger) return char
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        })
        .join("")

      setDisplayText(decoded)
      iteration++

      if (iteration <= totalIterations) {
        frameRef.current = window.setTimeout(run, speed)
      } else {
        setDisplayText(text)
        setHasDecoded(true)
      }
    }

    run()
  }, [text, speed, stagger])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          decode()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      if (frameRef.current) clearTimeout(frameRef.current)
    }
  }, [decode])

  return { displayText, elementRef, hasDecoded }
}
