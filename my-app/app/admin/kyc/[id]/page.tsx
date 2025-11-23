import { db } from '@/lib/db'
import { getDownloadUrl } from '@/lib/s3'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { KYCActionButtons } from './actions'

// Helper to extract key from full URL if needed, or use as is
function getKeyFromUrl(url: string) {
    try {
        // If it's a full URL, try to extract the key
        // But our DB might store the full URL or just the key depending on implementation
        // The previous implementation of submit route stored: constructS3Url(key)
        // So it stores the FULL URL.
        // We need to extract the key to sign it again? 
        // Wait, constructS3Url returns a public URL if the bucket is public, 
        // OR it returns a URL that might not be signed.
        // BUT the requirements said "Private S3 bucket".
        // If the bucket is private, `constructS3Url` returning a simple https link WON'T work for viewing.
        // We need to generate a signed URL for viewing.

        // Let's assume the DB stores the full URL like: https://bucket.s3.region.amazonaws.com/kyc/user/timestamp.jpg
        // We need to extract: kyc/user/timestamp.jpg
        const urlObj = new URL(url)
        // pathname starts with /, so slice(1)
        return urlObj.pathname.slice(1)
    } catch (e) {
        // If it's not a URL, assume it's the key
        return url
    }
}

export default async function KYCDetailPage({ params }: { params: { id: string } }) {
    const kyc = await db.kYCSubmission.findUnique({
        where: { id: params.id },
        include: { user: true },
    })

    if (!kyc) return notFound()

    // Generate signed URLs for secure viewing
    // Note: We need to extract the S3 Key from the stored URL
    const idKey = getKeyFromUrl(kyc.governmentIdImageUrl)
    const selfieKey = getKeyFromUrl(kyc.livelinessImageUrl)

    const idSignedUrl = await getDownloadUrl(idKey)
    const selfieSignedUrl = await getDownloadUrl(selfieKey)

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <Link href="/admin/kyc" className="flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {kyc.firstName} {kyc.lastName}
                    </h1>
                    <p className="text-gray-500 mt-1">Submitted on {format(new Date(kyc.createdAt), 'PPP p')}</p>
                </div>
                <Badge className={
                    kyc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        kyc.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                }>
                    {kyc.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Info */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Applicant Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Full Name</label>
                            <p>{kyc.firstName} {kyc.lastName}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                            <p>{format(new Date(kyc.dateOfBirth), 'PPP')}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="break-all">{kyc.user.email}</p>
                        </div>
                        <Separator />
                        <div>
                            <label className="text-sm font-medium text-gray-500">ID Type</label>
                            <p>{kyc.governmentIdType.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">ID Number</label>
                            <p>{kyc.governmentIdNumber}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div>
                            <h3 className="font-medium mb-3 flex items-center">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">1</span>
                                Government ID
                            </h3>
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                <img
                                    src={idSignedUrl}
                                    alt="Government ID"
                                    className="w-full h-auto max-h-[400px] object-contain"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-3 flex items-center">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">2</span>
                                Selfie / Liveliness
                            </h3>
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                <img
                                    src={selfieSignedUrl}
                                    alt="Selfie"
                                    className="w-full h-auto max-h-[400px] object-contain"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            {kyc.status === 'PENDING' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review Decision</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <KYCActionButtons kycId={kyc.id} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
