'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, Shield, Users, FileWarning, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

// Admin dashboard page - overview and quick stats
// — Royette
export default function AdminDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    totalUsers: 0,
    totalCreators: 0,
    activeReports: 0,
  })
  const [loading, setLoading] = useState(true)

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

      fetchStats()
    }
  }, [sessionStatus, session, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // Fetch pending verifications count
      const verificationsRes = await fetch('/api/admin/kyc/pending')
      if (verificationsRes.ok) {
        const verificationsData = await verificationsRes.json()
        setStats((prev) => ({
          ...prev,
          pendingVerifications: verificationsData.count || 0,
        }))
      }
      
      // TODO: Fetch other stats (users, creators, reports) when endpoints are ready
      // For now, we'll just show pending verifications
    } catch (error: any) {
      console.error('roy: Error fetching admin stats:', error)
      toast.error('Failed to load statistics', {
        description: error.message || 'Please try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading admin dashboard...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Overview of platform activity and moderation tasks
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending Verifications */}
            <Link href="/dashboard/admin/verifications">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Pending Verifications
                    </CardTitle>
                    <Shield className="w-5 h-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats.pendingVerifications}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    KYC submissions awaiting review
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Total Users */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Users
                  </CardTitle>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalUsers || '—'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Registered users
                </p>
              </CardContent>
            </Card>

            {/* Total Creators */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Creators
                  </CardTitle>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.totalCreators || '—'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Verified creators
                </p>
              </CardContent>
            </Card>

            {/* Active Reports */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Reports
                  </CardTitle>
                  <FileWarning className="w-5 h-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats.activeReports || '—'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Reports requiring action
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Verifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <span>Pending Verifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {stats.pendingVerifications} submissions pending review
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Review and approve/reject KYC submissions
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                  <Link href="/dashboard/admin/verifications">
                    <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                      Review Verifications
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Platform Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                  <span>Platform Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Users</span>
                    <span className="font-medium text-gray-900">
                      {stats.totalUsers || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Verified Creators</span>
                    <span className="font-medium text-gray-900">
                      {stats.totalCreators || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending Actions</span>
                    <span className="font-medium text-yellow-600">
                      {stats.pendingVerifications + (stats.activeReports || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

