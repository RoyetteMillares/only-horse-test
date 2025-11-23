import { db } from '@/lib/db'
import { format } from 'date-fns'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminKYCPage() {
    const pendingSubmissions = await db.kYCSubmission.findMany({
        where: {
            status: 'PENDING',
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                    {pendingSubmissions.length} Pending
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingSubmissions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No pending KYC submissions found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Submitted At</TableHead>
                                    <TableHead>ID Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingSubmissions.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {submission.firstName} {submission.lastName}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {submission.user.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {submission.governmentIdType.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                {submission.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/kyc/${submission.id}`}>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Review
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
