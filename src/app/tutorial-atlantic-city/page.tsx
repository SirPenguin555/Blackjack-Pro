'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { BlackjackGame } from '@/components/BlackjackGame'

export default function TutorialAtlanticCityPage() {
  const router = useRouter()
  const { setGameMode, startVariantTutorial } = useGameStore()

  useEffect(() => {
    // Set to tutorial game mode and start Atlantic City variant tutorial
    startVariantTutorial('atlantic_city')
    setGameMode('tutorial')
  }, [setGameMode, startVariantTutorial])

  return (
    <BlackjackGame />
  )
}