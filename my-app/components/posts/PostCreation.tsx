'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Image as ImageIcon, Video, Lock, Globe, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { VerificationBanner } from '@/components/verification/VerificationBanner'

// Post creation component for creators with image/video upload and public/private toggle
// — Royette
export function PostCreation({ onPostCreated }: { onPostCreated?: () => void }) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Check if user is verified
  const isVerified = session?.user?.kycStatus === 'VERIFIED'

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setMediaType(type)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'image') {
        setImagePreview(reader.result as string)
        setVideoPreview(null)
      } else {
        setVideoPreview(reader.result as string)
        setImagePreview(null)
      }
    }
    reader.readAsDataURL(file)

    // Upload file to S3
    setIsUploading(true)
    try {
      // Get presigned URL
      const uploadResponse = await fetch('/api/posts/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: file.type,
          mediaType: type,
        }),
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await uploadResponse.json()

      if (!uploadUrl) {
        throw new Error('Upload URL not provided by server')
      }

      // Upload file to S3
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text()
        console.error('roy: S3 upload failed:', uploadResult.status, errorText)
        
        // Check for CORS error specifically
        if (uploadResult.status === 0 || errorText.includes('CORS')) {
          throw new Error('CORS error: Please configure CORS on your S3 bucket. See S3_CORS_SETUP.md for instructions.')
        }
        
        throw new Error(`Upload failed: ${uploadResult.status} ${uploadResult.statusText}`)
      }

      setMediaUrl(publicUrl)
    } catch (error: any) {
      console.error('roy: Error uploading file:', error)
      
      // Show more helpful error message
      const errorMessage = error.message || 'Failed to upload file. Please try again.'
      
      if (errorMessage.includes('CORS')) {
        alert(`${errorMessage}\n\nCheck your browser console for details and see S3_CORS_SETUP.md for setup instructions.`)
      } else {
        alert(`Upload failed: ${errorMessage}\n\nPlease check:\n1. S3 bucket CORS configuration\n2. AWS credentials\n3. Network connection`)
      }
      
      setSelectedFile(null)
      setImagePreview(null)
      setVideoPreview(null)
      setMediaUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveMedia = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setVideoPreview(null)
    setMediaUrl(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check verification status
    if (!isVerified) {
      alert('Please complete account verification to create posts. Click "Verify Now" to get started.')
      return
    }

    if (!content.trim()) {
      alert('Please enter post content')
      return
    }

    if (!imageUrl && !videoUrl) {
      alert('Please add an image or video to your post')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: mediaType === 'image' ? mediaUrl : null,
          videoUrl: mediaType === 'video' ? mediaUrl : null,
          isSubscriberOnly,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }

      // Reset form
      setContent('')
      setImagePreview(null)
      setVideoPreview(null)
      setSelectedFile(null)
      setMediaUrl(null)
      setMediaType(null)
      setIsSubscriberOnly(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }

      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error: any) {
      console.error('roy: Error creating post:', error)
      alert(error.message || 'Failed to create post. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const imageUrl = mediaType === 'image' ? mediaUrl : null
  const videoUrl = mediaType === 'video' ? mediaUrl : null

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Create New Post</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Verification Banner */}
        {!isVerified && (
          <div className="mb-4">
            <VerificationBanner />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Textarea */}
          <div>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={4}
              placeholder={isVerified ? "What's on your mind?" : "Complete verification to create posts"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              disabled={!isVerified}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {content.length}/5000
            </div>
          </div>

          {/* Media Preview */}
          {imagePreview && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-300">
              <Image
                src={imagePreview}
                alt="Post preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          {videoPreview && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-300">
              <video
                src={videoPreview}
                controls
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Media Upload Buttons */}
          {!imagePreview && !videoPreview && (
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleFileSelect(e, 'image')}
                className="hidden"
                disabled={!isVerified}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => isVerified && imageInputRef.current?.click()}
                disabled={isUploading || !isVerified}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-4 h-4" />
                Add Image
              </Button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleFileSelect(e, 'video')}
                className="hidden"
                disabled={!isVerified}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => isVerified && videoInputRef.current?.click()}
                disabled={isUploading || !isVerified}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Video className="w-4 h-4" />
                Add Video
              </Button>
            </div>
          )}

          {/* Privacy Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSubscriberOnly(!isSubscriberOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isSubscriberOnly
                  ? 'bg-purple-100 border-purple-500 text-purple-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isSubscriberOnly ? (
                <>
                  <Lock className="w-4 h-4" />
                  Subscriber Only
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Public
                </>
              )}
            </button>
            <span className="text-sm text-gray-600">
              {isSubscriberOnly
                ? 'Only your subscribers can see this post'
                : 'Everyone can see this post'}
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isVerified || isCreating || isUploading || !content.trim() || !mediaUrl}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

