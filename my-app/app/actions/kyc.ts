'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { sendKycApprovedEmail, sendKycRejectedEmail } from '@/lib/emails'

export async function approveKYC(kycId: string) {
    try {
        const kyc = await db.kYCSubmission.findUnique({
            where: { id: kycId },
            include: { user: true },
        })

        if (!kyc) throw new Error('KYC Submission not found')

        // 1. Update KYC Status
        await db.kYCSubmission.update({
            where: { id: kycId },
            data: {
                status: 'VERIFIED',
                verifiedAt: new Date(),
                rejectionReason: null,
            },
        })

        // 2. Update User Status
        await db.user.update({
            where: { id: kyc.userId },
            data: {
                kycStatus: 'VERIFIED',
                kycVerifiedAt: new Date(),
                isCreator: true, // Enable creator features
            },
        })

        // 3. Send Email
        if (kyc.user.email) {
            await sendKycApprovedEmail(kyc.user.email, kyc.user.name || 'Creator')
        }

        revalidatePath('/admin/kyc')
        revalidatePath(`/admin/kyc/${kycId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Approve KYC Error:', error)
        return { error: error.message }
    }
}

export async function rejectKYC(kycId: string, reason: string) {
    try {
        const kyc = await db.kYCSubmission.findUnique({
            where: { id: kycId },
            include: { user: true },
        })

        if (!kyc) throw new Error('KYC Submission not found')

        // 1. Update KYC Status
        await db.kYCSubmission.update({
            where: { id: kycId },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
                verifiedAt: null,
            },
        })

        // 2. Update User Status
        await db.user.update({
            where: { id: kyc.userId },
            data: {
                kycStatus: 'REJECTED',
                kycRejectionReason: reason,
            },
        })

        // 3. Send Email
        if (kyc.user.email) {
            await sendKycRejectedEmail(kyc.user.email, kyc.user.name || 'Creator', reason)
        }

        revalidatePath('/admin/kyc')
        revalidatePath(`/admin/kyc/${kycId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Reject KYC Error:', error)
        return { error: error.message }
    }
}
