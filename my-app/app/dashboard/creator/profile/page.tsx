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
import { PostCreation } from '@/components/posts/PostCreation'

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
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set())

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    )
  }

  const profileImage = profile.profileImage || profile.image

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Cover Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Profile Image */}
            <div className="relative">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {profileImage ? (
                      profileImage.startsWith('/') ? (
                        failedImageUrls.has(profileImage) ? (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-3xl md:text-4xl font-bold text-gray-600">
                              {profile.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={profileImage}
                            alt={profile.name || 'Profile'}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              // Only log once to prevent infinite loop
                              if (!failedImageUrls.has(profileImage)) {
                                console.error('roy: Profile image load error for local path:', profileImage)
                                setFailedImageUrls(prev => new Set(prev).add(profileImage))
                              }
                              e.currentTarget.onerror = null
                              e.currentTarget.style.display = 'none'
                            }}
                            onLoad={() => {
                              // Clear from failed list on successful load
                              setFailedImageUrls(prev => {
                                if (prev.has(profileImage)) {
                                  const next = new Set(prev)
                                  next.delete(profileImage)
                                  return next
                                }
                                return prev
                              })
                            }}
                          />
                        )
                      ) : failedImageUrls.has(profileImage) ? (
                    // Show placeholder if image failed to load (prevents infinite loop)
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-3xl md:text-4xl font-bold text-gray-600">
                        {profile.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={profileImage}
                      alt={profile.name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Only log and track error once per URL to prevent infinite loop
                        if (!failedImageUrls.has(profileImage)) {
                          console.error('roy: Profile image load error for URL:', profileImage)
                          console.error('roy: This usually means the S3 bucket does not allow public read access. See S3_PUBLIC_ACCESS_SETUP.md')
                          setFailedImageUrls(prev => new Set(prev).add(profileImage))
                        }
                        // Stop trying to load this image
                        e.currentTarget.onerror = null
                        e.currentTarget.src = ''
                      }}
                      onLoad={() => {
                        console.log('roy: Profile image loaded successfully')
                        // Clear from failed list if it loads successfully
                        setFailedImageUrls(prev => {
                          if (prev.has(profileImage)) {
                            const next = new Set(prev)
                            next.delete(profileImage)
                            return next
                          }
                          return prev
                        })
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-gray-600">
                      {profile.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              {/* Upload Button */}
              <div className="absolute -bottom-1 -right-1">
                <ProfileImageUpload
                  currentImage={profileImage}
                  onImageUpdate={(imageUrl) => {
                    setFormData({ ...formData, profileImage: imageUrl })
                    setProfile({ ...profile, profileImage: imageUrl, image: imageUrl })
                  }}
                />
              </div>
            </div>

            {/* Profile Header Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {profile.name || 'Creator'}
                    </h1>
                    {profile.kycStatus === 'VERIFIED' && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {profile.bio || 'No bio added yet'}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? 'outline' : 'default'}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Post Creation - Only show when not editing */}
        {!isEditing && (
          <div className="mb-6">
            <PostCreation
              onPostCreated={() => {
                // Optionally refresh posts list or show success message
                console.log('roy: Post created successfully')
              }}
            />
          </div>
        )}

        {/* Stats Card */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.subscribers}</span>
                </div>
                <p className="text-gray-600 text-sm">Subscribers</p>
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-pink-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.messages}</span>
                </div>
                <p className="text-gray-600 text-sm">Messages</p>
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">${profile.hourlyRate || 0}</span>
                </div>
                <p className="text-gray-600 text-sm">Monthly Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form or Profile Details */}
        {isEditing ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Bio</label>
                <textarea
                  placeholder="Tell your subscribers about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Monthly Subscription Rate ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm mb-1">Name</p>
                <p className="text-gray-900 text-lg font-semibold">{profile.name || 'Not set'}</p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm mb-1">Bio</p>
                <p className="text-gray-900">{profile.bio || 'No bio added yet'}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-1">Monthly Subscription Rate</p>
                <p className="text-gray-900 text-2xl font-bold">${profile.hourlyRate || 0}/month</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-1">KYC Verification Status</p>
                <div className="flex items-center gap-2">
                  {profile.kycStatus === 'VERIFIED' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-semibold">Verified</span>
                    </>
                  ) : profile.kycStatus === 'PENDING' ? (
                    <>
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-600 font-semibold">Pending Verification</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-semibold">Not Verified</span>
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
