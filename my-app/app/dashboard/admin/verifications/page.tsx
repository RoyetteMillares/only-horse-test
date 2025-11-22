'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Shield, Clock, CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface KYCSubmission {
  id: string
  userId: string
  userEmail: string | null
  userName: string | null
  userRole: string
  firstName: string
  lastName: string
  dateOfBirth: string
  governmentIdType: string
  governmentIdNumber: string
  governmentIdImageUrl: string
  governmentIdBackUrl: string | null
  livelinessImageUrl: string
  status: string
  submittedAt: string
  userCreatedAt: string
}

// Admin verification review page - for reviewing and approving/rejecting KYC submissions
// — Royette
export default function AdminVerificationsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (sessionStatus === 'authenticated' && session?.user) {
      // Check if user is admin
      if (session.user.role !== 'ADMIN') {
        toast.error('Access denied', {
          description: 'Admin access required to view this page.',
        })
        router.push('/dashboard')
        return
      }

      fetchSubmissions()
    }
  }, [sessionStatus, session, router])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/kyc/pending')
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied', {
            description: 'Admin access required.',
          })
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch submissions')
      }
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error: any) {
      console.error('roy: Error fetching submissions:', error)
      toast.error('Failed to load submissions', {
        description: error.message || 'Please try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      setProcessing(submissionId)
      const response = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to approve submission')
      }

      toast.success('Submission approved', {
        description: 'User has been verified successfully.',
      })

      // Refresh submissions list
      await fetchSubmissions()
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null)
      }
    } catch (error: any) {
      console.error('roy: Error approving submission:', error)
      toast.error('Failed to approve submission', {
        description: error.message || 'Please try again later.',
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      toast.error('Rejection reason required', {
        description: 'Please provide a reason for rejection.',
      })
      return
    }

    try {
      setProcessing(selectedSubmission.id)
      const response = await fetch('/api/admin/kyc/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          rejectionReason: rejectionReason.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to reject submission')
      }

      toast.success('Submission rejected', {
        description: 'User has been notified of the rejection.',
      })

      // Close dialog and refresh
      setRejectDialogOpen(false)
      setRejectionReason('')
      setSelectedSubmission(null)
      await fetchSubmissions()
    } catch (error: any) {
      console.error('roy: Error rejecting submission:', error)
      toast.error('Failed to reject submission', {
        description: error.message || 'Please try again later.',
      })
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      {/* Main Content with Sidebar Offset */}
      <div className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">KYC Verification Review</h1>
          </div>
          <p className="text-gray-600">
            Review and approve or reject identity verification submissions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{submissions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No pending submissions</p>
              <p className="text-gray-500 text-sm mt-2">
                All verification requests have been reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {submission.firstName} {submission.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {submission.userEmail || 'No email'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Role: {submission.userRole} • Submitted: {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">ID Type:</span>{' '}
                      <span className="font-medium">{submission.governmentIdType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date of Birth:</span>{' '}
                      <span className="font-medium">
                        {formatDate(submission.dateOfBirth)} (Age: {calculateAge(submission.dateOfBirth)})
                      </span>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(submission.id)}
                        disabled={processing === submission.id}
                      >
                        {processing === submission.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setRejectDialogOpen(true)
                        }}
                        disabled={processing === submission.id}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        {selectedSubmission && (
          <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Review Submission: {selectedSubmission.firstName} {selectedSubmission.lastName}
                </DialogTitle>
                <DialogDescription>
                  Review all submitted documents and information before making a decision.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>{' '}
                      <span className="font-medium">
                        {selectedSubmission.firstName} {selectedSubmission.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{selectedSubmission.userEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>{' '}
                      <span className="font-medium">{selectedSubmission.userRole}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date of Birth:</span>{' '}
                      <span className="font-medium">
                        {formatDate(selectedSubmission.dateOfBirth)} (Age:{' '}
                        {calculateAge(selectedSubmission.dateOfBirth)})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">ID Type:</span>{' '}
                      <span className="font-medium">{selectedSubmission.governmentIdType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ID Number:</span>{' '}
                      <span className="font-medium">{selectedSubmission.governmentIdNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted:</span>{' '}
                      <span className="font-medium">{formatDate(selectedSubmission.submittedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Created:</span>{' '}
                      <span className="font-medium">{formatDate(selectedSubmission.userCreatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Government ID Front */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Government ID (Front)
                      </label>
                      {selectedSubmission.governmentIdImageUrl ? (
                        <div className="relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                          {selectedSubmission.governmentIdImageUrl.startsWith('/') ? (
                            <Image
                              src={selectedSubmission.governmentIdImageUrl}
                              alt="Government ID Front"
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <img
                              src={selectedSubmission.governmentIdImageUrl}
                              alt="Government ID Front"
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No image available</p>
                      )}
                    </div>

                    {/* Government ID Back (if available) */}
                    {selectedSubmission.governmentIdBackUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Government ID (Back)
                        </label>
                        <div className="relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                          {selectedSubmission.governmentIdBackUrl.startsWith('/') ? (
                            <Image
                              src={selectedSubmission.governmentIdBackUrl}
                              alt="Government ID Back"
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <img
                              src={selectedSubmission.governmentIdBackUrl}
                              alt="Government ID Back"
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selfie/Liveness */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Selfie Verification
                      </label>
                      {selectedSubmission.livelinessImageUrl ? (
                        <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                          {selectedSubmission.livelinessImageUrl.startsWith('/') ? (
                            <Image
                              src={selectedSubmission.livelinessImageUrl}
                              alt="Selfie"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <img
                              src={selectedSubmission.livelinessImageUrl}
                              alt="Selfie"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No image available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                  disabled={!!processing}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setRejectDialogOpen(true)
                  }}
                  disabled={processing === selectedSubmission.id}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedSubmission.id)}
                  disabled={processing === selectedSubmission.id}
                >
                  {processing === selectedSubmission.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Verification</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. This will be sent to the user.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={!!processing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  )
}

