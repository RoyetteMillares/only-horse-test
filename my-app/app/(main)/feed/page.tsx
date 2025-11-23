'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2, Lock, MoreHorizontal, ImageIcon, Video, DollarSign, Type } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FeedSidebar } from '@/components/feed/FeedSidebar'
import { FeedRightSidebar } from '@/components/feed/FeedRightSidebar'
import { PostCreation } from '@/components/posts/PostCreation'

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
    // Creators can always view their own posts
    if (session?.user?.role === 'CREATOR' && session.user.id === creatorId) {
      return true
    }
    return subscriptions.some(
      (sub) => sub.creatorId === creatorId && sub.status === 'ACTIVE'
    )
  }

  const handleSubscribe = (creatorId: string) => {
    router.push(`/creator/${creatorId}`)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <FeedSidebar />

      {/* Center Content */}
      <main className="flex-1 ml-64 mr-80 bg-white min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">HOME</h1>
        </header>

        {/* Content Area */}
        <div className="max-w-2xl mx-auto px-6 py-6">
          {activeTab === 'feed' ? (
            <div className="space-y-6">
              {/* Compose New Post Section */}
              {session?.user?.role === 'CREATOR' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <PostCreation onPostCreated={() => {
                    fetchFeed()
                    setActiveTab('feed')
                  }} />
                </div>
              )}

              {/* Alternative Compose Section for Non-Creators */}
              {session?.user?.role !== 'CREATOR' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <textarea
                    placeholder="Compose new post..."
                    className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    readOnly
                  />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Video className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Type className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        All
                      </button>
                    </div>
                  </div>
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
                  const isOwnPost = session?.user?.role === 'CREATOR' && session.user.id === post.creatorId
                  const canView = !post.isSubscriberOnly || subscribed || isOwnPost

                  return (
                    <Card key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                      {/* Post Header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          {post.creatorImage ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              {post.creatorImage.startsWith('/') ? (
                                <Image
                                  src={post.creatorImage}
                                  alt={post.creatorName}
                                  width={48}
                                  height={48}
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
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-lg">
                                {post.creatorName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">{post.creatorName}</span>
                              {post.isSubscriberOnly && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                  Subscriber Only
                                </span>
                              )}
                              {!post.isSubscriberOnly && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  Free
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{post.creatorName.toLowerCase().replace(/\s+/g, '_')} • {formatTimeAgo(post.createdAt)}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Post Content/Caption */}
                      {post.content && (
                        <div className="px-4 pb-3">
                          {canView || isOwnPost ? (
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>
                          ) : (
                            <p className="text-gray-500 leading-relaxed whitespace-pre-wrap italic">
                              {post.content.length > 100
                                ? post.content.substring(0, 100) + '...'
                                : post.content}
                              <span className="block mt-2 text-sm text-gray-400">
                                Subscribe to unlock full content
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Post Media */}
                      <div className="relative">
                        {/* Show media with blur/overlay if locked */}
                        {(post.imageUrl || post.videoUrl) && !canView && !isOwnPost ? (
                          <div className="relative w-full aspect-[4/3] bg-gray-900 overflow-hidden">
                            {/* Blurred media preview */}
                            {post.imageUrl && (
                              <div className="relative w-full h-full blur-md scale-110 opacity-50">
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
                            )}
                            {post.videoUrl && !post.imageUrl && (
                              <div className="relative w-full h-full blur-md scale-110 opacity-50 bg-gray-800" />
                            )}

                            {/* Lock overlay - OnlyFans style */}
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 max-w-md w-full border border-white/10 shadow-2xl">
                                <div className="flex flex-col items-center text-center">
                                  <Lock className="w-16 h-16 text-blue-400 mb-6" />
                                  <div className="text-white text-2xl font-bold mb-4">
                                    Subscriber Only
                                  </div>
                                  <p className="text-white/90 text-center mb-8 text-base leading-relaxed px-4">
                                    Subscribe to {post.creatorName} to unlock this post and view exclusive content.
                                  </p>
                                  <Button
                                    onClick={() => handleSubscribe(post.creatorId)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold rounded-lg transition-colors shadow-lg"
                                  >
                                    Subscribe for ${getCreatorPrice(post.creatorId).toFixed(2)}/mo
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : post.imageUrl && (canView || isOwnPost) ? (
                          <div className="relative w-full bg-black">
                            <div className="relative aspect-[4/3] bg-gray-900">
                              {post.imageUrl.startsWith('/') ? (
                                <Image
                                  src={post.imageUrl}
                                  alt={post.content}
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <img
                                  src={post.imageUrl}
                                  alt={post.content}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          </div>
                        ) : post.videoUrl && (canView || isOwnPost) ? (
                          <div className="relative w-full bg-black">
                            <div className="relative aspect-video bg-black">
                              <video
                                src={post.videoUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Engagement Bar */}
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 hover:opacity-70 transition-opacity">
                            <Heart className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 hover:opacity-70 transition-opacity">
                            <MessageCircle className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">{post.comments}</span>
                          </button>
                        </div>
                        <button className="hover:opacity-70 transition-opacity">
                          <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
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
        </div>
      </main>

      {/* Right Sidebar */}
      <FeedRightSidebar creators={creators} />
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }
}

