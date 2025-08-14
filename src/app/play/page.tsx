'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { BlackjackGame } from '@/components/BlackjackGame'

export default function PlayPage() {
  const router = useRouter()
  const { setGameMode, gameMode } = useGameStore()

  useEffect(() => {
    // Set to normal game mode when entering play page
    setGameMode('normal')
  }, [setGameMode])

  // Handle menu navigation by redirecting to home
  const handleModeSelect = (mode: string) => {
    if (mode === 'menu') {
      router.push('/')
    } else {
      setGameMode(mode as any)
    }
  }

  return (
    <BlackjackGame />
  )
}