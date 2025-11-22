import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { getPostMediaUploadUrl, constructS3Url } from "@/lib/s3"

// API endpoint for generating presigned URLs for post media uploads
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== 'CREATOR' && !session.user.isCreator) {
      return NextResponse.json({ error: "Only creators can upload post media" }, { status: 403 })
    }

    const body = await req.json()
    const { fileType, mediaType } = body

    if (!fileType || !mediaType) {
      return NextResponse.json(
        { error: "fileType and mediaType are required" },
        { status: 400 }
      )
    }

    if (mediaType !== 'image' && mediaType !== 'video') {
      return NextResponse.json(
        { error: "mediaType must be 'image' or 'video'" },
        { status: 400 }
      )
    }

    // Validate file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime']

    if (mediaType === 'image' && !imageTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid image type. Allowed: jpeg, png, webp, gif" },
        { status: 400 }
      )
    }

    if (mediaType === 'video' && !videoTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid video type. Allowed: mp4, webm, mov" },
        { status: 400 }
      )
    }

    const { uploadUrl, fileKey } = await getPostMediaUploadUrl(
      session.user.id,
      fileType,
      mediaType
    )

    const publicUrl = constructS3Url(fileKey)

    return NextResponse.json({
      uploadUrl,
      fileKey,
      publicUrl,
    })
  } catch (error: any) {
    console.error('roy: Error generating upload URL:', error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}

