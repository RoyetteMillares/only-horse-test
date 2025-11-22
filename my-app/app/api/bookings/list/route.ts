import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Get bookings list for creator or client
// — Royette
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // 'creator' or 'client'
    const status = searchParams.get('status') // Optional filter

    let whereClause: any = {}

    if (role === 'creator') {
      whereClause.creatorId = session.user.id
    } else if (role === 'client') {
      whereClause.clientId = session.user.id
    } else {
      // Default: show bookings where user is either creator or client
      whereClause.OR = [
        { creatorId: session.user.id },
        { clientId: session.user.id },
      ]
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const bookings = await db.booking.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
            image: true,
          },
        },
      },
      take: 50,
    })

    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('roy: Error fetching bookings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

