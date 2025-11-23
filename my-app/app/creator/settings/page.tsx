'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, DollarSign, Shield, ExternalLink } from 'lucide-react'

export default function CreatorSettingsPage() {
    const { data: session } = useSession()

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Settings</h1>
            <p className="text-gray-500 mb-8">Manage your creator profile and payout preferences.</p>

            <div className="space-y-8">
                {/* Payouts Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Payout Settings</h2>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900">Stripe Connect</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage your bank account and payout schedule directly on Stripe.</p>
                            </div>
                            <Button variant="outline" className="flex items-center gap-2">
                                Manage on Stripe
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Public Profile</h2>
                    </div>

                    <div className="grid gap-6 max-w-xl">
                        <div className="grid gap-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                defaultValue={session?.user?.name || ''}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                            <Input
                                id="hourlyRate"
                                type="number"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500">This is your base rate for bookings.</p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
