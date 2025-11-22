'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Camera, Clock } from 'lucide-react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

interface ProfileImageUploadProps {
  currentImage?: string | null
  onImageUpdate?: (imageUrl: string) => void
}

// Profile image upload component with preview
// — Royette
export function ProfileImageUpload({
  currentImage,
  onImageUpdate,
}: ProfileImageUploadProps) {
  const { update: updateSession } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image (tries S3 first, falls back to local storage if S3 not configured)
    setIsUploading(true)
    try {
      console.log('roy: Starting upload for file type:', file.type)
      
      let imageUrl: string
      let useDevUpload = false

      // Try S3 upload first
      try {
        console.log('roy: Attempting S3 upload')
        const uploadResponse = await fetch('/api/users/upload-profile-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileType: file.type }),
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          console.warn('roy: S3 not configured, using dev upload:', errorData.error || 'S3 unavailable')
          useDevUpload = true
        } else {
          const { uploadUrl, imageUrl: s3ImageUrl } = await uploadResponse.json()
          console.log('roy: Got S3 upload URL, uploading...')

          const s3Response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          })

          if (!s3Response.ok) {
            console.warn('roy: S3 upload failed, falling back to dev upload')
            useDevUpload = true
          } else {
            imageUrl = s3ImageUrl
            console.log('roy: S3 upload successful!')
          }
        }
      } catch (s3Error: any) {
        console.warn('roy: S3 error, using dev upload:', s3Error.message)
        useDevUpload = true
      }

      // Fallback to dev upload if S3 failed or not configured
      if (useDevUpload) {
        console.log('roy: Using development upload (local storage)')
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/users/upload-profile-image-dev', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          console.error('roy: Dev upload error:', errorData)
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const data = await uploadResponse.json()
        imageUrl = data.imageUrl
        console.log('roy: Dev upload successful!')
      }

      // Update database with new image URL
      try {
        const updateResponse = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage: imageUrl }),
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update profile image in database')
        }

        console.log('roy: Profile image URL updated in database')
      } catch (dbError) {
        console.error('roy: Failed to update database:', dbError)
        throw new Error('Image uploaded but failed to update profile. Please refresh the page.')
      }

      // Update preview with actual URL
      setPreview(imageUrl)
      onImageUpdate?.(imageUrl)
      
      // Small delay to ensure S3 file is accessible and database is committed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refresh session to update header image automatically
      // This triggers JWT callback with trigger='update' which fetches fresh data from DB
      // — Royette
      try {
        await updateSession()
        console.log('roy: Session refreshed - header image should update automatically')
      } catch (sessionError) {
        console.error('roy: Error refreshing session:', sessionError)
        // Don't throw - image is uploaded successfully, user can refresh manually
      }
    } catch (error: any) {
      console.error('roy: Upload error:', error)
      alert(error.message || 'Failed to upload image. Please check console for details.')
      setPreview(currentImage || null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onImageUpdate?.('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="profile-image-upload"
        disabled={isUploading}
      />

      <Button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg rounded-full p-2.5 h-auto w-auto min-w-0"
        size="sm"
        title={isUploading ? 'Uploading...' : preview ? 'Change Photo' : 'Upload Photo'}
      >
        {isUploading ? (
          <Clock className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>
      {preview && (
        <button
          onClick={handleRemove}
          className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
          type="button"
          title="Remove photo"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

