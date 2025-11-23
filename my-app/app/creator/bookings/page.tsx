'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
            // Note: We need to ensure the API supports role=creator
            const response = await fetch(`/api/bookings/list?role=creator&status=${status}`)

            if (!response.ok) {
                throw new Error('Failed to fetch bookings')
            }

            const data = await response.json()
            setBookings(data.bookings || [])
        } catch (error: any) {
            console.error('Error fetching bookings:', error)
            toast.error('Failed to load bookings', {
                description: error.message || 'Please try again later.',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (bookingId: string, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!response.ok) throw new Error('Failed to update booking status')

            toast.success(`Booking ${newStatus.toLowerCase()}`, {
                description: `The booking has been ${newStatus.toLowerCase()}.`,
            })

            fetchBookings()
        } catch (error: any) {
            toast.error('Error', {
                description: error.message,
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
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Manage your incoming booking requests
                </p>
            </header>

            <div className="space-y-6">
                {/* Tab Buttons */}
                <div className="flex space-x-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pending'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'approved'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'completed'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Completed
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                    {bookings.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No {activeTab} bookings</p>
                            </CardContent>
                        </Card>
                    ) : (
                        bookings.map((booking) => (
                            <Card key={booking.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {booking.client.image ? (
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                                                    {booking.client.image.startsWith('/') ? (
                                                        <Image
                                                            src={booking.client.image}
                                                            alt={booking.client.name || 'Client'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={booking.client.image}
                                                            alt={booking.client.name || 'Client'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                                                    {booking.client.name?.charAt(0).toUpperCase() || 'C'}
                                                </div>
                                            )}
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {booking.client.name || 'Client'}
                                                </CardTitle>
                                                <p className="text-sm text-gray-500">
                                                    {activeTab === 'pending' ? 'Requesting a booking' : activeTab === 'approved' ? 'Approved Booking' : 'Completed Booking'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {activeTab === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                                                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {activeTab === 'approved' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/creator/bookings/${booking.id}/chat`)}
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    Chat
                                                </Button>
                                            )}
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
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
