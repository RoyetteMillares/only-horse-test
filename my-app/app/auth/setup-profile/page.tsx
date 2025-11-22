'use client'

import { useSession } from 'next-auth/react'
import { SetupProfileForm } from '@/components/auth/SetupProfileForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SetupProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <SetupProfileForm />
    </div>
  )
}
