'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Creator {
  id: string
  name: string | null
  image: string | null
  hourlyRate: number
}

interface FeedRightSidebarProps {
  creators?: Creator[]
}

export function FeedRightSidebar({ creators = [] }: FeedRightSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 overflow-y-auto z-40">
      <div className="p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search posts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 rounded-lg"
          />
        </div>

        {/* Suggestions Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">SUGGESTIONS</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center space-x-1">
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Creators */}
        <div className="space-y-4">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/dashboard/subscriber/creator/${creator.id}`}
              className="block group"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                {creator.image ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    {creator.image.startsWith('/') ? (
                      <Image
                        src={creator.image}
                        alt={creator.name || 'Creator'}
                        width={64}
                        height={64}
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
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-medium text-lg">
                      {creator.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {creator.name || 'Creator'}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${creator.hourlyRate?.toFixed(2) || '0.00'}/mo
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Free
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination Dots */}
        {creators.length > 0 && (
          <div className="flex justify-center space-x-1 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === 0 ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Footer Links */}
        <div className="pt-6 border-t border-gray-200 space-y-2">
          <Link
            href="/privacy"
            className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/cookies"
            className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cookie Notice
          </Link>
          <Link
            href="/terms"
            className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </aside>
  )
}

