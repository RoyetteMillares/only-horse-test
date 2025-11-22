import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

const PRICING = {
  BASIC: 499,    // $4.99
  PREMIUM: 999,  // $9.99
  VIP: 2499,     // $24.99
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { creatorId, tier } = await req.json()

    // Get subscriber and creator
    const subscriber = await db.user.findUnique({
      where: { id: session.user.id },
    })

    const creator = await db.user.findUnique({
      where: { id: creatorId },
    })

    if (!subscriber || !creator) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create or get Stripe customer
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

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: "usd",
            product: `${creator.name} - ${tier} Tier`,
            recurring: {
              interval: "month",
            },
            unit_amount: PRICING[tier as keyof typeof PRICING],
          },
        },
      ],
      metadata: {
        creatorId,
        subscriberId: subscriber.id,
        tier,
      },
    })

    // Save subscription to DB
    const currentPeriodEnd = (stripeSubscription as any).current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    
    const subscription = await db.subscription.create({
      data: {
        subscriberId: subscriber.id,
        creatorId,
        tier,
        stripeSubscriptionId: stripeSubscription.id,
        status: "ACTIVE",
        price: PRICING[tier as keyof typeof PRICING] / 100,
        renewsAt: new Date(currentPeriodEnd * 1000),
      },
    })

    return NextResponse.json(subscription)
  } catch (error: any) {
    console.error("Subscription error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 }
    )
  }
}
