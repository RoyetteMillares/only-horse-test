'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2, Lock, MoreHorizontal, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Post {
  id: string
  creatorId: string
  creatorName: string
  creatorImage: string | null
  content: string
  imageUrl?: string | null
  videoUrl?: string | null
  isSubscriberOnly: boolean
  likes: number
  comments: number
  createdAt: string
}

interface Subscription {
  creatorId: string
  status: string
  price?: number
}

interface Creator {
  id: string
  name: string | null
  image: string | null
  hourlyRate: number
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'feed' | 'bookings'>('feed')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchFeed()
      fetchSubscriptions()
      fetchCreators()
    }
  }, [session])

  const fetchFeed = async () => {
    try {
      // TODO: Replace with actual API endpoint when Post model is added
      // For now, using mock data structure
      const response = await fetch('/api/feed')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      } else {
        // Mock data for development
        setPosts([
          {
            id: '1',
            creatorId: 'creator1',
            creatorName: 'Aiko Tanaka',
            creatorImage: null,
            content: 'Exclusive behind the scenes from my latest photoshoot. Subscribe to see the full set! 📸',
            imageUrl: null,
            isSubscriberOnly: true,
            likes: 56,
            comments: 3,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          },
          {
            id: '2',
            creatorId: 'creator1',
            creatorName: 'Aiko Tanaka',
            creatorImage: null,
            content: 'New video coming soon! Stay tuned ✨',
            videoUrl: null,
            isSubscriberOnly: false,
            likes: 124,
            comments: 12,
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
        ])
      }
    } catch (error) {
      console.error('roy: Error fetching feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions/my-subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('roy: Error fetching subscriptions:', error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/creators/list?limit=5&sortBy=popular')
      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
      }
    } catch (error) {
      console.error('roy: Error fetching creators:', error)
    }
  }

  const getCreatorPrice = (creatorId: string) => {
    const creator = creators.find((c) => c.id === creatorId)
    return creator?.hourlyRate || 9.99
  }

  const isSubscribed = (creatorId: string) => {
    return subscriptions.some(
      (sub) => sub.creatorId === creatorId && sub.status === 'ACTIVE'
    )
  }

  const handleSubscribe = (creatorId: string) => {
    router.push(`/dashboard/subscriber/creator/${creatorId}`)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-2xl font-bold text-purple-600">
                MuseDate
              </Link>
              
              {/* Tabs */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'feed'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Feed
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'bookings'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Bookings
                </button>
              </div>
            </div>

            {/* User Profile */}
            {session?.user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {session.user.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">Fan Account</div>
                </div>
                {session.user.image ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300">
                    {session.user.image.startsWith('/') ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'Profile'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'feed' ? (
          <div className="space-y-6">
            {/* Creator Avatars Row */}
            {creators.length > 0 && (
              <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                {creators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/dashboard/subscriber/creator/${creator.id}`}
                    className="flex flex-col items-center space-y-2 flex-shrink-0"
                  >
                    {creator.image ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                        {creator.image.startsWith('/') ? (
                          <Image
                            src={creator.image}
                            alt={creator.name || 'Creator'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <img
                            src={creator.image}
                            alt={creator.name || 'Creator'}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-300">
                        <span className="text-gray-600 font-medium text-lg">
                          {creator.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600 text-center max-w-[64px] truncate">
                      {creator.name || 'Creator'}
                    </span>
                  </Link>
                ))}
                {/* Placeholder users */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="flex flex-col items-center space-y-2 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-gray-400 text-xs">User {i + 1}</span>
                    </div>
                    <span className="text-xs text-gray-400">User {i + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No posts yet. Follow creators to see their content!</p>
              </div>
            ) : (
              posts.map((post) => {
                const subscribed = isSubscribed(post.creatorId)
                const canView = !post.isSubscriberOnly || subscribed

                return (
                  <Card key={post.id} className="bg-white border border-gray-200 shadow-sm">
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {post.creatorImage ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            {post.creatorImage.startsWith('/') ? (
                              <Image
                                src={post.creatorImage}
                                alt={post.creatorName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <img
                                src={post.creatorImage}
                                alt={post.creatorName}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {post.creatorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{post.creatorName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded-full">
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="relative">
                      {post.imageUrl && canView ? (
                        <div className="relative w-full aspect-square bg-gray-100">
                          {post.imageUrl.startsWith('/') ? (
                            <Image
                              src={post.imageUrl}
                              alt={post.content}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <img
                              src={post.imageUrl}
                              alt={post.content}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : post.videoUrl && canView ? (
                        <div className="relative w-full aspect-video bg-black">
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                              <div className="text-sm mb-2">Video Player Placeholder</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full aspect-square bg-gray-900">
                          {!canView && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-8">
                              <Lock className="w-12 h-12 text-white mb-4" />
                              <div className="text-white text-xl font-semibold mb-2">
                                Subscriber Only
                              </div>
                              <p className="text-white/80 text-center mb-6 max-w-sm">
                                Subscribe to {post.creatorName} to unlock this post and view exclusive content.
                              </p>
                              <Button
                                onClick={() => handleSubscribe(post.creatorId)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                Subscribe for ${getCreatorPrice(post.creatorId).toFixed(2)}/mo
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Engagement Bar */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 hover:opacity-70">
                          <Heart className="w-6 h-6 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 hover:opacity-70">
                          <MessageCircle className="w-6 h-6 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">{post.comments}</span>
                        </button>
                      </div>
                      <button className="hover:opacity-70">
                        <Share2 className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>

                    {/* Caption */}
                    <div className="p-4">
                      <p className="text-gray-900">
                        <span className="font-semibold mr-2">{post.creatorName}</span>
                        {canView ? post.content : 'Exclusive content - Subscribe to view'}
                      </p>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">My Bookings page coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}

