'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, CreditCard } from 'lucide-react'

export default function SettingsPage() {
    const { data: session } = useSession()

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-500 mb-8">Manage your account settings and preferences.</p>

            <div className="space-y-8">
                {/* Profile Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    </div>

                    <div className="grid gap-6 max-w-xl">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                defaultValue={session?.user?.name || ''}
                                placeholder="Your name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input
                                id="bio"
                                placeholder="Tell us about yourself"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button>Save Changes</Button>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
                    </div>

                    <div className="grid gap-6 max-w-xl">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        defaultValue={session?.user?.email || ''}
                                        disabled
                                        className="pl-9 bg-gray-50"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Contact support to change your email.</p>
                        </div>
                    </div>
                </div>

                {/* Billing Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                    </div>

                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">No payment methods added yet.</p>
                        <Button variant="outline">Add Payment Method</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
