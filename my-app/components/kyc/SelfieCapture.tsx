'use client'

import { useState } from 'react'
import { Camera, RotateCcw, CheckCircle, Upload, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactHtml5CameraPhoto from 'react-html5-camera-photo'
import 'react-html5-camera-photo/build/css/index.css'

// Mobile-optimized selfie capture component
// Uses react-html5-camera-photo library for better mobile support
// — Royette
interface SelfieCaptureProps {
  onCapture: (file: File) => void
  existingFile?: File
}

export function SelfieCapture({ onCapture, existingFile }: SelfieCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(
    existingFile ? URL.createObjectURL(existingFile) : null
  )
  const [showCamera, setShowCamera] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTakePhoto = (dataUri: string) => {
    console.log('roy: Photo captured, converting to file...')
    if (!dataUri) {
      console.error('roy: No data URI provided!')
      setError('Failed to capture photo. Please try again.')
      return
    }
    
    // Convert data URI to File
    fetch(dataUri)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data URI')
        return res.blob()
      })
      .then((blob) => {
        if (!blob || blob.size === 0) {
          throw new Error('Invalid blob data')
        }
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        console.log('roy: File created successfully:', file.name, file.size, 'bytes', 'type:', file.type)
        setCapturedImage(dataUri)
        setShowCamera(false)
        setError(null)
        
        // Ensure file is valid before calling onCapture
        if (!file || file.size === 0) {
          throw new Error('Invalid file created')
        }
        
        // Call onCapture to update parent state - this should enable the Next button
        console.log('roy: Calling onCapture with file:', file.name)
        onCapture(file)
        console.log('roy: onCapture called successfully')
      })
      .catch((err) => {
        console.error('roy: Error converting photo:', err)
        setError('Failed to process photo. Please try again.')
        setShowCamera(true) // Re-open camera on error
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
    console.log('roy: File uploaded:', file.name, file.size, 'bytes')
    // Call onCapture to update parent state
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
        <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-900 rounded-full overflow-hidden border-4 border-gray-300">
          <img
            src={capturedImage || undefined}
            alt="Captured selfie"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Captured</span>
          </div>
        </div>
        <Button onClick={retake} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Selfie
        </Button>
      </div>
    )
  }

  if (showCamera) {
    return (
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How to take your selfie:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Face the camera directly with good lighting</li>
            <li>Remove glasses, hat, or anything covering your face</li>
            <li>Keep your face centered in the frame</li>
            <li>Maintain a neutral expression</li>
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
            idealFacingMode="user" // Front camera for selfies
            idealResolution={{ width: 1280, height: 720 }}
            isMaxResolution={true}
            isImageMirror={true} // Mirror selfie like phone camera
            sizeFactor={1}
          />

          {/* Face Frame Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-80 border-4 border-yellow-400 rounded-full bg-yellow-400/10">
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center w-full">
                <p className="text-sm font-medium text-yellow-400">
                  Position your face in the frame
                </p>
              </div>
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
        <h4 className="font-semibold text-blue-900 mb-2">How to take your selfie:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Face the camera directly with good lighting</li>
          <li>Remove glasses, hat, or anything covering your face</li>
          <li>Keep your face centered in the frame</li>
          <li>Maintain a neutral expression</li>
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
            capture="user"
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
