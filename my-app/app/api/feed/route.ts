import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// Feed API endpoint - fetches posts based on user role and subscriptions
// Creators can see all posts (including their own subscriber-only posts)
// Subscribers can see public posts + subscriber-only posts from creators they subscribe to
// — Royette
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isCreator = session.user.role === 'CREATOR'

    // If user is a creator, show all posts (including their own subscriber-only posts)
    // Otherwise, show public posts + subscriber-only posts from subscribed creators
    let posts
    if (isCreator) {
      // Creators can see all posts
      posts = await db.post.findMany({
        where: {},
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })
    } else {
      // Subscribers: Show ALL posts (including subscriber-only ones)
      // The UI will handle showing lock overlay for posts they're not subscribed to
      // This allows users to see all posts and decide which creators to subscribe to
      // — Royette
      posts = await db.post.findMany({
        where: {},
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })
    }

    const formattedPosts = posts.map(post => ({
      id: post.id,
      creatorId: post.creatorId,
      creatorName: post.creator.name,
      creatorImage: post.creator.profileImage || post.creator.image,
      content: post.content,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      isSubscriberOnly: post.isSubscriberOnly,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt.toISOString(),
    }))

    return NextResponse.json({
      posts: formattedPosts,
    })
  } catch (error: any) {
    console.error('roy: Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

