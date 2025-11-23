'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Calendar,
    BarChart3,
    User,
    Settings,
    Plus,
    LogOut,
    MessageSquare
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'

export function CreatorSidebar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const router = useRouter()

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/creator/dashboard', active: pathname === '/creator/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/creator/bookings', active: pathname?.startsWith('/creator/bookings') },
        { icon: MessageSquare, label: 'Messages', href: '/creator/messages', active: pathname?.startsWith('/creator/messages') },
        { icon: BarChart3, label: 'Analytics', href: '/creator/analytics', active: pathname === '/creator/analytics' },
        { icon: User, label: 'My Profile', href: '/creator/profile', active: pathname === '/creator/profile' },
        { icon: Settings, label: 'Settings', href: '/creator/settings', active: pathname === '/creator/settings' },
    ]

    const handleNewPost = () => {
        router.push('/creator/posts/new')
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
            {/* Logo/User Avatar */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-600 text-white p-2 rounded-lg">
                        <LayoutDashboard size={20} />
                    </div>
                    <span className="font-bold text-lg text-gray-900">Creator Hub</span>
                </div>

                {session?.user?.image ? (
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                            {session.user.image.startsWith('/') ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{session.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">Creator Account</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{session?.user?.name || 'Creator'}</p>
                            <p className="text-xs text-gray-500 truncate">Creator Account</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = item.active

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-purple-700' : 'text-gray-500'}`} />
                                    <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* New Post Button / Logout */}
            <div className="p-4 border-t border-gray-200 space-y-3">
                <Button
                    onClick={handleNewPost}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2"
                >
                    <span>Create Post</span>
                </Button>

                <Link href="/feed">
                    <Button
                        variant="outline"
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
                    >
                        <LogOut className="w-4 h-4 rotate-180" />
                        <span>Switch to Fan View</span>
                    </Button>
                </Link>

                {/* Logout Button */}
                <div className="w-full">
                    <SignOutButton
                        variant="ghost"
                        size="default"
                        className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
                        showIcon={true}
                        redirectTo="/"
                    />
                </div>
            </div>
        </aside>
    )
}
