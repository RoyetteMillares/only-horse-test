'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Star } from 'lucide-react'

interface CreatorCardProps {
  id: string
  name: string
  image?: string
  bio?: string
  hourlyRate: number
  subscriptionCount: number
  messageCount: number
  isSubscribed?: boolean
  onSubscribe?: () => void
}

export function CreatorCard({
  id,
  name,
  image,
  bio,
  hourlyRate,
  subscriptionCount,
  messageCount,
  isSubscribed,
  onSubscribe,
}: CreatorCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">
                {name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Stats Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-4">
            <div className="text-center text-white">
              <Star className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">{subscriptionCount}</p>
              <p className="text-xs text-gray-300">Subscribers</p>
            </div>
            <div className="w-px h-16 bg-white/30"></div>
            <div className="text-center text-white">
              <MessageCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">{messageCount}</p>
              <p className="text-xs text-gray-300">Messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg truncate">{name}</h3>

        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {bio || 'No bio added yet'}
        </p>

        {/* Rating or Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">4.9</span>
            <span className="text-xs text-gray-500">({subscriptionCount})</span>
          </div>
          <p className="text-lg font-bold text-blue-600">
            ${hourlyRate}/mo
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <Button
            onClick={() => router.push(`/dashboard/subscriber/creator/${id}`)}
            className="w-full"
            size="sm"
          >
            View Profile
          </Button>

          {!isSubscribed ? (
            <Button
              onClick={onSubscribe}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Subscribe
            </Button>
          ) : (
            <Button variant="outline" className="w-full" size="sm" disabled>
              ✓ Subscribed
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
