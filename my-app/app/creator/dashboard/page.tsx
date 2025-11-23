import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

export default async function CreatorDashboard() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/auth/login')
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { kycStatus: true, kycRejectionReason: true, name: true }
    })

    if (!user) redirect('/')

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
                <span className="text-sm text-gray-500">Welcome back, {user.name || 'Creator'}</span>
            </div>

            {/* KYC Status Alerts */}
            {user.kycStatus === 'NOT_STARTED' && (
                <Alert className="bg-blue-50 border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Identity Verification Required</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        To start accepting bookings, you need to verify your identity.
                        <br />
                        <a href="/creator/onboarding/kyc" className="underline font-medium mt-2 inline-block">
                            Start Verification
                        </a>
                    </AlertDescription>
                </Alert>
            )}

            {user.kycStatus === 'PENDING' && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Verification Pending</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        Your identity verification is currently under review. This usually takes 24-48 hours.
                        You will receive an email once approved.
                    </AlertDescription>
                </Alert>
            )}

            {user.kycStatus === 'REJECTED' && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Verification Rejected</AlertTitle>
                    <AlertDescription>
                        Your verification was rejected. Reason: {user.kycRejectionReason}
                        <br />
                        <a href="/creator/onboarding/kyc" className="underline font-medium mt-2 inline-block">
                            Click here to try again
                        </a>
                    </AlertDescription>
                </Alert>
            )}

            {user.kycStatus === 'VERIFIED' && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Account Verified</AlertTitle>
                    <AlertDescription className="text-green-700">
                        You are a verified creator! You can now start posting content and accepting bookings.
                    </AlertDescription>
                </Alert>
            )}

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-medium text-gray-500 text-sm uppercase tracking-wide">Total Earnings</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900">$0.00</p>
                    <p className="text-xs text-green-600 mt-2 font-medium">+0% from last month</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-medium text-gray-500 text-sm uppercase tracking-wide">Active Subscribers</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900">0</p>
                    <p className="text-xs text-gray-400 mt-2">0 new this month</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-medium text-gray-500 text-sm uppercase tracking-wide">Pending Bookings</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900">0</p>
                    <p className="text-xs text-gray-400 mt-2">Action required</p>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-12 text-center text-gray-500">
                    No recent activity to show.
                </div>
            </div>
        </div>
    )
}
