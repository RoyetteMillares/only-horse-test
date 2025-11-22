import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Approve booking request - Opens chat channel
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      )
    }

    // Get booking with creator
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        creator: true,
        client: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user is the creator
    if (booking.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only creator can approve bookings' },
        { status: 403 }
      )
    }

    // Verify booking is pending
    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Booking is already ${booking.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'APPROVED',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            profileImage: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // TODO: Send email notification to client via Resend
    // await sendBookingApprovedEmail(booking.client, booking.creator, booking)

    return NextResponse.json({ booking: updatedBooking })
  } catch (error: any) {
    console.error('roy: Error approving booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve booking' },
      { status: 500 }
    )
  }
}

