/**
 * Performance configuration based on device capabilities
 */

export interface PerformanceConfig {
  animations: {
    enabled: boolean
    duration: number
    complexity: 'low' | 'medium' | 'high'
  }
  audio: {
    enabled: boolean
    maxConcurrentSounds: number
  }
  visuals: {
    particleEffects: boolean
    maxParticles: number
    shadowQuality: 'low' | 'medium' | 'high'
  }
  networking: {
    batchUpdates: boolean
    updateFrequency: number // ms
  }
  memory: {
    maxCachedStates: number
    aggressiveCleanup: boolean
  }
}

// Default configurations for different performance tiers
export const PERFORMANCE_CONFIGS: Record<string, PerformanceConfig> = {
  high: {
    animations: {
      enabled: true,
      duration: 600,
      complexity: 'high'
    },
    audio: {
      enabled: true,
      maxConcurrentSounds: 8
    },
    visuals: {
      particleEffects: true,
      maxParticles: 50,
      shadowQuality: 'high'
    },
    networking: {
      batchUpdates: false,
      updateFrequency: 16 // 60fps
    },
    memory: {
      maxCachedStates: 100,
      aggressiveCleanup: false
    }
  },
  medium: {
    animations: {
      enabled: true,
      duration: 400,
      complexity: 'medium'
    },
    audio: {
      enabled: true,
      maxConcurrentSounds: 4
    },
    visuals: {
      particleEffects: true,
      maxParticles: 20,
      shadowQuality: 'medium'
    },
    networking: {
      batchUpdates: true,
      updateFrequency: 33 // 30fps
    },
    memory: {
      maxCachedStates: 50,
      aggressiveCleanup: false
    }
  },
  low: {
    animations: {
      enabled: false,
      duration: 200,
      complexity: 'low'
    },
    audio: {
      enabled: true,
      maxConcurrentSounds: 2
    },
    visuals: {
      particleEffects: false,
      maxParticles: 5,
      shadowQuality: 'low'
    },
    networking: {
      batchUpdates: true,
      updateFrequency: 100 // 10fps
    },
    memory: {
      maxCachedStates: 20,
      aggressiveCleanup: true
    }
  }
}

export function getOptimalPerformanceConfig(): PerformanceConfig {
  // Detect device capabilities
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  const isSlowConnection = navigator.connection && 
    (navigator.connection.effectiveType === 'slow-2g' || 
     navigator.connection.effectiveType === '2g')
  const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory < 4

  // Check for reduced motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Determine performance tier
  if (isLowEndDevice || isSlowConnection || hasLimitedMemory || prefersReducedMotion) {
    return PERFORMANCE_CONFIGS.low
  } else if (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 8) {
    return PERFORMANCE_CONFIGS.high
  } else {
    return PERFORMANCE_CONFIGS.medium
  }
}

// Performance metrics thresholds
export const PERFORMANCE_THRESHOLDS = {
  fps: {
    good: 55,
    poor: 30
  },
  frameTime: {
    good: 16.67, // 60fps
    poor: 33.33  // 30fps
  },
  memory: {
    warning: 0.8,  // 80% of heap limit
    critical: 0.95 // 95% of heap limit
  }
}

// Dynamic performance adjustment
export function adjustPerformanceBasedOnMetrics(
  currentConfig: PerformanceConfig,
  fps: number,
  memoryUsage: number
): PerformanceConfig {
  const newConfig = { ...currentConfig }

  // Reduce animation complexity if FPS is poor
  if (fps < PERFORMANCE_THRESHOLDS.fps.poor) {
    newConfig.animations.enabled = false
    newConfig.animations.duration = Math.max(100, newConfig.animations.duration * 0.5)
    newConfig.visuals.particleEffects = false
    newConfig.audio.maxConcurrentSounds = Math.max(1, Math.floor(newConfig.audio.maxConcurrentSounds * 0.5))
  }

  // Aggressive memory cleanup if usage is high
  if (memoryUsage > PERFORMANCE_THRESHOLDS.memory.warning) {
    newConfig.memory.aggressiveCleanup = true
    newConfig.memory.maxCachedStates = Math.max(10, Math.floor(newConfig.memory.maxCachedStates * 0.5))
  }

  // Reduce network frequency for low-end performance
  if (fps < PERFORMANCE_THRESHOLDS.fps.good) {
    newConfig.networking.batchUpdates = true
    newConfig.networking.updateFrequency = Math.max(50, newConfig.networking.updateFrequency * 1.5)
  }

  return newConfig
}