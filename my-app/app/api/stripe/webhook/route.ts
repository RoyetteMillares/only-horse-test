import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature")!
    const body = await req.text()

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const creatorId = subscription.metadata?.creatorId
  const subscriberId = subscription.metadata?.subscriberId

  if (!creatorId || !subscriberId) return

  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "ACTIVE" },
  })
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Record earning and update subscription renewal date
  const invoiceData = invoice as any
  const subscriptionId = typeof invoiceData.subscription === 'string' 
    ? invoiceData.subscription 
    : invoiceData.subscription?.id

  if (!subscriptionId) return

  const subscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (subscription) {
    // Update subscription renewal date
    const currentPeriodEnd = invoiceData.period_end
      ? new Date(invoiceData.period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        renewsAt: currentPeriodEnd,
      },
    })

    // Record creator earning (85% to creator, 15% platform fee)
    const chargeId = typeof invoiceData.charge === 'string' 
      ? invoiceData.charge 
      : invoiceData.charge?.id

    const totalAmount = (invoice.total || 0) / 100
    const creatorPayout = totalAmount * 0.85 // 85% to creator

    await db.earning.create({
      data: {
        creatorId: subscription.creatorId,
        amount: creatorPayout,
        source: "SUBSCRIPTION",
        stripeChargeId: chargeId || null,
      },
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`Payment failed for invoice ${invoice.id}`)
}
