import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

// API endpoint for creating posts by creators
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== 'CREATOR' && !session.user.isCreator) {
      return NextResponse.json({ error: "Only creators can create posts" }, { status: 403 })
    }

    // Check verification status - all users (creators and fans) must be verified to post
    // — Royette
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true },
    })

    if (!user || user.kycStatus !== 'VERIFIED') {
      return NextResponse.json(
        { 
          error: "Account verification required. Please complete verification to create posts.",
          requiresVerification: true 
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { content, imageUrl, videoUrl, isSubscriberOnly } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Post content must be less than 5000 characters" },
        { status: 400 }
      )
    }

    if (!imageUrl && !videoUrl) {
      return NextResponse.json(
        { error: "Post must have either an image or video" },
        { status: 400 }
      )
    }

    if (imageUrl && videoUrl) {
      return NextResponse.json(
        { error: "Post cannot have both image and video" },
        { status: 400 }
      )
    }

    // Create post
    const post = await db.post.create({
      data: {
        creatorId: session.user.id,
        content: content.trim(),
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        isSubscriberOnly: isSubscriberOnly === true,
        likes: 0,
        comments: 0,
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
      },
    })

    return NextResponse.json({
      post: {
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
      },
    })
  } catch (error: any) {
    console.error('roy: Error creating post:', error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}

