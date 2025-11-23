'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { FeedSidebar } from '@/components/feed/FeedSidebar'
import { FeedRightSidebar } from '@/components/feed/FeedRightSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  DollarSign,
  Loader2,
  MessageCircle,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Booking {
  id: string
  creatorId: string
  clientId: string
  startTime: string
  endTime: string
  durationHours: number
  totalPriceInCents: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  meetingLocation: string
  notes: string | null
  createdAt: string
  creator: {
    id: string
    name: string | null
    image: string | null
    profileImage: string | null
  }
}

// Client bookings dashboard page - for subscribers to view their booking requests
// — Royette
export default function ClientBookingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'completed'>('pending')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (session?.user) {
      fetchBookings()
    }
  }, [sessionStatus, session, activeTab, router])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const status = activeTab === 'pending' ? 'PENDING' : activeTab === 'approved' ? 'APPROVED' : 'COMPLETED'
      const response = await fetch(`/api/bookings/list?role=client&status=${status}`)

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error: any) {
      console.error('roy: Error fetching bookings:', error)
      toast.error('Failed to load bookings', {
        description: error.message || 'Please try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) {
      return
    }

    try {
      // TODO: Create cancel endpoint
      // For now, just show a message
      toast.info('Cancel booking', {
        description: 'Booking cancellation feature coming soon.',
      })
    } catch (error: any) {
      console.error('roy: Error canceling booking:', error)
      toast.error('Failed to cancel booking', {
        description: error.message || 'Please try again later.',
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <FeedSidebar />

      {/* Center Content */}
      <main className="flex-1 ml-64 mr-80 bg-white min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your booking requests
          </p>
        </header>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Tab Buttons */}
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'completed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Completed
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'pending' && (
              <div className="space-y-4 mt-6">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No pending bookings</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Your booking requests will appear here once you submit them.
                      </p>
                      <Link href="/browse">
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                          {session?.user?.role === 'CREATOR' ? 'Find Creators to Book' : 'Browse Creators'}
                        </Button>
                      </Link>
                      {session?.user?.role === 'CREATOR' && (
                        <p className="text-sm text-gray-500 mt-4">
                          Looking for bookings you received?{' '}
                          <Link href="/creator/bookings" className="text-blue-600 hover:underline">
                            Go to Creator Dashboard
                          </Link>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {booking.creator.profileImage || booking.creator.image ? (
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                                {(booking.creator.profileImage || booking.creator.image)?.startsWith('/') ? (
                                  <Image
                                    src={booking.creator.profileImage || booking.creator.image || ''}
                                    alt={booking.creator.name || 'Creator'}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <img
                                    src={booking.creator.profileImage || booking.creator.image || ''}
                                    alt={booking.creator.name || 'Creator'}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                {booking.creator.name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">
                                {booking.creator.name || 'Creator'}
                              </CardTitle>
                              <p className="text-sm text-gray-500">Pending Approval</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(booking.id)}
                              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(booking.startTime)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{booking.durationHours} hours</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{booking.meetingLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold">
                              ${(booking.totalPriceInCents / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Notes:</span> {booking.notes}
                            </p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Requested: {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="space-y-4 mt-6">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No approved bookings</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Your approved bookings will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {booking.creator.profileImage || booking.creator.image ? (
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-200">
                                {(booking.creator.profileImage || booking.creator.image)?.startsWith('/') ? (
                                  <Image
                                    src={booking.creator.profileImage || booking.creator.image || ''}
                                    alt={booking.creator.name || 'Creator'}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <img
                                    src={booking.creator.profileImage || booking.creator.image || ''}
                                    alt={booking.creator.name || 'Creator'}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                                {booking.creator.name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">
                                {booking.creator.name || 'Creator'}
                              </CardTitle>
                              <p className="text-sm text-green-600 font-medium">Approved</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/bookings/${booking.id}/chat`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(booking.startTime)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{booking.durationHours} hours</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{booking.meetingLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold">
                              ${(booking.totalPriceInCents / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Notes:</span> {booking.notes}
                            </p>
                          </div>
                        )}
                        {new Date(booking.startTime) > new Date() && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-blue-600 font-medium">
                              ⏰ Upcoming: {Math.ceil((new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-4 mt-6">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No completed bookings</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Your completed bookings will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {booking.creator.profileImage || booking.creator.image ? (
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
                                {(booking.creator.profileImage || booking.creator.image)?.startsWith('/') ? (
                                  <Image
                                    src={booking.creator.profileImage || booking.creator.image || ''}
                                    alt={booking.creator.name || 'Creator'}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <img
                                    src={booking.creator.profileImage || booking.creator.image || ''}
                                    alt={booking.creator.name || 'Creator'}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                                {booking.creator.name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">
                                {booking.creator.name || 'Creator'}
                              </CardTitle>
                              <p className="text-sm text-gray-500">Completed</p>
                            </div>
                          </div>
                          <Link href={`/creator/${booking.creatorId}`}>
                            <Button variant="outline" size="sm">
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(booking.startTime)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold">
                              ${(booking.totalPriceInCents / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Notes:</span> {booking.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <FeedRightSidebar />
    </div>
  )
}

