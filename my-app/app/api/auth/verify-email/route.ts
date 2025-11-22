import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email already verified',
        verified: true,
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        type: 'email',
      },
    })

    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    const { sendVerificationEmail } = await import('@/lib/emails')
    await sendVerificationEmail(email, user.name || 'User', verificationUrl)

    return NextResponse.json({
      message: 'Verification email sent',
      success: true,
    })
  } catch (error: any) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email required' },
        { status: 400 }
      )
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
        type: 'email',
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      })
      return NextResponse.json(
        { error: 'Token expired. Please request a new one.' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    await db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    })

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true,
    })
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
