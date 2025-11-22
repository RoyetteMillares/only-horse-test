'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { VerificationWizard } from '@/components/kyc/VerificationWizard'
import { VerificationBanner } from '@/components/verification/VerificationBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, XCircle, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Account verification page - for all users (creators and fans)
// — Royette
export default function VerificationPage() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession()
  const router = useRouter()
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true) // Track if we're fetching status
  const hasFetchedStatus = useRef(false) // Prevent infinite loop - only fetch once

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
  }, [sessionStatus, router])

  // Fetch actual KYC status from database on page load
  // This ensures we show the correct status even if session is stale
  // Only fetch once to prevent infinite loop
  // — Royette
  useEffect(() => {
    // Prevent infinite loop - only fetch once
    if (hasFetchedStatus.current) return
    
    const fetchKycStatus = async () => {
      if (!session?.user?.id) {
        setStatusLoading(false)
        return
      }

      // Mark as fetched to prevent re-fetching
      hasFetchedStatus.current = true

      try {
        setStatusLoading(true)
        // Fetch actual status from database
        const response = await fetch('/api/users/profile')
        if (response.ok) {
          const user = await response.json()
          if (user?.kycStatus) {
            console.log('roy: Fetched actual KYC status from database:', user.kycStatus)
            setKycStatus(user.kycStatus)
            // Only update session if it's actually different (not on every fetch)
            if (session.user.kycStatus !== user.kycStatus) {
              // Update session in background without blocking
              if (updateSession) {
                updateSession().catch((err) => {
                  console.error('roy: Error updating session:', err)
                })
              }
            }
          } else {
            // No status in database, default to NOT_STARTED
            setKycStatus('NOT_STARTED')
          }
        } else {
          // Fallback to session status if fetch fails
          if (session?.user?.kycStatus) {
            setKycStatus(session.user.kycStatus)
          } else {
            setKycStatus('NOT_STARTED')
          }
        }
      } catch (error) {
        console.error('roy: Error fetching KYC status:', error)
        // Fallback to session status
        if (session?.user?.kycStatus) {
          setKycStatus(session.user.kycStatus)
        } else {
          setKycStatus('NOT_STARTED')
        }
      } finally {
        setStatusLoading(false)
      }
    }

    if (session?.user) {
      // Set initial status from session first
      setKycStatus(session.user.kycStatus || 'NOT_STARTED')
      // Then fetch actual status from database (only once)
      fetchKycStatus()
    } else {
      setStatusLoading(false)
    }
    // Only depend on session.user.id to prevent re-runs when session object changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // Refresh session after successful KYC submission
  const handleKYCSubmitted = async () => {
    // Wait a moment for database to update, then refresh session
    setTimeout(async () => {
      if (updateSession) {
        await updateSession()
      }
      // Force a page refresh to get updated session
      router.refresh()
      // Reload page after a short delay to ensure session is updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }, 1500)
  }

  if (sessionStatus === 'loading' || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading verification status...</p>
      </div>
    )
  }

  // Use kycStatus from state (fetched from database) or fallback to session
  const currentStatus = kycStatus !== null ? kycStatus : (session?.user?.kycStatus || 'NOT_STARTED')
  
  // Debug log to see what status is being used
  console.log('roy: Verification page status:', { 
    kycStatus, 
    sessionStatus: session?.user?.kycStatus, 
    currentStatus,
    statusLoading 
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Account Verification</h1>
          </div>
          <p className="text-gray-600">
            Complete your identity verification to unlock all platform features including posting, subscribing, and booking.
          </p>
        </div>

        {/* Verification Status Banner - Only show for NOT_STARTED or REJECTED (not PENDING or VERIFIED, those have detailed cards below) */}
        {(currentStatus === 'NOT_STARTED' || currentStatus === 'REJECTED') && (
          <div className="mb-6">
            <VerificationBanner kycStatus={currentStatus} />
          </div>
        )}

        {/* Status Cards */}
        {currentStatus === 'VERIFIED' && (
          <Card className="bg-green-50 border-green-200 mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <CardTitle className="text-green-900">Account Verified</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 mb-4">
                Your account has been successfully verified! You can now use all platform features.
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={() => router.push('/dashboard/subscriber/feed')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Go to Feed
                </Button>
                {session?.user?.role === 'CREATOR' && (
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/creator/profile')}
                    className="border-green-600 text-green-700 hover:bg-green-100"
                  >
                    Creator Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === 'PENDING' && (
          <Card className="bg-yellow-50 border-yellow-200 mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-yellow-600" />
                <CardTitle className="text-yellow-900">Verification Pending</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800 mb-2">
                Your verification documents have been submitted and are currently being reviewed.
              </p>
              <p className="text-sm text-yellow-700 mb-4">
                We typically verify accounts within 24-48 hours. You'll receive an email notification once your verification is complete.
              </p>
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <Clock className="w-4 h-4" />
                <span>Please wait while we review your documents. Do not submit again.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === 'REJECTED' && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <CardTitle className="text-red-900">Verification Rejected</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 mb-4">
                Your verification was rejected. Please review the requirements and submit again with clear, valid documents.
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-4">
                <li>Ensure your government ID is clearly visible and valid</li>
                <li>Take a clear selfie with good lighting</li>
                <li>Make sure your documents match the information provided</li>
                <li>Documents must not be expired</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Verification Wizard - Only show for NOT_STARTED or REJECTED (not PENDING or VERIFIED) */}
        {/* Hide wizard while loading status or while submitting */}
        {!statusLoading && !loading && currentStatus !== 'PENDING' && currentStatus !== 'VERIFIED' && (currentStatus === 'NOT_STARTED' || currentStatus === 'REJECTED') && (
          <VerificationWizard
            onComplete={async (data) => {
              // Handle wizard completion - upload files and submit
              try {
                setLoading(true)
                
                // Upload files first
                const uploadFile = async (file: File, docType: 'id' | 'selfie') => {
                  const uploadUrlRes = await fetch('/api/kyc/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fileType: file.type,
                      docType,
                    }),
                  })

                  if (!uploadUrlRes.ok) throw new Error('Failed to get upload URL')
                  const { uploadUrl, fileKey } = await uploadUrlRes.json()

                  const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                  })

                  if (!uploadRes.ok) throw new Error('Upload failed')
                  return fileKey
                }

                const [governmentIdKey, livelinessKey] = await Promise.all([
                  uploadFile(data.files.governmentId!, 'id'),
                  uploadFile(data.files.liveness!, 'selfie'),
                ])

                // Submit KYC
                const response = await fetch('/api/kyc/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    dateOfBirth: data.dateOfBirth,
                    idType: data.idType,
                    governmentIdNumber: data.governmentIdNumber,
                    governmentIdKey,
                    livelinessKey,
                  }),
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  const errorMessage = errorData.error || 'Failed to submit verification'
                  
                  // If already submitted, refetch status from database and refresh
                  if (errorMessage.includes('already submitted') || errorMessage.includes('pending review')) {
                    toast.info('Verification already submitted', {
                      description: 'Your verification is already in progress. Please wait for review.',
                    })
                    
                    // Refetch actual status from database
                    try {
                      const profileRes = await fetch('/api/users/profile')
                      if (profileRes.ok) {
                        const user = await profileRes.json()
                        if (user?.kycStatus) {
                          console.log('roy: Refetched KYC status after error:', user.kycStatus)
                          setKycStatus(user.kycStatus)
                        }
                      }
                    } catch (err) {
                      console.error('roy: Error refetching status:', err)
                      // Fallback to PENDING if refetch fails
                      setKycStatus('PENDING')
                    }
                    
                    // Refresh session immediately to sync with database
                    if (updateSession) {
                      await updateSession()
                    }
                    router.refresh()
                    
                    // Force page reload after a short delay to ensure status is correct
                    setTimeout(() => {
                      window.location.reload()
                    }, 1000)
                    return
                  }
                  
                  throw new Error(errorMessage)
                }

                // Immediately set status to PENDING to hide wizard and show status
                setKycStatus('PENDING')
                
                toast.success('Verification submitted successfully!', {
                  description: 'We will review your documents within 24-48 hours.',
                })

                // Refresh session immediately to update banner
                if (updateSession) {
                  await updateSession()
                }
                router.refresh()
                
                // Force session refresh after a short delay
                setTimeout(async () => {
                  if (updateSession) {
                    await updateSession()
                  }
                }, 1000)
              } catch (error: any) {
                console.error('roy: Verification submission error:', error)
                toast.error('Failed to submit verification', {
                  description: error.message || 'Please try again later.',
                })
              } finally {
                setLoading(false)
              }
            }}
          />
        )}

        {/* Info Section */}
        <Card className="mt-6 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Why Verification is Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Platform Safety</h4>
                <p>
                  Verification helps us maintain a safe and secure platform for all users by ensuring real identities.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Unlock Features</h4>
                <p>
                  Verified accounts can create posts, subscribe to creators, book appointments, and access all platform features.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Trust & Security</h4>
                <p>
                  Building trust between creators and subscribers through verified identities ensures better interactions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Payment Processing</h4>
                <p>
                  Verification is required for payment processing and financial transactions on the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

