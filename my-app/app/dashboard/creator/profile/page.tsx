'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit2, Users, MessageCircle, DollarSign, CheckCircle2, Clock, Camera } from 'lucide-react'
import Image from 'next/image'

export default function CreatorProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ subscribers: 0, messages: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    hourlyRate: 0,
    profileImage: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile')
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          hourlyRate: data.hourlyRate || 0,
          profileImage: data.profileImage || data.image || '',
        })

        // Extract stats from profile data
        if (data._count) {
          setStats({
            subscribers: data._count.subscriptions || 0,
            messages: data._count.receivedMessages || 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          hourlyRate: formData.hourlyRate,
          profileImage: formData.profileImage,
        }),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      const updated = await response.json()
      setProfile(updated)
      setIsEditing(false)
      
      // Refresh session to update header
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f23]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const profileImage = profile.profileImage || profile.image

  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <DashboardHeader />
      
      {/* Cover Image Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0f23] to-transparent"></div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-24 pb-12">
        {/* Profile Header Card */}
        <Card className="bg-[#1a1a2e] border-[#2d2d44] shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#0f0f23] shadow-xl">
                    {profileImage ? (
                      profileImage.startsWith('/') ? (
                        <Image
                          src={profileImage}
                          alt={profile.name || 'Profile'}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('roy: Profile image load error')
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <img
                          src={profileImage}
                          alt={profile.name || 'Profile'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('roy: Profile image load error')
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-4xl md:text-5xl font-bold text-white">
                          {profile.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {/* Upload Button - Always Visible */}
                  <div className="absolute -bottom-2 -right-2">
                    <ProfileImageUpload
                      currentImage={profileImage}
                      onImageUpdate={(imageUrl) => {
                        setFormData({ ...formData, profileImage: imageUrl })
                        setProfile({ ...profile, profileImage: imageUrl, image: imageUrl })
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        {profile.name || 'Creator'}
                      </h1>
                      {profile.kycStatus === 'VERIFIED' && (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      {profile.bio || 'No bio added yet'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#16213e] rounded-lg p-4 border border-[#2d2d44]">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span className="text-2xl font-bold text-white">{stats.subscribers}</span>
                    </div>
                    <p className="text-gray-400 text-sm">Subscribers</p>
                  </div>
                  <div className="bg-[#16213e] rounded-lg p-4 border border-[#2d2d44]">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-5 h-5 text-pink-400" />
                      <span className="text-2xl font-bold text-white">{stats.messages}</span>
                    </div>
                    <p className="text-gray-400 text-sm">Messages</p>
                  </div>
                  <div className="bg-[#16213e] rounded-lg p-4 border border-[#2d2d44]">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-2xl font-bold text-white">${profile.hourlyRate || 0}</span>
                    </div>
                    <p className="text-gray-400 text-sm">Monthly Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form or Profile Details */}
        {isEditing ? (
          <Card className="mt-6 bg-[#1a1a2e] border-[#2d2d44]">
            <CardHeader>
              <CardTitle className="text-white">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#16213e] border-[#2d2d44] text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Bio</label>
                <textarea
                  placeholder="Tell your subscribers about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full min-h-[120px] px-4 py-3 bg-[#16213e] border border-[#2d2d44] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Monthly Subscription Rate ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="bg-[#16213e] border-[#2d2d44] text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-[#2d2d44] text-gray-300 hover:bg-[#16213e]"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-6 bg-[#1a1a2e] border-[#2d2d44]">
            <CardHeader>
              <CardTitle className="text-white">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Name</p>
                <p className="text-white text-lg font-semibold">{profile.name || 'Not set'}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Bio</p>
                <p className="text-white">{profile.bio || 'No bio added yet'}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Monthly Subscription Rate</p>
                <p className="text-white text-2xl font-bold">${profile.hourlyRate || 0}/month</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">KYC Verification Status</p>
                <div className="flex items-center gap-2">
                  {profile.kycStatus === 'VERIFIED' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Verified</span>
                    </>
                  ) : profile.kycStatus === 'PENDING' ? (
                    <>
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">Pending Verification</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 font-semibold">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
