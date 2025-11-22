import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { getUploadUrl } from '@/lib/s3'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileType, docType } = await req.json()

    if (!fileType || !docType) {
      return NextResponse.json(
        { error: 'Missing fileType or docType' },
        { status: 400 }
      )
    }

    if (!['id', 'selfie'].includes(docType)) {
      return NextResponse.json(
        { error: 'Invalid docType. Must be "id" or "selfie"' },
        { status: 400 }
      )
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedMimes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, or PDF allowed.' },
        { status: 400 }
      )
    }

    const { uploadUrl, fileKey } = await getUploadUrl(
      session.user.id,
      fileType,
      docType as 'id' | 'selfie'
    )

    return NextResponse.json({
      uploadUrl,
      fileKey,
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('Upload URL error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
