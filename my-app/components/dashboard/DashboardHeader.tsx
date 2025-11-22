'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Button } from '@/components/ui/button'
import { Home, User, Settings, ChevronDown } from 'lucide-react'

// Clean dashboard header component - OnlyFans style
// — Royette
export function DashboardHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Determine active navigation
  const isFeedActive = pathname?.includes('/feed')
  const isProfileActive = session?.user?.role === 'CREATOR' 
    ? pathname?.includes('/creator/profile')
    : pathname?.includes('/browse')

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Home className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Socially</span>
          </Link>

          {/* Navigation - Only show on non-feed pages */}
          {!pathname?.includes('/subscriber/feed') && session?.user && (
            <nav className="flex items-center space-x-1">
              <Link href="/dashboard/subscriber/feed">
                <Button 
                  variant={isFeedActive ? 'default' : 'ghost'} 
                  size="sm"
                  className={isFeedActive ? 'bg-blue-600 text-white' : ''}
                >
                  Feed
                </Button>
              </Link>
              
              {session.user.role === 'CREATOR' ? (
                <Link href="/dashboard/creator/profile">
                  <Button 
                    variant={isProfileActive ? 'default' : 'ghost'} 
                    size="sm"
                    className={isProfileActive ? 'bg-blue-600 text-white' : ''}
                  >
                    Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard/subscriber/browse">
                  <Button 
                    variant={isProfileActive ? 'default' : 'ghost'} 
                    size="sm"
                    className={isProfileActive ? 'bg-blue-600 text-white' : ''}
                  >
                    Browse
                  </Button>
                </Link>
              )}
            </nav>
          )}

          {/* User Profile Dropdown */}
          {session?.user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {session.user.image && session.user.image.trim() ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                    <img
                      key={session.user.image}
                      src={session.user.image || undefined}
                      alt={session.user.name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('roy: Header image load error')
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
                  {session.user.name || session.user.email}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href={session.user.role === 'CREATOR' ? '/dashboard/creator/profile' : '/dashboard/settings'}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                  
                  <div className="border-t border-gray-200 my-1" />
                  
                  <div className="px-4 py-2">
                    <SignOutButton 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:bg-gray-100"
                      showIcon={true}
                      redirectTo="/"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

