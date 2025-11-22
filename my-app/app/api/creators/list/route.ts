import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'

    const skip = (page - 1) * limit

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { bio: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Build sort order
    const orderBy =
      sortBy === 'newest'
        ? { createdAt: 'desc' as const }
        : sortBy === 'popular'
          ? { subscriptions: { _count: 'desc' as const } }
          : { name: 'asc' as const }

    // Fetch creators with pagination
    const creators = await db.user.findMany({
      where: {
        isCreator: true,
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        ...searchFilter,
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        hourlyRate: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: true,
            receivedMessages: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    })

    // Get total count for pagination
    const total = await db.user.count({
      where: {
        isCreator: true,
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        ...searchFilter,
      },
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      creators,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error fetching creators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    )
  }
}
