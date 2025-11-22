import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Feed API endpoint
// TODO: Implement when Post model is added to schema
// — Royette
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Fetch actual posts from database when Post model exists
    // For now, return empty array
    // Example structure:
    // const posts = await db.post.findMany({
    //   where: {
    //     OR: [
    //       { isSubscriberOnly: false },
    //       {
    //         isSubscriberOnly: true,
    //         creator: {
    //           subscriptions: {
    //             some: {
    //               subscriberId: session.user.id,
    //               status: 'ACTIVE',
    //             },
    //           },
    //         },
    //       },
    //     ],
    //   },
    //   include: {
    //     creator: {
    //       select: {
    //         id: true,
    //         name: true,
    //         image: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    //   take: 20,
    // })

    return NextResponse.json({
      posts: [],
      message: 'Feed endpoint ready. Post model needs to be added to schema.',
    })
  } catch (error: any) {
    console.error('roy: Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

