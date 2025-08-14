'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { BlackjackGame } from '@/components/BlackjackGame'

export default function TutorialEuropeanPage() {
  const router = useRouter()
  const { setGameMode, startVariantTutorial } = useGameStore()

  useEffect(() => {
    // Set to tutorial game mode and start European variant tutorial
    startVariantTutorial('european')
    setGameMode('tutorial')
  }, [setGameMode, startVariantTutorial])

  return (
    <BlackjackGame />
  )
}