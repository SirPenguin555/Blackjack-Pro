'use client'

import { useRouter } from 'next/navigation'
import { MultiplayerLobby } from '@/components/MultiplayerLobby'
import { MultiplayerGame } from '@/components/MultiplayerGame'
import { useMultiplayerStore } from '@/store/multiplayerStore'

export default function MultiplayerPage() {
  const router = useRouter()
  const { currentTable, currentGame } = useMultiplayerStore()

  // If we're in an active multiplayer game, show the game
  if (currentTable && currentGame) {
    return (
      <MultiplayerGame
        onBack={() => router.push('/')}
      />
    )
  }

  // Otherwise show the lobby
  return (
    <MultiplayerLobby
      onBack={() => router.push('/')}
    />
  )
}