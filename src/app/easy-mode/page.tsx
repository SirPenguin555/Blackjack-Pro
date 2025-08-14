'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { BlackjackGame } from '@/components/BlackjackGame'

export default function EasyModePage() {
  const router = useRouter()
  const { setGameMode } = useGameStore()

  useEffect(() => {
    // Set to easy game mode when entering easy mode page
    setGameMode('easy')
  }, [setGameMode])

  return (
    <BlackjackGame />
  )
}