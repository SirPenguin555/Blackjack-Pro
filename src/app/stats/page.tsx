'use client'

import { useRouter } from 'next/navigation'
import { StatsScreen } from '@/components/StatsScreen'
import { useGameStore } from '@/store/gameStore'

export default function StatsPage() {
  const router = useRouter()
  const { stats, resetStats } = useGameStore()

  return (
    <StatsScreen
      stats={stats}
      onBack={() => router.push('/')}
      onReset={() => {
        resetStats()
        router.push('/')
      }}
    />
  )
}