'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Verification banner component - shows verification status and prompts to verify
// "Account Verified" banner shows only once and can be dismissed
// — Royette
export function VerificationBanner({ 
  className = '',
  kycStatus: overrideStatus 
}: { 
  className?: string
  kycStatus?: string 
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if user has dismissed the verified banner
  useEffect(() => {
    if (!session?.user?.id) return
    
    const dismissedKey = `verification_banner_dismissed_${session.user.id}`
    const dismissed = localStorage.getItem(dismissedKey)
    setIsDismissed(dismissed === 'true')
  }, [session?.user?.id])

  const handleDismiss = () => {
    if (!session?.user?.id) return
    
    const dismissedKey = `verification_banner_dismissed_${session.user.id}`
    localStorage.setItem(dismissedKey, 'true')
    setIsDismissed(true)
  }

  if (!session?.user) return null

  // Use override status if provided (for local state), otherwise use session
  const kycStatus = overrideStatus || session.user.kycStatus || 'NOT_STARTED'

  // Show different banners based on verification status
  // For VERIFIED status, only show once until dismissed
  if (kycStatus === 'VERIFIED') {
    // Don't show if already dismissed
    if (isDismissed) return null

    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Account Verified</p>
            <p className="text-xs text-green-700">Your account has been verified successfully</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 p-1 rounded-full hover:bg-green-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-green-600" />
        </button>
      </div>
    )
  }

  if (kycStatus === 'PENDING') {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between ${className}`}>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Verification Pending</p>
            <p className="text-xs text-yellow-700">Your verification is being reviewed. Please wait 24-48 hours.</p>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus === 'REJECTED') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between ${className}`}>
        <div className="flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Verification Rejected</p>
            <p className="text-xs text-red-700">Your verification was rejected. Please submit again with correct documents.</p>
          </div>
        </div>
        <Link href="/dashboard/verification">
          <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
            Re-submit
          </Button>
        </Link>
      </div>
    )
  }

  // NOT_STARTED - Show verification required banner
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900">Account Verification Required</p>
          <p className="text-xs text-red-700">
            Please complete account verification to start posting, subscribing, and accessing all features.
          </p>
        </div>
      </div>
      <Link href="/dashboard/verification">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          Verify Now
        </Button>
      </Link>
    </div>
  )
}

