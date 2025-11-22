import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    const creator = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        hourlyRate: true,
        createdAt: true,
        status: true,
        kycStatus: true,
        _count: {
          select: {
            subscriptions: true,
            receivedMessages: true,
          },
        },
      },
    })

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.status !== 'ACTIVE' || creator.kycStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Creator not available' },
        { status: 403 }
      )
    }

    // Record profile view
    if (session?.user?.id && session.user.id !== creator.id) {
      await db.profileView.upsert({
        where: {
          viewedBy_viewedUser: {
            viewedBy: session.user.id,
            viewedUser: creator.id,
          },
        },
        create: {
          viewedBy: session.user.id,
          viewedUser: creator.id,
        },
        update: {
          createdAt: new Date(),
        },
      })
    }

    return NextResponse.json(creator)
  } catch (error: any) {
    console.error('Error fetching creator:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator' },
      { status: 500 }
    )
  }
}
