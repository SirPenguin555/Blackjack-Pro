'use client'

import { AccountScreen } from '@/components/AccountScreen'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const router = useRouter()

  return (
    <AccountScreen onBack={() => router.push('/')} />
  )
}