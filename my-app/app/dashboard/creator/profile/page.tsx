'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload'

export default function CreatorProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<any>(null)
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Creator Profile</h1>

        {/* Profile Image Upload */}
        <div className="mb-6">
          <ProfileImageUpload
            currentImage={profile.profileImage || profile.image}
            onImageUpdate={(imageUrl) => {
              setFormData({ ...formData, profileImage: imageUrl })
              setProfile({ ...profile, profileImage: imageUrl, image: imageUrl })
            }}
          />
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg h-32"
            />
            <input
              type="number"
              placeholder="Hourly Rate"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <div className="flex gap-4">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.profileImage || profile.image ? (
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
                  <img
                    src={profile.profileImage || profile.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-gray-600">Name</p>
              <p className="text-lg font-semibold">{profile.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Bio</p>
              <p className="text-lg">{profile.bio || 'No bio added'}</p>
            </div>
            <div>
              <p className="text-gray-600">Hourly Rate</p>
              <p className="text-lg font-semibold">${profile.hourlyRate || 0}/month</p>
            </div>
            <div>
              <p className="text-gray-600">KYC Status</p>
              <p className={`text-lg font-semibold ${
                profile.kycStatus === 'VERIFIED' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {profile.kycStatus}
              </p>
            </div>

            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
