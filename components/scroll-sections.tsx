"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { HeroSection } from "./sections/HeroSection"
import { LazyRenderSection } from "./sections/SolarPanelsSection"
import { WaterCycleSection } from "./sections/WaterCycleSection"
import { ClimateControlSection } from "./sections/ClimateControlSection"
import { CarbonStorageSection } from "./sections/CarbonStorageSection"
import { BiodiversitySection } from "./sections/BiodiversitySection"
import { AnomaliesSection } from "./sections/AnomaliesSection"
import { FooterSection } from "./sections/FooterSection"

gsap.registerPlugin(ScrollTrigger)

export function ScrollSections() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const lenis = (window as any).lenis
      if (lenis) {
        lenis.on("scroll", ScrollTrigger.update)
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000)
        })
        gsap.ticker.lagSmoothing(0)
      }

      const webglScene = (window as any).webglScene

      const sections = [
        { id: "intro", cameraSection: "intro" },
        { id: "lazy-render", cameraSection: "solarPanels" },
        { id: "global-state", cameraSection: "waterCycle" },
        { id: "rootkit", cameraSection: "climateControl" },
        { id: "time-artifact", cameraSection: "carbonStorage" },
        { id: "consciousness", cameraSection: "biodiversity" },
        { id: "anomalies", cameraSection: "biodiversity" },
      ]

      sections.forEach(({ id, cameraSection }) => {
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: "top center",
          end: "bottom center",
          onUpdate: (self) => {
            if (webglScene) {
              webglScene.setCameraPosition(self.progress, cameraSection)
            }
          },
        })
      })

      gsap.utils.toArray<HTMLElement>(".animate-text").forEach((el) => {
        gsap.fromTo(
          el,
          {
            y: 40,
            opacity: 0,
          },
          {
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 60%",
              scrub: 1,
            },
            y: 0,
            opacity: 1,
            ease: "power2.out",
          },
        )
      })

      gsap.utils.toArray<HTMLElement>(".info-card").forEach((el) => {
        gsap.fromTo(
          el,
          {
            y: 60,
            opacity: 0,
            scale: 0.95,
          },
          {
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "top 50%",
              scrub: 1,
            },
            y: 0,
            opacity: 1,
            scale: 1,
            ease: "power3.out",
          },
        )
      })

      gsap.utils.toArray<HTMLElement>(".section-label").forEach((el) => {
        gsap.fromTo(
          el,
          {
            x: -30,
            opacity: 0,
          },
          {
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "top 60%",
              scrub: 1,
            },
            x: 0,
            opacity: 1,
            ease: "power2.out",
          },
        )
      })
    }, 100)

    return () => {
      clearTimeout(timeout)
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  return (
    <div ref={containerRef} className="relative z-10">
      <HeroSection />
      <LazyRenderSection />
      <WaterCycleSection />
      <ClimateControlSection />
      <CarbonStorageSection />
      <BiodiversitySection />
      <AnomaliesSection />
      <FooterSection />
    </div>
  )
}
