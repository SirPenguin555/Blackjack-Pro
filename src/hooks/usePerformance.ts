'use client'

import { useEffect, useState, useCallback } from 'react'
import { performanceMonitor, getPerformanceSettings } from '@/lib/performance'

interface PerformanceMetrics {
  fps: number
  averageFrameTime: number
  isLowPerformance: boolean
  settings: ReturnType<typeof getPerformanceSettings>
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    averageFrameTime: 16.67,
    isLowPerformance: false,
    settings: getPerformanceSettings()
  })

  const measureFrameRate = useCallback(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let frameStartTime = lastTime

    const measure = () => {
      const currentTime = performance.now()
      frameCount++

      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        const averageFrameTime = (currentTime - lastTime) / frameCount
        
        setMetrics(prev => ({
          ...prev,
          fps,
          averageFrameTime,
          isLowPerformance: fps < 30 || averageFrameTime > 33.33
        }))

        frameCount = 0
        lastTime = currentTime
      }

      frameStartTime = currentTime
      requestAnimationFrame(measure)
    }

    requestAnimationFrame(measure)
  }, [])

  useEffect(() => {
    measureFrameRate()
  }, [measureFrameRate])

  const markPerformance = useCallback((name: string) => {
    performanceMonitor.mark(name)
  }, [])

  const measurePerformance = useCallback((startMark: string, endMark: string) => {
    return performanceMonitor.measure(startMark, endMark)
  }, [])

  return {
    ...metrics,
    markPerformance,
    measurePerformance
  }
}

// Hook for adaptive animation settings based on performance
export function useAdaptiveAnimation() {
  const { isLowPerformance, settings } = usePerformance()

  return {
    shouldReduceMotion: isLowPerformance || settings.reduceAnimations,
    animationDuration: settings.animationDuration,
    animationClass: isLowPerformance ? 'transition-none' : 'transition-smooth',
    enableParticles: settings.enableAdvancedEffects && !isLowPerformance,
    maxParticles: settings.maxParticles
  }
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    hasTouch: false,
    supportsAdvancedFeatures: true,
    screenSize: 'medium' as 'small' | 'medium' | 'large'
  })

  useEffect(() => {
    const checkCapabilities = () => {
      const isMobile = window.innerWidth < 768
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
      const isDesktop = window.innerWidth >= 1024
      const hasTouch = 'ontouchstart' in window
      
      // Check for advanced features support
      const supportsAdvancedFeatures = !!(
        window.requestAnimationFrame &&
        window.CSS &&
        window.CSS.supports &&
        window.CSS.supports('animation', 'running')
      )

      const screenSize = isMobile ? 'small' : isTablet ? 'medium' : 'large'

      setCapabilities({
        isMobile,
        isTablet,
        isDesktop,
        hasTouch,
        supportsAdvancedFeatures,
        screenSize
      })
    }

    checkCapabilities()
    window.addEventListener('resize', checkCapabilities)
    
    return () => window.removeEventListener('resize', checkCapabilities)
  }, [])

  return capabilities
}

// Hook for memory usage monitoring (when available)
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number
    totalJSHeapSize?: number
    jsHeapSizeLimit?: number
    isHighMemoryUsage: boolean
  }>({ isHighMemoryUsage: false })

  useEffect(() => {
    const checkMemory = () => {
      // @ts-ignore - This is a browser-specific API
      if (performance.memory) {
        // @ts-ignore
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory
        
        const usageRatio = usedJSHeapSize / jsHeapSizeLimit
        const isHighMemoryUsage = usageRatio > 0.9

        setMemoryInfo({
          usedJSHeapSize,
          totalJSHeapSize,
          jsHeapSizeLimit,
          isHighMemoryUsage
        })
      }
    }

    checkMemory()
    const interval = setInterval(checkMemory, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}