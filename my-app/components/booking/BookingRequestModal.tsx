'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Calendar, MapPin, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { VerificationBanner } from '@/components/verification/VerificationBanner'

interface BookingRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creator: {
    id: string
    name: string | null
    hourlyRate: number | null
    minHours: number | null
    location: string | null
    kycStatus: string
  }
  onBookingCreated?: () => void
}

// Booking request modal component for clients to request bookings from creators
// Includes date/time picker, location, notes, and price calculation
// — Royette
export function BookingRequestModal({
  open,
  onOpenChange,
  creator,
  onBookingCreated,
}: BookingRequestModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    meetingLocation: creator.location || '',
    notes: '',
  })

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [durationHours, setDurationHours] = useState<number>(0)

  // Check if user is verified
  const isVerified = session?.user?.kycStatus === 'VERIFIED'
  const kycStatus = session?.user?.kycStatus || 'NOT_STARTED'

  // Calculate price when dates/times change
  useEffect(() => {
    if (
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime ||
      !creator.hourlyRate
    ) {
      setCalculatedPrice(null)
      setDurationHours(0)
      return
    }

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setCalculatedPrice(null)
        setDurationHours(0)
        return
      }

      if (endDateTime <= startDateTime) {
        setCalculatedPrice(null)
        setDurationHours(0)
        return
      }

      const durationMs = endDateTime.getTime() - startDateTime.getTime()
      const hours = durationMs / (1000 * 60 * 60)
      setDurationHours(hours)

      if (hours > 0 && creator.hourlyRate) {
        const price = hours * creator.hourlyRate
        setCalculatedPrice(price)
      } else {
        setCalculatedPrice(null)
      }
    } catch (error) {
      setCalculatedPrice(null)
      setDurationHours(0)
    }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime, creator.hourlyRate])

  // Set minimum date to today
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get default end time (2 hours after start)
  const getDefaultEndTime = (startTime: string) => {
    if (!startTime) return ''
    const [hours, minutes] = startTime.split(':')
    const startHour = parseInt(hours, 10)
    const endHour = (startHour + 2) % 24 // Handle overflow
    return `${endHour.toString().padStart(2, '0')}:${minutes || '00'}`
  }

  const handleStartDateChange = (value: string) => {
    setFormData({
      ...formData,
      startDate: value,
      // Auto-set end date to same as start date
      endDate: value,
      // Auto-set end time to 2 hours after start if start time is set
      endTime: formData.startTime ? getDefaultEndTime(formData.startTime) : formData.endTime,
    })
  }

  const handleStartTimeChange = (value: string) => {
    setFormData({
      ...formData,
      startTime: value,
      // Auto-set end time to 2 hours after start
      endTime: value ? getDefaultEndTime(value) : formData.endTime,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check verification
    if (!isVerified) {
      toast.error('Verification required', {
        description: 'Please complete account verification to request bookings.',
      })
      router.push('/dashboard/verification')
      return
    }

    // Validate form
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      toast.error('Date and time required', {
        description: 'Please select both start and end date/time for the booking.',
      })
      return
    }

    if (!formData.meetingLocation.trim()) {
      toast.error('Location required', {
        description: 'Please provide a meeting location.',
      })
      return
    }

    // Validate duration
    const minHours = creator.minHours || 2
    if (durationHours < minHours) {
      toast.error('Minimum duration not met', {
        description: `Minimum booking duration is ${minHours} hours.`,
      })
      return
    }

    if (durationHours > 8) {
      toast.error('Maximum duration exceeded', {
        description: 'Maximum booking duration is 8 hours.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Format dates for API
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      // Create booking request
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          meetingLocation: formData.meetingLocation.trim(),
          notes: formData.notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create booking request')
      }

      const data = await response.json()

      // If payment method is needed, redirect to payment setup
      if (data.requiresPaymentMethod && data.clientSecret) {
        // TODO: Integrate Stripe Elements for payment method collection
        // For now, show success and redirect to bookings page
        toast.success('Booking request created', {
          description: 'Your booking request has been submitted. Payment will be processed when approved.',
        })
      } else {
        toast.success('Booking request submitted', {
          description: `${creator.name || 'Creator'} will review your request and respond soon.`,
        })
      }

      // Reset form
      setFormData({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        meetingLocation: creator.location || '',
        notes: '',
      })

      // Close modal and refresh
      onOpenChange(false)
      if (onBookingCreated) {
        onBookingCreated()
      }
      router.push('/dashboard/subscriber/bookings')
    } catch (error: any) {
      console.error('roy: Error creating booking request:', error)
      toast.error('Failed to create booking', {
        description: error.message || 'Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Booking with {creator.name}</DialogTitle>
          <DialogDescription>
            Fill in the details below to request a booking. The creator will review and approve your request.
          </DialogDescription>
        </DialogHeader>

        {/* Verification Banner */}
        {!isVerified && (
          <div className="mb-4">
            <VerificationBanner kycStatus={kycStatus} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Start Date</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={getMinDate()}
                required
                disabled={!isVerified || isSubmitting}
                className="w-full"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Start Time</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                disabled={!isVerified || isSubmitting || !formData.startDate}
                className="w-full"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>End Date</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || getMinDate()}
                required
                disabled={!isVerified || isSubmitting || !formData.startDate}
                className="w-full"
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>End Time</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                disabled={!isVerified || isSubmitting || !formData.endDate}
                className="w-full"
              />
            </div>
          </div>

          {/* Duration Display */}
          {durationHours > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Duration: {durationHours.toFixed(1)} hours
                </span>
              </div>
              {creator.minHours && durationHours < creator.minHours && (
                <span className="text-xs text-red-600">
                  Minimum: {creator.minHours} hours
                </span>
              )}
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="meetingLocation" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>Meeting Location</span>
            </Label>
            <Input
              id="meetingLocation"
              type="text"
              placeholder="e.g., Shibuya Crossing, Tokyo"
              value={formData.meetingLocation}
              onChange={(e) => setFormData({ ...formData, meetingLocation: e.target.value })}
              required
              disabled={!isVerified || isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Provide a public meeting location for your booking.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests or information for the creator..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              disabled={!isVerified || isSubmitting}
              className="w-full resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 text-right">
              {formData.notes.length}/1000
            </p>
          </div>

          {/* Price Calculation */}
          {calculatedPrice !== null && calculatedPrice > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Estimated Total</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${calculatedPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${creator.hourlyRate?.toFixed(2)}/hour × {durationHours.toFixed(1)} hours
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Payment will be pre-authorized when you submit this request. It will only be charged when the creator approves and completes the booking.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !isVerified ||
                isSubmitting ||
                !formData.startDate ||
                !formData.startTime ||
                !formData.endDate ||
                !formData.endTime ||
                !formData.meetingLocation.trim() ||
                calculatedPrice === null ||
                durationHours < (creator.minHours || 2)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Request Booking'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

