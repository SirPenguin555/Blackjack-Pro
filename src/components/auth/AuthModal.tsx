'use client'

import { useState } from 'react'
import { authService } from '@/lib/supabase/auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type AuthMode = 'signin' | 'signup' | 'forgot-password'

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  })

  if (!isOpen) return null

  const resetForm = () => {
    setFormData({ email: '', password: '', confirmPassword: '', username: '' })
    setError('')
    setSuccess('')
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    resetForm()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (mode === 'signup') {
      if (!formData.username) {
        setError('Username is required')
        return false
      }

      if (formData.username.length < 3 || formData.username.length > 16) {
        setError('Username must be between 3 and 16 characters')
        return false
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        setError('Username can only contain letters, numbers, underscores, and dashes')
        return false
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    if (mode === 'signin' && !formData.password) {
      setError('Password is required')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (mode === 'signin') {
        console.log('AuthModal: Starting sign in process')
        
        // Test connection first
        const connectionTest = await authService.testConnection()
        if (!connectionTest.connected) {
          console.error('AuthModal: Database connection failed:', connectionTest.error)
          setError(`Connection failed: ${connectionTest.error}`)
          return
        }
        
        const result = await authService.signIn(formData.email, formData.password)
        if (result.error) {
          console.error('AuthModal: Sign in error:', result.error)
          setError(result.error)
        } else {
          console.log('AuthModal: Sign in successful, calling onSuccess')
          // Call success callback and wait for state to update
          onSuccess()
          // Small delay to allow auth state change to propagate
          setTimeout(() => {
            console.log('AuthModal: Closing modal after successful sign in')
            onClose()
          }, 200)
        }
      } else if (mode === 'signup') {
        // Validate username availability
        const usernameValidation = await authService.validateUsername(formData.username)
        if (!usernameValidation.isValid) {
          setError(usernameValidation.error || 'Invalid username')
          return
        }

        const result = await authService.signUp(formData.email, formData.password, formData.username)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
          // Switch to sign in mode after successful signup
          setTimeout(() => {
            switchMode('signin')
          }, 3000)
        }
      } else if (mode === 'forgot-password') {
        const result = await authService.resetPassword(formData.email)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess('Password reset email sent! Check your inbox for instructions.')
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot-password' && 'Reset Password'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                required
                disabled={isLoading}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username (3-16 characters)
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Letters, numbers, _ and - only"
                  required
                  disabled={isLoading}
                  maxLength={16}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Letters, numbers, underscores, and dashes only.
                </p>
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  required
                  disabled={isLoading}
                  minLength={mode === 'signup' ? 6 : undefined}
                />
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {isLoading ? 'Please wait...' : (
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Email'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => switchMode('forgot-password')}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot your password?
                </button>
                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'forgot-password' && (
              <div className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> You'll need to verify your email address to access multiplayer features.
                Single-player modes are available immediately after creating your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}