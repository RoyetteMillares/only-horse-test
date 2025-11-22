import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

// Complete booking - Captures payment, ready for reviews
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

    // Get booking with creator and client
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

    // Verify user is either creator or client
    const isCreator = booking.creatorId === session.user.id
    const isClient = booking.clientId === session.user.id

    if (!isCreator && !isClient) {
      return NextResponse.json(
        { error: 'Unauthorized - only creator or client can complete booking' },
        { status: 403 }
      )
    }

    // Verify booking is approved
    if (booking.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Booking must be APPROVED to complete. Current status: ${booking.status}` },
        { status: 400 }
      )
    }

    // Verify booking end time has passed
    if (new Date() < booking.endTime) {
      return NextResponse.json(
        { error: 'Cannot complete booking before end time' },
        { status: 400 }
      )
    }

    // Capture payment if not already captured
    let paymentCapturedAt = booking.paymentCapturedAt

    if (!paymentCapturedAt && booking.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          booking.stripePaymentIntentId
        )

        // Only capture if not already captured
        if (paymentIntent.status === 'requires_capture') {
          await stripe.paymentIntents.capture(booking.stripePaymentIntentId)

          paymentCapturedAt = new Date()
        } else if (paymentIntent.status === 'succeeded') {
          paymentCapturedAt = new Date(paymentIntent.created * 1000)
        }
      } catch (stripeError: any) {
        console.error('roy: Error capturing payment:', stripeError)
        return NextResponse.json(
          { error: 'Failed to capture payment' },
          { status: 500 }
        )
      }
    }

    // Calculate platform fee (15%) and creator payout (85%)
    const platformFeePercent = 0.15
    const platformFeeInCents = Math.round(booking.totalPriceInCents * platformFeePercent)
    const creatorPayoutInCents = booking.totalPriceInCents - platformFeeInCents

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        paymentCapturedAt: paymentCapturedAt || new Date(),
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

    // Record creator earning (85% of booking price)
    // TODO: Transfer to Stripe Connect account for creator
    await db.earning.create({
      data: {
        creatorId: booking.creatorId,
        amount: creatorPayoutInCents / 100, // Convert cents to dollars
        source: 'BOOKING', // Add BOOKING to EarningSource enum
        stripeChargeId: booking.stripePaymentIntentId || null,
      },
    })

    // TODO: Send payout to creator via Stripe Connect
    // if (booking.creator.stripeConnectId) {
    //   await stripe.transfers.create({
    //     amount: creatorPayoutInCents,
    //     currency: 'usd',
    //     destination: booking.creator.stripeConnectId,
    //     metadata: { bookingId: booking.id },
    //   })
    // }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error: any) {
    console.error('roy: Error completing booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete booking' },
      { status: 500 }
    )
  }
}

