'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { BlackjackGame } from '@/components/BlackjackGame'

export default function TutorialVegasPage() {
  const router = useRouter()
  const { setGameMode, startVariantTutorial } = useGameStore()

  useEffect(() => {
    // Set to tutorial game mode and start Vegas variant tutorial
    startVariantTutorial('vegas')
    setGameMode('tutorial')
  }, [setGameMode, startVariantTutorial])

  return (
    <BlackjackGame />
  )
}