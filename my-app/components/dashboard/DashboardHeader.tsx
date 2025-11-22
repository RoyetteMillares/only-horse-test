'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Button } from '@/components/ui/button'
import { Home, User, Settings } from 'lucide-react'

// Dashboard header component with navigation and sign out
// — Royette
export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Socially</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            {session?.user && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                
                {session.user.role === 'CREATOR' ? (
                  <Link href="/dashboard/creator/profile">
                    <Button variant="ghost" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/subscriber/browse">
                    <Button variant="ghost" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      Browse
                    </Button>
                  </Link>
                )}

                <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
                  {session.user.image && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('roy: Header image load error')
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <span className="text-sm text-gray-600">
                    {session.user.name || session.user.email}
                  </span>
                  <SignOutButton variant="ghost" size="sm" />
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

