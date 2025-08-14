'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { BlackjackGame } from '@/components/BlackjackGame'

export default function TutorialBasicPage() {
  const router = useRouter()
  const { setGameMode } = useGameStore()

  useEffect(() => {
    // Set to tutorial game mode when entering tutorial page
    setGameMode('tutorial')
  }, [setGameMode])

  return (
    <BlackjackGame />
  )
}