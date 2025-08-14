'use client'

import { useRouter } from 'next/navigation'
import { SaveLoadScreen } from '@/components/SaveLoadScreen'

export default function SaveLoadPage() {
  const router = useRouter()

  return (
    <SaveLoadScreen
      onBack={() => router.push('/')}
      onProfileLoaded={() => {
        // Reload the page to refresh all game state with loaded profile
        window.location.href = '/'
      }}
    />
  )
}