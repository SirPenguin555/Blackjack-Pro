'use client'

import { useRouter } from 'next/navigation'
import BankrollChallenges from '@/components/BankrollChallenges'

export default function ChallengesPage() {
  const router = useRouter()

  return (
    <BankrollChallenges
      onClose={() => router.push('/')}
    />
  )
}