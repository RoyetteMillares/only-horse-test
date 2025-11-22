'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard,
  Shield,
  Users,
  FileWarning,
  Settings,
  LogOut,
  BarChart3,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import { SignOutButton } from '@/components/auth/SignOutButton'

// Admin sidebar navigation component
// Provides navigation for admin users with admin-specific menu items
// — Royette
export function AdminSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  // Admin-specific navigation menu items
  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/dashboard/admin', 
      active: pathname === '/dashboard/admin' 
    },
    { 
      icon: Shield, 
      label: 'KYC Verifications', 
      href: '/dashboard/admin/verifications',
      active: pathname === '/dashboard/admin/verifications' 
    },
    { 
      icon: Users, 
      label: 'Users', 
      href: '/dashboard/admin/users',
      active: pathname?.startsWith('/dashboard/admin/users')
    },
    { 
      icon: UserCheck, 
      label: 'Creators', 
      href: '/dashboard/admin/creators',
      active: pathname?.startsWith('/dashboard/admin/creators')
    },
    { 
      icon: FileWarning, 
      label: 'Reports', 
      href: '/dashboard/admin/reports',
      active: pathname?.startsWith('/dashboard/admin/reports')
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      href: '/dashboard/admin/analytics',
      active: pathname === '/dashboard/admin/analytics'
    },
    { 
      icon: AlertCircle, 
      label: 'Moderation', 
      href: '/dashboard/admin/moderation',
      active: pathname?.startsWith('/dashboard/admin/moderation')
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/dashboard/admin/settings',
      active: pathname === '/dashboard/admin/settings'
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Admin Badge & User Avatar */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard/admin" className="flex flex-col items-center space-y-2">
          {/* User Avatar */}
          {session?.user?.image && session.user.image.trim() ? (
            session.user.image.startsWith('/') ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-600">
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Admin'}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-600">
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Admin'}
                  className="w-full h-full object-cover"
                />
              </div>
            )
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg border-2 border-blue-700">
              {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          
          {/* Admin Badge */}
          <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 border border-red-300 rounded-md">
            <Shield className="w-3 h-3 text-red-600" />
            <span className="text-xs font-semibold text-red-600">ADMIN</span>
          </div>
          
          {/* User Name */}
          <p className="text-sm font-medium text-gray-900 text-center">
            {session?.user?.name || session?.user?.email || 'Admin User'}
          </p>
        </Link>
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <SignOutButton 
          variant="ghost" 
          size="default"
          className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
          showIcon={true}
          redirectTo="/"
        />
      </div>
    </aside>
  )
}

