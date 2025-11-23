import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Get chat messages for a booking
// — Royette
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
        { error: 'Unauthorized - only creator or client can view chat' },
        { status: 403 }
      )
    }

    // Verify booking is approved (chat opens after approval)
    if (booking.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Chat is only available for approved bookings' },
        { status: 400 }
      )
    }

    // Verify booking hasn't ended (chat closes after endTime)
    if (new Date() > booking.endTime) {
      return NextResponse.json(
        { error: 'Chat has closed after booking end time' },
        { status: 400 }
      )
    }

    // Get chat messages
    const messages = await db.chat.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('roy: Error fetching chat messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

// Send a chat message in a booking
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.id
    const { message } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be less than 1000 characters' },
        { status: 400 }
      )
    }

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
        { error: 'Unauthorized - only creator or client can send messages' },
        { status: 403 }
      )
    }

    // Verify booking is approved (chat opens after approval)
    if (booking.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Chat is only available for approved bookings' },
        { status: 400 }
      )
    }

    // Verify booking hasn't ended (chat closes after endTime)
    if (new Date() > booking.endTime) {
      return NextResponse.json(
        { error: 'Chat has closed after booking end time' },
        { status: 400 }
      )
    }

    // Determine recipient (the other person in the booking)
    const recipientId = isCreator ? booking.clientId : booking.creatorId

    // Create chat message
    const chatMessage = await db.chat.create({
      data: {
        bookingId,
        senderId: session.user.id,
        recipientId,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // TODO: Send push notification to recipient
    // await sendChatNotification(recipientId, chatMessage)

    return NextResponse.json({ message: chatMessage })
  } catch (error: any) {
    console.error('roy: Error sending chat message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

