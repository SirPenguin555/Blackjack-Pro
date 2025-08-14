'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TournamentLobby from '@/components/TournamentLobby'
import TournamentGame from '@/components/TournamentGame'
import { Tournament } from '@/lib/tournamentSystem'

export default function TournamentsPage() {
  const router = useRouter()
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)

  if (activeTournament) {
    return (
      <TournamentGame
        tournament={activeTournament}
        onExit={() => {
          setActiveTournament(null)
          router.push('/')
        }}
      />
    )
  }

  return (
    <TournamentLobby
      onBack={() => router.push('/')}
      onJoinTournament={(tournament) => {
        setActiveTournament(tournament)
      }}
    />
  )
}