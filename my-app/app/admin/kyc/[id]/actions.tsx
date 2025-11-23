'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { approveKYC, rejectKYC } from '@/app/actions/kyc'

export function KYCActionButtons({ kycId }: { kycId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [isRejectOpen, setIsRejectOpen] = useState(false)

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this user? They will immediately become a Creator.')) return

        setLoading(true)
        try {
            const res = await approveKYC(kycId)
            if (res.error) throw new Error(res.error)

            toast.success('KYC Approved Successfully')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setLoading(true)
        try {
            const res = await rejectKYC(kycId, rejectReason)
            if (res.error) throw new Error(res.error)

            toast.success('KYC Rejected')
            setIsRejectOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex space-x-4">
            <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approve Application
            </Button>

            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" disabled={loading} className="w-full sm:w-auto">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject KYC Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this application. This will be sent to the user via email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g., ID photo is blurry, Name does not match ID..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={loading || !rejectReason.trim()}
                        >
                            {loading ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
