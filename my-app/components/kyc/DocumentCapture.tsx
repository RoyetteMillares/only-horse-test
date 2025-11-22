'use client'

import { useState } from 'react'
import { Camera, RotateCcw, CheckCircle, Upload, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactHtml5CameraPhoto from 'react-html5-camera-photo'
import 'react-html5-camera-photo/build/css/index.css'

// Mobile-optimized document capture component
// Uses react-html5-camera-photo library for better mobile support
// — Royette
interface DocumentCaptureProps {
  idType: string
  onCapture: (file: File) => void
  existingFile?: File
}

export function DocumentCapture({ idType, onCapture, existingFile }: DocumentCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(
    existingFile ? URL.createObjectURL(existingFile) : null
  )
  const [showCamera, setShowCamera] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTakePhoto = (dataUri: string) => {
    // Convert data URI to File
    fetch(dataUri)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `government-id-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        setCapturedImage(dataUri)
        setShowCamera(false)
        onCapture(file)
      })
      .catch((err) => {
        console.error('roy: Error converting photo:', err)
        setError('Failed to process photo. Please try again.')
      })
  }

  const handleCameraError = (error: string | Error) => {
    console.error('roy: Camera error:', error)
    setError(
      typeof error === 'string'
        ? error
        : 'Camera access denied. Please use file upload instead.'
    )
    setShowCamera(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setCapturedImage(imageUrl)
    setError(null)
    onCapture(file)
  }

  const retake = () => {
    setCapturedImage(null)
    setShowCamera(true)
    setError(null)
  }

  if (capturedImage && capturedImage.trim()) {
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-[16/10] bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300">
          <img
            src={capturedImage || undefined}
            alt="Captured ID"
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Captured</span>
          </div>
        </div>
        <Button onClick={retake} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Photo
        </Button>
      </div>
    )
  }

  if (showCamera) {
    return (
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            Capture your {idType.replace('_', ' ')}
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Place your ID on a flat, well-lit surface</li>
            <li>Ensure all corners are visible</li>
            <li>Hold the camera steady</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Component */}
        <div className="relative">
          <ReactHtml5CameraPhoto
            onTakePhoto={handleTakePhoto}
            onCameraError={handleCameraError}
            imageType="jpg"
            imageQuality={0.95}
            idealFacingMode="environment" // Back camera for documents
            idealResolution={{ width: 1920, height: 1080 }}
            isMaxResolution={true}
            isImageMirror={false}
            sizeFactor={1}
          />

          {/* Document Frame Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-3/5 border-4 border-yellow-400 rounded-lg bg-yellow-400/10">
              <div className="absolute -top-6 left-0 right-0 text-center">
                <p className="text-sm font-medium text-yellow-400">Position document in frame</p>
              </div>
              
              {/* Corner Guides */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowCamera(false)}
          variant="outline"
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          How to capture your {idType.replace('_', ' ')}:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Place your ID on a flat, well-lit surface</li>
          <li>Ensure all corners are visible and text is clear</li>
          <li>Remove any glare or shadows</li>
          <li>Hold the camera steady above the document</li>
        </ul>
      </div>

      {/* Capture Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          onClick={() => setShowCamera(true)}
          className="h-32 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Camera className="w-8 h-8" />
          <span>Open Camera</span>
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            capture="environment"
          />
          <div className="h-32 flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Upload className="w-8 h-8 text-gray-600" />
            <span className="text-gray-700">Upload from Device</span>
          </div>
        </label>
      </div>
    </div>
  )
}
