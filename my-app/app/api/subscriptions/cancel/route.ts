import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

// Cancel subscription endpoint
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId' },
        { status: 400 }
      )
    }

    // Get subscription
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Verify user is the subscriber
    if (subscription.subscriberId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only subscriber can cancel' },
        { status: 403 }
      )
    }

    // Verify subscription is active
    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Subscription is already ${subscription.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      } catch (stripeError: any) {
        console.warn('roy: Error cancelling Stripe subscription:', stripeError.message)
        // Continue anyway - update DB status
      }
    }

    // Update subscription status
    const updatedSubscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    return NextResponse.json({ subscription: updatedSubscription })
  } catch (error: any) {
    console.error('roy: Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

