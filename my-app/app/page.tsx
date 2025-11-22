'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SignOutButton } from '@/components/auth/SignOutButton'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      if (session.user.needsSetup) {
        router.push('/auth/setup-profile')
      }
    }
  }, [session, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white">
          Connect with Companions
        </h1>
        <p className="text-xl text-blue-100">
          Real connections, real earnings
        </p>

        {status === 'loading' ? (
          <p className="text-white">Loading...</p>
        ) : session?.user ? (
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard')} size="lg" className="w-full">
              Go to Dashboard
            </Button>
            <SignOutButton variant="outline" size="lg" className="w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
