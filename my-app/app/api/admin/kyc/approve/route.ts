import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { sendKycApprovedEmail } from '@/lib/emails'

// API endpoint to approve a KYC submission
// Only accessible to ADMIN role
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { submissionId } = await req.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      )
    }

    // Find the KYC submission
    const kycSubmission = await db.kYCSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!kycSubmission) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      )
    }

    if (kycSubmission.status !== 'PENDING') {
      return NextResponse.json(
        { error: `KYC submission is already ${kycSubmission.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Update KYC submission status to VERIFIED
    await db.kYCSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        rejectionReason: null, // Clear any previous rejection reason
      },
    })

    // Update User's kycStatus to VERIFIED
    await db.user.update({
      where: { id: kycSubmission.userId },
      data: {
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        kycRejectionReason: null,
      },
    })

    // Send approval email to user
    if (kycSubmission.user.email) {
      await sendKycApprovedEmail(
        kycSubmission.user.email,
        kycSubmission.user.name || 'User'
      )
    }

    return NextResponse.json({
      message: 'KYC submission approved successfully',
      submissionId,
      userId: kycSubmission.userId,
    })
  } catch (error: any) {
    console.error('roy: Error approving KYC submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve submission' },
      { status: 500 }
    )
  }
}

