'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Star, Users, Shield, TrendingUp, ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface Creator {
  id: string
  name: string | null
  image: string | null
  bio: string | null
  hourlyRate: number
  _count: {
    subscriptions: number
    receivedMessages: number
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      if (session.user.needsSetup) {
        router.push('/auth/setup-profile')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, router])

  useEffect(() => {
    const fetchFeaturedCreators = async () => {
      try {
        const response = await fetch('/api/creators/list?limit=8&sortBy=popular')
        const data = await response.json()
        setFeaturedCreators(data.creators || [])
      } catch (error) {
        console.error('roy: Error fetching featured creators:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!session?.user) {
      fetchFeaturedCreators()
    }
  }, [session])

  // If user is logged in, show loading while redirecting
  if (status === 'loading' || session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Connect.{' '}
              <span className="text-purple-600">
                Experience.
              </span>{' '}
              Support.
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              The premier platform for exclusive creator content and safe, curated companionship experiences.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white border-0 px-10 py-7 text-lg font-semibold shadow-lg"
                >
                  Start Exploring
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-10 py-7 text-lg font-semibold"
                >
                  Creator Login
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {featuredCreators.length > 0 ? '100+' : '0'}
                </div>
                <div className="text-gray-600 text-sm">Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">10K+</div>
                <div className="text-gray-600 text-sm">Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600 text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Creators Section */}
      {!loading && featuredCreators.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Creators
              </h2>
              <p className="text-gray-600">Discover exclusive content from verified creators</p>
            </div>
            <Link href="/auth/register">
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-purple-600 hover:bg-gray-50"
              >
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredCreators.map((creator) => (
              <Link
                key={creator.id}
                href={`/dashboard/subscriber/creator/${creator.id}`}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-200 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl">
                  {creator.image ? (
                    creator.image.startsWith('/') ? (
                      <Image
                        src={creator.image}
                        alt={creator.name || 'Creator'}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src={creator.image}
                        alt={creator.name || 'Creator'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-4xl font-bold text-gray-400">
                        {creator.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg mb-1 truncate">
                        {creator.name || 'Creator'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-200">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{creator._count.subscriptions}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>4.9</span>
                        </div>
                      </div>
                      <div className="mt-2 text-white font-semibold">
                        ${creator.hourlyRate || 0}/month
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Experience the best platform for exclusive content and safe companionship
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Exclusive Content */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-500 transition-colors shadow-sm">
            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Exclusive Content</h3>
            <p className="text-gray-600 leading-relaxed">
              Unlock photos and videos from your favorite creators. Get access to premium content you can't find anywhere else.
            </p>
          </div>

          {/* Book a Date */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-500 transition-colors shadow-sm">
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Book a Date</h3>
            <p className="text-gray-600 leading-relaxed">
              Rent a companion for lunch, shopping, or city tours. Create meaningful connections in a safe environment.
            </p>
          </div>

          {/* Verified & Safe */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-500 transition-colors shadow-sm">
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Verified & Safe</h3>
            <p className="text-gray-600 leading-relaxed">
              Strict KYC and safety protocols for peace of mind. All creators are verified and background checked.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center bg-white">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of fans and creators already on the platform
        </p>
        <Link href="/auth/register">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white border-0 px-12 py-7 text-lg font-semibold shadow-lg"
          >
            Create Free Account
          </Button>
        </Link>
      </div>
    </div>
  )
}
