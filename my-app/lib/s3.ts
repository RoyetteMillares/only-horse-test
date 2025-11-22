import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
  } from '@aws-sdk/client-s3'
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
  
  const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  
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
      'application/pdf': 'pdf',
    }
    return extensions[mimeType] || 'bin'
  }
  
  export function constructS3Url(fileKey: string): string {
    const bucket = process.env.AWS_S3_BUCKET
    const region = process.env.AWS_S3_REGION || 'us-east-1'
    return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`
  }
  