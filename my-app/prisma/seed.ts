import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create 8 dummy creators
    const creators = [
        {
            email: 'sarah.jones@example.com',
            name: 'Sarah Jones',
            bio: 'Professional model and content creator. Love fashion, travel, and meeting new people! ✨',
            hourlyRate: 150,
            location: 'New York, NY',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
            isFeatured: true,
        },
        {
            email: 'emily.chen@example.com',
            name: 'Emily Chen',
            bio: 'Fitness enthusiast and lifestyle influencer. Let\'s explore the city together! 💪',
            hourlyRate: 120,
            location: 'Los Angeles, CA',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
            isFeatured: true,
        },
        {
            email: 'mia.rodriguez@example.com',
            name: 'Mia Rodriguez',
            bio: 'Artist and creative soul. Coffee dates and gallery tours are my thing ☕🎨',
            hourlyRate: 100,
            location: 'Miami, FL',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
            isFeatured: true,
        },
        {
            email: 'olivia.kim@example.com',
            name: 'Olivia Kim',
            bio: 'Tech professional by day, foodie by night. Let\'s try the best restaurants in town! 🍜',
            hourlyRate: 130,
            location: 'San Francisco, CA',
            image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
            isFeatured: true,
        },
        {
            email: 'sophia.taylor@example.com',
            name: 'Sophia Taylor',
            bio: 'Travel blogger and adventure seeker. Always up for spontaneous trips! ✈️',
            hourlyRate: 140,
            location: 'Seattle, WA',
            image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
            isFeatured: false,
        },
        {
            email: 'ava.martinez@example.com',
            name: 'Ava Martinez',
            bio: 'Yoga instructor and wellness coach. Let\'s find your zen together 🧘‍♀️',
            hourlyRate: 110,
            location: 'Austin, TX',
            image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
            isFeatured: false,
        },
        {
            email: 'isabella.lee@example.com',
            name: 'Isabella Lee',
            bio: 'Musician and performer. Music lover? Let\'s hit some live shows! 🎵',
            hourlyRate: 125,
            location: 'Nashville, TN',
            image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
            isFeatured: false,
        },
        {
            email: 'charlotte.wang@example.com',
            name: 'Charlotte Wang',
            bio: 'Fashion designer and style consultant. Shopping sprees are my specialty! 👗',
            hourlyRate: 160,
            location: 'Chicago, IL',
            image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop',
            isFeatured: false,
        },
    ]

    for (const creator of creators) {
        await prisma.user.create({
            data: {
                ...creator,
                password: hashedPassword,
                emailVerified: new Date(),
                role: 'CREATOR',
                isCreator: true,
                status: 'ACTIVE',
                kycStatus: 'VERIFIED',
                stripeConnectId: `acct_mock_${creator.email.split('@')[0]}`,
                minHours: 2,
            },
        })
        console.log(`✅ Created creator: ${creator.name}`)
    }

    // Create a test subscriber
    await prisma.user.create({
        data: {
            email: 'fan@example.com',
            name: 'Test Fan',
            password: hashedPassword,
            emailVerified: new Date(),
            role: 'SUBSCRIBER',
            isCreator: false,
            status: 'ACTIVE',
        },
    })
    console.log('✅ Created test subscriber: fan@example.com')

    console.log('🎉 Seeding complete!')
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
