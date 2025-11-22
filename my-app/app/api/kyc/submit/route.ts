import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { sendKycSubmittedEmail } from '@/lib/emails'
import { constructS3Url } from '@/lib/s3'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      idType,
      governmentIdNumber,
      governmentIdKey,
      livelinessKey,
    } = await req.json()

    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !idType ||
      !governmentIdNumber ||
      !governmentIdKey ||
      !livelinessKey
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingKyc = await db.kYCSubmission.findUnique({
      where: { userId: session.user.id },
    })

    // If KYC already exists and is not REJECTED, don't allow resubmission
    if (existingKyc && existingKyc.status !== 'REJECTED') {
      const statusMessage = 
        existingKyc.status === 'PENDING'
          ? 'KYC already submitted and is pending review. Please wait for verification.'
          : existingKyc.status === 'VERIFIED'
          ? 'Your account is already verified.'
          : 'KYC already submitted. Please wait for verification.'
      
      return NextResponse.json(
        { error: statusMessage },
        { status: 400 }
      )
    }

    // If existing KYC is REJECTED, update it instead of creating new
    // Otherwise create new submission
    let kyc
    if (existingKyc && existingKyc.status === 'REJECTED') {
      kyc = await db.kYCSubmission.update({
        where: { userId: session.user.id },
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          governmentIdType: idType,
          governmentIdNumber: governmentIdNumber.trim(),
          governmentIdImageUrl: constructS3Url(governmentIdKey),
          livelinessImageUrl: constructS3Url(livelinessKey),
          status: 'PENDING',
          rejectionReason: null, // Clear rejection reason on resubmission
          verifiedAt: null,
        },
      })
    } else {
      kyc = await db.kYCSubmission.create({
        data: {
          userId: session.user.id,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          governmentIdType: idType,
          governmentIdNumber: governmentIdNumber.trim(),
          governmentIdImageUrl: constructS3Url(governmentIdKey),
          livelinessImageUrl: constructS3Url(livelinessKey),
          status: 'PENDING',
        },
      })
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { kycStatus: 'PENDING' },
    })

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.email) {
      await sendKycSubmittedEmail(user.email, user.name || 'User')
    }

    return NextResponse.json({
      message: 'KYC submitted successfully',
      kycId: kyc.id,
      status: 'PENDING',
    })
  } catch (error: any) {
    console.error('KYC submit error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
