'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreatorCard } from './CreatorCard'
import { Button } from '@/components/ui/button'
import { Loader } from 'lucide-react'

interface Creator {
  id: string
  name: string
  image?: string
  bio?: string
  hourlyRate: number
  _count: {
    subscriptions: number
    receivedMessages: number
  }
  createdAt: string
}

interface CreatorGridProps {
  search?: string
  sortBy?: string
  onSubscribe?: (creatorId: string) => void
}

export function CreatorGrid({
  search = '',
  sortBy = 'newest',
  onSubscribe,
}: CreatorGridProps) {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchCreators = useCallback(
    async (pageNum: number) => {
      try {
        if (pageNum === 1) {
          setLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '12',
          search,
          sortBy,
        })

        const response = await fetch(`/api/creators/list?${params}`)
        const data = await response.json()

        if (pageNum === 1) {
          setCreators(data.creators)
        } else {
          setCreators((prev) => [...prev, ...data.creators])
        }

        setHasMore(data.pagination.hasMore)
      } catch (error) {
        console.error('Error fetching creators:', error)
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    },
    [search, sortBy]
  )

  useEffect(() => {
    setPage(1)
    fetchCreators(1)
  }, [search, sortBy, fetchCreators])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchCreators(nextPage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (creators.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No creators found. Try adjusting your search.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {creators.map((creator) => (
          <CreatorCard
            key={creator.id}
            id={creator.id}
            name={creator.name || 'Unknown'}
            image={creator.image}
            bio={creator.bio}
            hourlyRate={creator.hourlyRate || 0}
            subscriptionCount={creator._count.subscriptions}
            messageCount={creator._count.receivedMessages}
            onSubscribe={() => onSubscribe?.(creator.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Creators'}
          </Button>
        </div>
      )}
    </div>
  )
}
