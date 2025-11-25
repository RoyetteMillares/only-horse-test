'use server'

import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(data: {
    displayName?: string
    hourlyRate?: number
    videoIntroUrl?: string
}) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.displayName,
                hourlyRate: data.hourlyRate,
                videoIntroUrl: data.videoIntroUrl,
            },
        })

        revalidatePath('/creator/settings')
        revalidatePath(`/creator/${session.user.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        throw new Error('Failed to update profile')
    }
}
