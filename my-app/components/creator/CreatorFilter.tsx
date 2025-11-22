'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'

interface CreatorFiltersProps {
  onSearchChange: (search: string) => void
  onSortChange: (sort: string) => void
  initialSearch?: string
  initialSort?: string
}

export function CreatorFilters({
  onSearchChange,
  onSortChange,
  initialSearch = '',
  initialSort = 'newest',
}: CreatorFiltersProps) {
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState(initialSort)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    onSearchChange(value)
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    onSortChange(value)
  }

  const handleClearSearch = () => {
    setSearch('')
    onSearchChange('')
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Creators
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, bio..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sort Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
