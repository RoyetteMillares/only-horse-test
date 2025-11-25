'use server'

import { auth } from '@/app/api/auth/[...nextauth]/route'
import { getUploadUrl, getPostMediaUploadUrl, getVideoIntroUploadUrl } from '@/lib/s3'

export async function getPresignedUrl(
    fileType: string,
    docType: 'id' | 'selfie' | 'profile'
) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    return getUploadUrl(session.user.id, fileType, docType)
}

export async function getPostUploadUrl(
    fileType: string,
    mediaType: 'image' | 'video'
) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    return getPostMediaUploadUrl(session.user.id, fileType, mediaType)
}

export async function getVideoIntroPresignedUrl(fileType: string) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    return getVideoIntroUploadUrl(session.user.id, fileType)
}
