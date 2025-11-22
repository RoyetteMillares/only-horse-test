'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Star, MessageCircle, Heart, Share2, Calendar } from 'lucide-react'
import { BookingRequestModal } from '@/components/booking/BookingRequestModal'
import { VerificationBanner } from '@/components/verification/VerificationBanner'

interface Creator {
  id: string
  name: string
  image?: string
  bio?: string
  hourlyRate: number | null
  minHours: number | null
  location: string | null
  status: string
  kycStatus: string
  _count: {
    subscriptions: number
    receivedMessages: number
  }
  createdAt: string
}

export default function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Unwrap params Promise using React.use() (Next.js 16 requirement)
  const { id: creatorId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedTier, setSelectedTier] = useState('BASIC')
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (!creatorId) {
      return
    }

    const fetchCreator = async () => {
      try {
        const response = await fetch(`/api/creators/${creatorId}`)
        if (!response.ok) throw new Error('Creator not found')
        const data = await response.json()
        setCreator(data)
      } catch (error) {
        console.error('Error fetching creator:', error)
        router.push('/dashboard/subscriber/browse')
      } finally {
        setLoading(false)
      }
    }

    fetchCreator()
  }, [creatorId, status, router])

  const handleSubscribe = async () => {
    if (!creator) return

    setIsSubscribing(true)
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          tier: selectedTier,
        }),
      })

      if (!response.ok) throw new Error('Failed to create subscription')

      const subscription = await response.json()

      // Redirect to success or close dialog
      setShowSubscribeDialog(false)
      router.push('/dashboard/subscriber/messages')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Creator not found</p>
      </div>
    )
  }

  const PRICING = {
    BASIC: { price: 4.99, features: ['Access to profile', 'Basic messaging'] },
    PREMIUM: {
      price: 9.99,
      features: ['Access to profile', 'Priority messaging', 'Exclusive content'],
    },
    VIP: {
      price: 24.99,
      features: [
        'Access to profile',
        'Priority messaging',
        'Exclusive content',
        'Video calls',
        '24/7 support',
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Image */}
            <div className="flex-shrink-0">
              <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                {creator.image ? (
                  <Image
                    src={creator.image}
                    alt={creator.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {creator.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{creator.name}</h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.9</span>
                  <span className="text-gray-600">
                    ({creator._count.subscriptions} reviews)
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-6 max-w-2xl">
                {creator.bio || 'No bio added yet'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-2xl font-bold">
                    {creator._count.subscriptions}
                  </p>
                  <p className="text-gray-600">Subscribers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {creator._count.receivedMessages}
                  </p>
                  <p className="text-gray-600">Messages Received</p>
                </div>
              </div>

              {/* Hourly Rate Display */}
              {creator.hourlyRate && creator.hourlyRate > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-lg">
                    <span className="text-gray-600">Hourly Rate:</span>
                    <span className="font-bold text-blue-600">
                      ${creator.hourlyRate.toFixed(2)}/hour
                    </span>
                    {creator.minHours && (
                      <span className="text-gray-500 text-sm">
                        (Min: {creator.minHours} hours)
                      </span>
                    )}
                  </div>
                  {creator.location && (
                    <p className="text-sm text-gray-600 mt-1">
                      📍 Location: {creator.location}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {creator.hourlyRate && creator.hourlyRate > 0 && (
                  <Button
                    size="lg"
                    onClick={() => setShowBookingDialog(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Request Booking
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={() => setShowSubscribeDialog(true)}
                >
                  Subscribe Now
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="w-5 h-5 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Request Dialog */}
      {creator && creator.hourlyRate && creator.hourlyRate > 0 && (
        <BookingRequestModal
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          creator={{
            id: creator.id,
            name: creator.name,
            hourlyRate: creator.hourlyRate,
            minHours: creator.minHours || 2,
            location: creator.location,
            kycStatus: creator.kycStatus,
          }}
          onBookingCreated={() => {
            setShowBookingDialog(false)
          }}
        />
      )}

      {/* Subscription Dialog */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to {creator.name}</DialogTitle>
            <DialogDescription>
              Choose a subscription tier to get started
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(PRICING).map(([tier, details]) => (
                <label
                  key={tier}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedTier === tier
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier}
                    checked={selectedTier === tier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-bold">{tier}</span>
                  <span className="float-right font-bold text-blue-600">
                    ${details.price}/month
                  </span>
                  <div className="mt-2 text-sm text-gray-600">
                    {details.features.map((feature) => (
                      <p key={feature}>✓ {feature}</p>
                    ))}
                  </div>
                </label>
              ))}
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="w-full"
              size="lg"
            >
              {isSubscribing ? 'Processing...' : 'Subscribe & Pay'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
