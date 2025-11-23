import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        profileImage: true,
        bio: true,
        role: true,
        kycStatus: true,
        isCreator: true,
        hourlyRate: true,
        _count: {
          select: {
            subscriptions: true,
            receivedMessages: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if KYCSubmission exists and sync status to User.kycStatus
    // This ensures User.kycStatus matches the actual KYCSubmission.status
    // — Royette
    const kycSubmission = await db.kYCSubmission.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    })

    // If KYCSubmission exists but User.kycStatus is out of sync, sync it
    if (kycSubmission && user.kycStatus !== kycSubmission.status) {
      console.log('roy: Syncing User.kycStatus with KYCSubmission.status:', {
        userId: session.user.id,
        oldStatus: user.kycStatus,
        newStatus: kycSubmission.status,
      })

      await db.user.update({
        where: { id: session.user.id },
        data: { kycStatus: kycSubmission.status },
      })

      // Update user object to return correct status
      user.kycStatus = kycSubmission.status
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('roy: Error fetching profile:', error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, bio, role, hourlyRate, profileImage } = body

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        role: role || undefined,
        isCreator: role === 'CREATOR' ? true : (role === 'SUBSCRIBER' ? false : undefined),
        hourlyRate: hourlyRate || undefined,
        profileImage: profileImage || undefined,
        image: profileImage || undefined, // Also update image for NextAuth compatibility
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
