/**
 * Performance optimization utilities for smooth gameplay
 */

// Debounce function for frequent events
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for animation-heavy operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Optimized animation frame scheduler
export class AnimationScheduler {
  private callbacks: Set<() => void> = new Set()
  private isRunning = false

  add(callback: () => void) {
    this.callbacks.add(callback)
    if (!this.isRunning) {
      this.start()
    }
  }

  remove(callback: () => void) {
    this.callbacks.delete(callback)
    if (this.callbacks.size === 0) {
      this.stop()
    }
  }

  private start() {
    this.isRunning = true
    this.tick()
  }

  private stop() {
    this.isRunning = false
  }

  private tick = () => {
    if (this.isRunning) {
      this.callbacks.forEach(callback => callback())
      requestAnimationFrame(this.tick)
    }
  }
}

// Global animation scheduler instance
export const animationScheduler = new AnimationScheduler()

// Performance monitoring
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map()

  mark(name: string) {
    const now = performance.now()
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    this.measurements.get(name)!.push(now)
  }

  measure(startMark: string, endMark: string): number {
    const startTimes = this.measurements.get(startMark) || []
    const endTimes = this.measurements.get(endMark) || []
    
    if (startTimes.length === 0 || endTimes.length === 0) {
      return 0
    }

    const start = startTimes[startTimes.length - 1]
    const end = endTimes[endTimes.length - 1]
    
    return end - start
  }

  getAverageTime(name: string, count: number = 10): number {
    const times = this.measurements.get(name) || []
    if (times.length < 2) return 0

    const recentTimes = times.slice(-count)
    const intervals = []
    
    for (let i = 1; i < recentTimes.length; i++) {
      intervals.push(recentTimes[i] - recentTimes[i - 1])
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  }

  clear() {
    this.measurements.clear()
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// Memory optimization utilities
export function cleanupUnusedObjects<T>(
  objects: T[],
  isUsed: (obj: T) => boolean
): T[] {
  return objects.filter(isUsed)
}

// Efficient card shuffle for better performance
export function optimizedShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  
  // Fisher-Yates shuffle optimized for performance
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    
    // Use destructuring for swap (faster than temp variable)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

// Batch DOM updates to prevent layout thrashing
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

// Device-specific performance settings
export function getPerformanceSettings() {
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  const isSlowConnection = navigator.connection && 
    (navigator.connection.effectiveType === 'slow-2g' || 
     navigator.connection.effectiveType === '2g')

  return {
    reduceAnimations: isLowEnd || isSlowConnection,
    animationDuration: isLowEnd ? 200 : 400,
    maxParticles: isLowEnd ? 5 : 20,
    enableAdvancedEffects: !isLowEnd && !isSlowConnection
  }
}

// Preload assets for smoother experience
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
      })
    )
  )
}

// Lazy loading utility
export function createLazyLoader<T>(
  loader: () => Promise<T>
): () => Promise<T> {
  let promise: Promise<T> | null = null
  
  return () => {
    if (!promise) {
      promise = loader()
    }
    return promise
  }
}