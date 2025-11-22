'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  redirectTo?: string
}

// Reusable sign out button component
// — Royette
export function SignOutButton({
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  redirectTo = '/',
}: SignOutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: redirectTo 
      })
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error('roy: Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      variant={variant}
      size={size}
      disabled={isLoading}
      className={className}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}

