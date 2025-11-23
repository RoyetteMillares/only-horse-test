'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (session?.user && status === 'authenticated') {
      if (session.user.role === 'ADMIN') {
        router.push('/dashboard/admin')
      } else if (session.user.role === 'CREATOR') {
        router.push('/dashboard/creator/profile')
      } else {
        router.push('/feed')
      }
    }
  }, [session, status, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  )
}
