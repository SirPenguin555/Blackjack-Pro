'use client'

import { useRouter } from 'next/navigation'
import { HelpScreen } from '@/components/HelpScreen'

export default function HelpPage() {
  const router = useRouter()

  return (
    <HelpScreen
      onBack={() => router.push('/')}
    />
  )
}