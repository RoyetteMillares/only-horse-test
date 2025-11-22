import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId, content, isPaidMessage, costCredits } = await req.json()

    // Check subscription
    const subscription = await db.subscription.findFirst({
      where: {
        subscriberId: session.user.id,
        creatorId: recipientId,
        status: "ACTIVE",
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Must be subscribed to message this creator" },
        { status: 403 }
      )
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        content,
        isPaidMessage: isPaidMessage || false,
        costCredits: costCredits || 0,
      },
    })

    // TODO: Emit socket.io event for real-time update
    // TODO: Deduct credits if paid message

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
