import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, state } = await req.json()

    if (state !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_SECRET_KEY!,
        code,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code')
    }

    const data = await response.json()
    const stripeAccountId = data.stripe_user_id

    await db.user.update({
      where: { id: session.user.id },
      data: {
        stripeConnectId: stripeAccountId,
      },
    })

    return NextResponse.json({
      message: 'Stripe account connected successfully',
      success: true,
    })
  } catch (error: any) {
    console.error('Stripe callback error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
