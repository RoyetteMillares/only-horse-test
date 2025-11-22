import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ⚠️ ONLY FOR DEVELOPMENT
const SEED_TOKEN = process.env.SEED_TOKEN || 'dev-seed-token-123'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-seed-token')
    if (token !== SEED_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not allowed in production' },
        { status: 403 }
      )
    }

    // Clear all data
    await db.message.deleteMany()
    await db.subscription.deleteMany()
    await db.profileView.deleteMany()
    await db.earning.deleteMany()
    await db.kYCSubmission.deleteMany()
    await db.user.deleteMany()

    return NextResponse.json({
      message: 'Database cleared successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
