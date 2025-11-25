import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client with validation
// — Royette
const getS3Client = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local')
  }

  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS S3 bucket not configured. Please set AWS_S3_BUCKET in .env.local')
  }

  return new S3Client({
    region: process.env.AWS_S3_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

const s3Client = getS3Client()

export async function getUploadUrl(
  userId: string,
  fileType: string,
  docType: 'id' | 'selfie' | 'profile'
): Promise<{ uploadUrl: string; fileKey: string }> {
  try {
    const folder = docType === 'profile' ? 'profiles' : 'kyc'
    const subfolder = docType === 'profile' ? '' : `/${docType}`
    const fileKey = `${folder}/${userId}${subfolder}/${Date.now()}.${getFileExtension(fileType)}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        userId,
        docType,
        uploadedAt: new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    })

    return { uploadUrl, fileKey }
  } catch (error) {
    console.error('Error generating upload URL:', error)
    throw error
  }
}

export async function getDownloadUrl(fileKey: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
    })

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    })

    return downloadUrl
  } catch (error) {
    console.error('Error generating download URL:', error)
    throw error
  }
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
  }
  return extensions[mimeType] || 'bin'
}

// Get upload URL for post media (images/videos)
// — Royette
export async function getPostMediaUploadUrl(
  userId: string,
  fileType: string,
  mediaType: 'image' | 'video'
): Promise<{ uploadUrl: string; fileKey: string }> {
  try {
    const folder = 'posts'
    const extension = getFileExtension(fileType)
    const fileKey = `${folder}/${userId}/${Date.now()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        userId,
        mediaType,
        uploadedAt: new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    })

    return { uploadUrl, fileKey }
  } catch (error) {
    console.error('roy: Error generating post media upload URL:', error)
    throw error
  }
}

// Get upload URL for video introduction
export async function getVideoIntroUploadUrl(
  userId: string,
  fileType: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  try {
    const folder = 'video-intros'
    const extension = getFileExtension(fileType)
    const fileKey = `${folder}/${userId}/${Date.now()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        userId,
        type: 'video_intro',
        uploadedAt: new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    })

    return { uploadUrl, fileKey }
  } catch (error) {
    console.error('Error generating video intro upload URL:', error)
    throw error
  }
}

export function constructS3Url(fileKey: string): string {
  const bucket = process.env.AWS_S3_BUCKET
  // Default to ap-southeast-1 (Singapore) - your bucket's actual region
  // — Royette
  const region = process.env.AWS_S3_REGION || 'ap-southeast-1'
  return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`
}
