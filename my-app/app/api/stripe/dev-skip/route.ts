import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check: Only allow in development
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Auth Check
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 3. Mock Stripe Connection
        // We set a dummy stripeConnectId to satisfy the requirement
        await db.user.update({
            where: { id: session.user.id },
            data: {
                stripeConnectId: 'acct_mock_dev_bypass_' + Date.now(),
                // Optionally we could auto-verify KYC here too if we wanted, 
                // but the plan said to leave it to test KYC flow separately.
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Dev skip error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
