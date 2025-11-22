import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const stripeConnectUrl = new URL('https://connect.stripe.com/oauth/authorize')
    stripeConnectUrl.searchParams.append(
      'client_id',
      process.env.STRIPE_CONNECT_CLIENT_ID!
    )
    stripeConnectUrl.searchParams.append('response_type', 'code')
    stripeConnectUrl.searchParams.append('scope', 'read_write')
    stripeConnectUrl.searchParams.append(
      'redirect_uri',
      `${baseUrl}/auth/stripe-connect`
    )
    stripeConnectUrl.searchParams.append('state', session.user.id)
    stripeConnectUrl.searchParams.append('stripe_user[email]', session.user.email || '')
    stripeConnectUrl.searchParams.append('stripe_user[business_type]', 'individual')

    return NextResponse.redirect(stripeConnectUrl.toString())
  } catch (error: any) {
    console.error('Stripe connect error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
