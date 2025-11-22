'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
  }, [sessionStatus, router])

  useEffect(() => {
    if (session?.user) {
      setKycStatus(session.user.kycStatus || 'NOT_STARTED')
    }
  }, [session])

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

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const currentStatus = kycStatus || session?.user?.kycStatus || 'NOT_STARTED'

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

        {/* Verification Status Banner */}
        <div className="mb-6">
          <VerificationBanner />
        </div>

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
              <p className="text-sm text-yellow-700">
                We typically verify accounts within 24-48 hours. You'll receive an email notification once your verification is complete.
              </p>
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

        {/* Verification Wizard - Show for NOT_STARTED or REJECTED */}
        {(currentStatus === 'NOT_STARTED' || currentStatus === 'REJECTED') && (
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
                  throw new Error(errorData.error || 'Failed to submit verification')
                }

                // Refresh session
                handleKYCSubmitted()
              } catch (error: any) {
                console.error('roy: Verification submission error:', error)
                alert(error.message || 'Failed to submit verification')
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

