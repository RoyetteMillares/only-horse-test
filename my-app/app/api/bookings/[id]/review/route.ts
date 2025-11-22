import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Submit review for a completed booking
// — Royette
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.id
    const { rating, comment, reviewedUserId } = await req.json()

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!reviewedUserId) {
      return NextResponse.json(
        { error: 'Missing reviewedUserId' },
        { status: 400 }
      )
    }

    // Get booking
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
        { error: 'Unauthorized - only creator or client can submit reviews' },
        { status: 403 }
      )
    }

    // Verify booking is completed
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Reviews can only be submitted for completed bookings' },
        { status: 400 }
      )
    }

    // Verify reviewedUserId is the other party
    const otherPartyId = isCreator ? booking.clientId : booking.creatorId
    if (reviewedUserId !== otherPartyId) {
      return NextResponse.json(
        { error: 'Can only review the other party in the booking' },
        { status: 400 }
      )
    }

    // Check if review already exists for this booking and user
    const existingReview = await db.review.findFirst({
      where: {
        bookingId,
        reviewedBy: session.user.id,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking' },
        { status: 400 }
      )
    }

    // Create review
    const review = await db.review.create({
      data: {
        bookingId,
        creatorId: booking.creatorId,
        clientId: booking.clientId,
        rating,
        comment: comment || null,
        reviewedBy: session.user.id,
        reviewedUser: reviewedUserId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
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

    // Update creator's average rating if reviewed user is creator
    if (reviewedUserId === booking.creatorId) {
      const creatorReviews = await db.review.findMany({
        where: {
          creatorId: booking.creatorId,
          reviewedUser: booking.creatorId,
        },
      })

      const averageRating =
        creatorReviews.reduce((sum, r) => sum + r.rating, 0) / creatorReviews.length

      await db.user.update({
        where: { id: booking.creatorId },
        data: { averageRating },
      })
    }

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('roy: Error submitting review:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    )
  }
}

// Get reviews for a booking
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.id

    // Get booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
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
        { error: 'Unauthorized - only creator or client can view reviews' },
        { status: 403 }
      )
    }

    // Get reviews
    const reviews = await db.review.findMany({
      where: { bookingId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error: any) {
    console.error('roy: Error fetching reviews:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

