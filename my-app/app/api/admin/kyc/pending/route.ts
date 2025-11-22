import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

// API endpoint to list pending KYC submissions for admin review
// Only accessible to ADMIN role
// — Royette
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch all pending KYC submissions with user info
    const pendingSubmissions = await db.kYCSubmission.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
    })

    const formattedSubmissions = pendingSubmissions.map((submission) => ({
      id: submission.id,
      userId: submission.userId,
      userEmail: submission.user.email,
      userName: submission.user.name,
      userRole: submission.user.role,
      firstName: submission.firstName,
      lastName: submission.lastName,
      dateOfBirth: submission.dateOfBirth.toISOString(),
      governmentIdType: submission.governmentIdType,
      governmentIdNumber: submission.governmentIdNumber,
      governmentIdImageUrl: submission.governmentIdImageUrl,
      governmentIdBackUrl: submission.governmentIdBackUrl,
      livelinessImageUrl: submission.livelinessImageUrl,
      status: submission.status,
      submittedAt: submission.createdAt.toISOString(),
      userCreatedAt: submission.user.createdAt.toISOString(),
    }))

    return NextResponse.json({
      submissions: formattedSubmissions,
      count: formattedSubmissions.length,
    })
  } catch (error: any) {
    console.error('roy: Error fetching pending KYC submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending submissions' },
      { status: 500 }
    )
  }
}

