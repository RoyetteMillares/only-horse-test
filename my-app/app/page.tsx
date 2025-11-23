'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Star, Users, Shield, TrendingUp, ArrowRight, Heart, MessageCircle, MapPin } from 'lucide-react'
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
        const response = await fetch('/api/creators/list?limit=4&featured=true')
        const data = await response.json()
        setFeaturedCreators(data.creators || [])
      } catch (error) {
        console.error('Error fetching featured creators:', error)
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

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Subscriber",
      text: "I found the perfect companion for my city tour. The booking process was seamless and safe!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    {
      name: "James K.",
      role: "Subscriber",
      text: "The exclusive content is amazing, but meeting my favorite creator in person was a dream come true.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      name: "Emily R.",
      role: "Creator",
      text: "Finally, a platform that respects creators and lets us monetize our time safely. I love it here!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    }
  ]

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            <span className="text-purple-600">Muse</span>
          </div>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:text-purple-600 font-medium">Log In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100 via-white to-white"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-8 animate-fade-in-up">
            <Heart className="w-4 h-4 fill-purple-700" />
            <span>The #1 Platform for Genuine Connections</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
            Find Your Perfect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Companion & Creator
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Unlock exclusive content, chat privately, and book unforgettable in-person experiences with verified creators.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                Start Exploring Now
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-2 border-gray-200 text-gray-700 hover:border-purple-200 hover:bg-purple-50 text-lg font-semibold">
                Become a Creator
              </Button>
            </Link>
          </div>

          {/* Floating Avatars (Decorative) */}
          <div className="mt-16 flex justify-center -space-x-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-sm">
                <Image
                  src={`https://i.pravatar.cc/150?img=${i + 10}`}
                  alt="User"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-gray-100 text-xs font-bold text-gray-600 shadow-sm">
              10k+
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Join thousands of happy members</p>
        </div>
      </div>

      {/* Featured Creators Preview */}
      {!loading && featuredCreators.length > 0 && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Trending Creators</h2>
                <p className="text-gray-500 mt-2">Discover who everyone is talking about</p>
              </div>
              <Link href="/auth/register" className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCreators.map((creator) => (
                <div key={creator.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                  {creator.image ? (
                    <Image
                      src={creator.image}
                      alt={creator.name || 'Creator'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-4xl font-bold text-gray-400">{creator.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold">{creator.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>New York, NY</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                        ${creator.hourlyRate}/hr
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-sm font-bold">4.9</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">More Than Just Content</h2>
            <p className="text-lg text-gray-600">We bridge the gap between digital fandom and real-world connection.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Exclusive Content</h3>
              <p className="text-gray-600">Subscribe to your favorite creators for access to private photos, videos, and daily updates.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Direct Chat</h3>
              <p className="text-gray-600">Slide into the DMs. Have genuine conversations and build a real connection.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 text-pink-600">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Book a Date</h3>
              <p className="text-gray-600">Take it offline. Rent a companion for dinner, events, or travel in a safe environment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">Trusted by Thousands</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-2xl relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                    <p className="text-sm text-purple-600 font-medium">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-700 italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gray-900 py-24 text-center px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to find your match?</h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">Join the fastest growing platform for creators and fans today.</p>
        <Link href="/auth/register">
          <Button size="lg" className="h-16 px-10 rounded-full bg-white text-gray-900 hover:bg-gray-100 text-lg font-bold">
            Create Free Account
          </Button>
        </Link>
        <p className="mt-6 text-gray-500 text-sm">No credit card required to sign up.</p>
      </div>

      {/* Simple Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Muse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
