import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

const PRICING = {
  BASIC: 499,    // $4.99
  PREMIUM: 999,  // $9.99
  VIP: 2499,     // $24.99
}

// Create subscription after payment method is attached
// — Royette
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { creatorId, tier, setupIntentId } = await req.json()

    if (!creatorId || !tier || !setupIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorId, tier, setupIntentId' },
        { status: 400 }
      )
    }

    // Get subscriber and creator
    const subscriber = await db.user.findUnique({
      where: { id: session.user.id },
    })

    const creator = await db.user.findUnique({
      where: { id: creatorId },
    })

    if (!subscriber || !creator) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = subscriber.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: subscriber.email!,
        name: subscriber.name || undefined,
        metadata: { userId: subscriber.id },
      })
      customerId = customer.id

      await db.user.update({
        where: { id: subscriber.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Retrieve SetupIntent to get payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    const paymentMethodId = setupIntent.payment_method as string

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method not found in setup intent' },
        { status: 400 }
      )
    }

    // Attach payment method to customer and set as default
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Check if subscription already exists
    const existingSubscription = await db.subscription.findFirst({
      where: {
        subscriberId: subscriber.id,
        creatorId: creator.id,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription to this creator' },
        { status: 400 }
      )
    }

    // Create subscription with payment method
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            product: `${creator.name || 'Creator'} - ${tier} Tier`,
            recurring: {
              interval: 'month',
            },
            unit_amount: PRICING[tier as keyof typeof PRICING],
          },
        },
      ],
      default_payment_method: paymentMethodId,
      metadata: {
        creatorId,
        subscriberId: subscriber.id,
        tier,
      },
    })

    // Calculate renewal date
    const currentPeriodEnd = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Save subscription to DB
    const subscription = await db.subscription.create({
      data: {
        subscriberId: subscriber.id,
        creatorId,
        tier: tier as any,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'ACTIVE',
        price: PRICING[tier as keyof typeof PRICING] / 100,
        billingCycle: 'MONTHLY',
        renewsAt: currentPeriodEnd,
      },
    })

    return NextResponse.json({ subscription })
  } catch (error: any) {
    console.error('roy: Error creating subscription with payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

