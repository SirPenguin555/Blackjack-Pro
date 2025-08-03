/**
 * Safe localStorage utilities for SSR compatibility
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error)
      return false
    }
  },

  clear: (): boolean => {
    if (!isBrowser) return false
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
      return false
    }
  }
}

// Check if localStorage is available
export const isLocalStorageAvailable = (): boolean => isBrowser