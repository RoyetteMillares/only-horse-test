'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Camera, Calendar, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      if (session.user.needsSetup) {
        router.push('/auth/setup-profile')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, router])

  // If user is logged in, show loading while redirecting
  if (status === 'loading' || session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Connect.{' '}
          <span className="text-purple-600">Experience.</span>{' '}
          Support.
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          The premier platform for exclusive creator content and safe, curated companionship experiences.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/auth/register">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 px-8 py-6 text-lg"
            >
              Enter as Fan
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg"
            >
              Creator Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Exclusive Content Card */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Exclusive Content
              </h3>
              <p className="text-gray-600">
                Unlock photos and videos from your favorite creators.
              </p>
            </CardContent>
          </Card>

          {/* Book a Date Card */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Book a Date
              </h3>
              <p className="text-gray-600">
                Rent a companion for lunch, shopping, or city tours.
              </p>
            </CardContent>
          </Card>

          {/* Verified & Safe Card */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verified & Safe
              </h3>
              <p className="text-gray-600">
                Strict KYC and safety protocols for peace of mind.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
