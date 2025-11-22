import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

// Booking request endpoint - Creates booking with Stripe pre-authorization
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      creatorId,
      startTime,
      endTime,
      meetingLocation,
      notes,
    } = body

    // Validate input
    if (!creatorId || !startTime || !endTime || !meetingLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorId, startTime, endTime, meetingLocation' },
        { status: 400 }
      )
    }

    // Get client and creator
    const client = await db.user.findUnique({
      where: { id: session.user.id },
    })

    const creator = await db.user.findUnique({
      where: { id: creatorId },
    })

    if (!client || !creator) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify creator is active and verified
    if (!creator.isCreator || creator.status !== 'ACTIVE' || creator.kycStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Creator is not available for bookings' },
        { status: 400 }
      )
    }

    // Verify client is not the creator
    if (client.id === creator.id) {
      return NextResponse.json(
        { error: 'Cannot book yourself' },
        { status: 400 }
      )
    }

    // Parse dates
    const start = new Date(startTime)
    const end = new Date(endTime)

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Validate end is after start
    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Validate dates are in the future
    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book in the past' },
        { status: 400 }
      )
    }

    // Calculate duration in hours
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    // Validate minimum duration
    const minHours = creator.minHours || 2
    if (durationHours < minHours) {
      return NextResponse.json(
        { error: `Minimum booking duration is ${minHours} hours` },
        { status: 400 }
      )
    }

    // Validate maximum duration (8 hours)
    if (durationHours > 8) {
      return NextResponse.json(
        { error: 'Maximum booking duration is 8 hours' },
        { status: 400 }
      )
    }

    // Calculate total price
    const hourlyRate = creator.hourlyRate || 0
    if (hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Creator has not set an hourly rate' },
        { status: 400 }
      )
    }

    const totalPriceInCents = Math.round(hourlyRate * durationHours * 100) // Convert to cents

    // Check for overlapping bookings
    const overlappingBooking = await db.booking.findFirst({
      where: {
        creatorId: creator.id,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            startTime: {
              lte: end,
              gte: start,
            },
          },
          {
            endTime: {
              lte: end,
              gte: start,
            },
          },
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gte: end } },
            ],
          },
        ],
      },
    })

    if (overlappingBooking) {
      return NextResponse.json(
        { error: 'Creator has a conflicting booking at this time' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer for client
    let customerId = client.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: client.email!,
        name: client.name || undefined,
        metadata: { userId: client.id },
      })
      customerId = customer.id

      await db.user.update({
        where: { id: client.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create Stripe Payment Intent for pre-authorization
    // Using capture_method: 'manual' to authorize but not capture yet
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPriceInCents,
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual', // Pre-authorize only, capture later
      metadata: {
        bookingType: 'date_booking',
        creatorId: creator.id,
        clientId: client.id,
      },
      description: `Booking request for ${creator.name || 'Creator'}`,
    })

    // Create booking record
    const booking = await db.booking.create({
      data: {
        creatorId: creator.id,
        clientId: client.id,
        startTime: start,
        endTime: end,
        durationHours,
        totalPriceInCents,
        status: 'PENDING',
        meetingLocation,
        notes: notes || null,
        stripePaymentIntentId: paymentIntent.id,
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

    // TODO: Send email notification to creator via Resend
    // await sendBookingRequestEmail(creator, client, booking)

    return NextResponse.json({
      booking,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('roy: Error creating booking request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking request' },
      { status: 500 }
    )
  }
}

