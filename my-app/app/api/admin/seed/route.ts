import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// ⚠️ ONLY FOR DEVELOPMENT - Remove in production!
const SEED_TOKEN = process.env.SEED_TOKEN || 'dev-seed-token-123'

export async function POST(req: NextRequest) {
  try {
    // Verify seed token for security
    const token = req.headers.get('x-seed-token')
    if (token !== SEED_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid seed token.' },
        { status: 401 }
      )
    }

    // Check environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seeding not allowed in production' },
        { status: 403 }
      )
    }

    const CREATORS_DATA = [
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        bio: 'Professional model and lifestyle creator. Love traveling!',
        hourlyRate: 9.99,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      {
        name: 'Emma Williams',
        email: 'emma@example.com',
        bio: 'Fitness enthusiast and wellness coach.',
        hourlyRate: 12.99,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      },
      {
        name: 'Jessica Davis',
        email: 'jessica@example.com',
        bio: 'Fashion blogger & stylist.',
        hourlyRate: 14.99,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
      },
      {
        name: 'Olivia Martinez',
        email: 'olivia@example.com',
        bio: 'Artist & creative mind.',
        hourlyRate: 11.99,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
      },
    ]

    // Check if creators already exist
    const existingCount = await db.user.count({
      where: { isCreator: true },
    })

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Creators already exist in database',
        count: existingCount,
      })
    }

    // Create creators
    const createdCreators = []
    for (const creatorData of CREATORS_DATA) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const creator = await db.user.create({
        data: {
          name: creatorData.name,
          email: creatorData.email,
          password: hashedPassword,
          bio: creatorData.bio,
          image: creatorData.image,
          hourlyRate: creatorData.hourlyRate,
          role: 'CREATOR',
          status: 'ACTIVE',
          isCreator: true,
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      })
      createdCreators.push(creator)
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      creatorsCreated: createdCreators.length,
      creators: createdCreators.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        rate: c.hourlyRate,
      })),
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    )
  }
}
