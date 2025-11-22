import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { getUploadUrl, constructS3Url } from '@/lib/s3'

// Generate presigned URL for profile image upload
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileType } = await req.json()

    if (!fileType || !fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Check if AWS is properly configured
    if (!process.env.AWS_S3_BUCKET || 
        process.env.AWS_S3_BUCKET === 'your-bucket-name' ||
        !process.env.AWS_ACCESS_KEY_ID ||
        process.env.AWS_ACCESS_KEY_ID === 'your-aws-access-key') {
      return NextResponse.json(
        { error: 'AWS S3 is not configured. Please set up AWS credentials in your .env file.' },
        { status: 503 }
      )
    }

    // Generate upload URL
    const { uploadUrl, fileKey } = await getUploadUrl(
      session.user.id,
      fileType,
      'profile'
    )

    // Update user's profile image URL in database
    const imageUrl = constructS3Url(fileKey)
    await db.user.update({
      where: { id: session.user.id },
      data: {
        profileImage: imageUrl,
        image: imageUrl, // Also update the main image field for NextAuth compatibility
      },
    })

    return NextResponse.json({
      uploadUrl,
      imageUrl,
      fileKey,
    })
  } catch (error: any) {
    console.error('roy: Profile image upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}

