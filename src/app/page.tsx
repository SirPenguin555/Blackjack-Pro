'use client'

import { useEffect } from 'react'
import { TitleScreen } from '@/components/TitleScreen'
import { useGameStore } from '@/store/gameStore'

export default function Home() {
  const { setGameMode } = useGameStore()

  useEffect(() => {
    // Reset to menu mode when arriving at home page
    setGameMode('menu')
  }, [setGameMode])

  return <TitleScreen />
}
