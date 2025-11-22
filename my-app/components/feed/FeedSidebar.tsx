'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Bell, 
  MessageCircle, 
  Bookmark, 
  User, 
  CreditCard, 
  Settings, 
  MoreHorizontal,
  Plus,
  LogOut,
  Calendar
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'

export function FeedSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { icon: Home, label: 'Home', href: '/dashboard/subscriber/feed', active: pathname === '/dashboard/subscriber/feed' },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
    { icon: MessageCircle, label: 'Messages', href: '/dashboard/messages' },
    { icon: Bookmark, label: 'Collections', href: '/dashboard/collections' },
    { icon: User, label: 'Subscriptions', href: '/dashboard/subscriptions' },
    { icon: Calendar, label: 'Bookings', href: '/dashboard/subscriber/bookings', active: pathname?.startsWith('/dashboard/subscriber/bookings') },
    { icon: CreditCard, label: 'Add card', href: '/dashboard/payment' },
    { icon: Settings, label: 'My profile', href: session?.user?.role === 'CREATOR' ? '/dashboard/creator/profile' : '/dashboard/settings' },
    { icon: MoreHorizontal, label: 'More', href: '/dashboard/more' },
  ]

  const handleNewPost = () => {
    if (session?.user?.role === 'CREATOR') {
      router.push('/dashboard/creator/profile')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo/User Avatar */}
      <div className="p-6 border-b border-gray-200">
        {session?.user?.image ? (
          <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-blue-600 mx-auto">
            {session.user.image && session.user.image.trim() ? (
              session.user.image.startsWith('/') ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <img
                  src={session.user.image || undefined}
                  alt={session.user.name || 'User'}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl mx-auto">
            {session?.user?.name?.charAt(0).toUpperCase() || 'R'}
          </Link>
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* New Post Button / Logout */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {session?.user?.role === 'CREATOR' && (
          <Button
            onClick={handleNewPost}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>+ NEW POST</span>
          </Button>
        )}
        
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

