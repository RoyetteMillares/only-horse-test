'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { FeedSidebar } from '@/components/feed/FeedSidebar'
import { FeedRightSidebar } from '@/components/feed/FeedRightSidebar'
import { CheckCircle2, XCircle, Clock, MapPin, Calendar, DollarSign, User, MessageCircle } from 'lucide-react'
import Image from 'next/image'
// Tabs component - simplified version if not available
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  client: {
    id: string
    name: string | null
    image: string | null
  }
}

export default function CreatorBookingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'completed'>('pending')
  const [creators, setCreators] = useState<any[]>([])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [sessionStatus, router])

  useEffect(() => {
    if (session?.user?.role === 'CREATOR') {
      fetchBookings()
      fetchCreators()
    }
  }, [session, activeTab])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const status = activeTab === 'pending' ? 'PENDING' : activeTab === 'approved' ? 'APPROVED' : 'COMPLETED'
      const response = await fetch(`/api/bookings/list?role=creator&status=${status}`)
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('roy: Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/creators/list?limit=5&sortBy=popular')
      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
      }
    } catch (error) {
      console.error('roy: Error fetching creators:', error)
    }
  }

  const handleApprove = async (bookingId: string) => {
    try {
      const response = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      if (response.ok) {
        // Refresh bookings
        fetchBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to approve booking')
      }
    } catch (error: any) {
      console.error('roy: Error approving booking:', error)
      alert('Failed to approve booking')
    }
  }

  const handleReject = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking request?')) {
      return
    }

    try {
      const response = await fetch('/api/bookings/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      if (response.ok) {
        // Refresh bookings
        fetchBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reject booking')
      }
    } catch (error: any) {
      console.error('roy: Error rejecting booking:', error)
      alert('Failed to reject booking')
    }
  }

  const handleComplete = async (bookingId: string) => {
    if (!confirm('Mark this booking as completed? Payment will be captured.')) {
      return
    }

    try {
      const response = await fetch('/api/bookings/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      if (response.ok) {
        // Refresh bookings
        fetchBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to complete booking')
      }
    } catch (error: any) {
      console.error('roy: Error completing booking:', error)
      alert('Failed to complete booking')
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (session?.user?.role !== 'CREATOR') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Only creators can access this page</p>
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
        </header>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Tab Buttons */}
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'completed'
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
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending booking requests</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {booking.client.image || booking.client.id ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden">
                              {booking.client.image ? (
                                <img
                                  src={booking.client.image}
                                  alt={booking.client.name || 'Client'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {booking.client.name?.charAt(0).toUpperCase() || 'C'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null}
                          <div>
                            <CardTitle className="text-lg">{booking.client.name || 'Client'}</CardTitle>
                            <p className="text-sm text-gray-500">Booking Request</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(booking.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatDate(booking.startTime)}</span>
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
                    </CardContent>
                  </Card>
                ))
              )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="space-y-4 mt-6">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No approved bookings</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {booking.client.image || booking.client.id ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden">
                              {booking.client.image ? (
                                <img
                                  src={booking.client.image}
                                  alt={booking.client.name || 'Client'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {booking.client.name?.charAt(0).toUpperCase() || 'C'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null}
                          <div>
                            <CardTitle className="text-lg">{booking.client.name || 'Client'}</CardTitle>
                            <p className="text-sm text-gray-500">Approved Booking</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/bookings/${booking.id}/chat`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          {new Date() >= new Date(booking.endTime) && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(booking.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatDate(booking.startTime)}</span>
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
                    </CardContent>
                  </Card>
                ))
              )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-4 mt-6">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed bookings</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        {booking.client.image || booking.client.id ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            {booking.client.image ? (
                              <img
                                src={booking.client.image}
                                alt={booking.client.name || 'Client'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-semibold">
                                  {booking.client.name?.charAt(0).toUpperCase() || 'C'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : null}
                        <div>
                          <CardTitle className="text-lg">{booking.client.name || 'Client'}</CardTitle>
                          <p className="text-sm text-gray-500">Completed</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatDate(booking.startTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold">
                            ${(booking.totalPriceInCents / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
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
      <FeedRightSidebar creators={creators} />
    </div>
  )
}

