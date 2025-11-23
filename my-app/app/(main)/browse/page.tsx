'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CreatorFilters } from '@/components/creator/CreatorFilter'
import { CreatorGrid } from '@/components/creator/CreatorGrid'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default function BrowseCreatorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleSubscribe = async (creatorId: string) => {
    try {
      // Redirect to subscription page or show modal
      router.push(`/dashboard/subscriber/creator/${creatorId}`)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Browse Creators</h1>
              <p className="text-gray-600">
                Find and connect with amazing creators
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <CreatorFilters
          initialSearch={search}
          initialSort={sort}
          onSearchChange={setSearch}
          onSortChange={setSort}
        />

        {/* Creators Grid */}
        <CreatorGrid
          search={search}
          sortBy={sort}
          onSubscribe={handleSubscribe}
        />
      </div>
    </div>
  )
}
