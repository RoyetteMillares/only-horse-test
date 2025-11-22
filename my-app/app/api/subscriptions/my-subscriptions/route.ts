import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Get user's active subscriptions
// — Royette
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await db.subscription.findMany({
      where: {
        subscriberId: session.user.id,
        status: 'ACTIVE',
      },
      select: {
        creatorId: true,
        status: true,
        price: true,
        tier: true,
      },
    })

    return NextResponse.json({
      subscriptions,
    })
  } catch (error: any) {
    console.error('roy: Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

