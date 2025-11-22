'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, RotateCcw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Camera capture component for document/selfie capture
// Supports both webcam and file upload
// — Royette
interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
  label: string
  aspectRatio?: number // Width/height ratio (e.g., 16/9 = 1.777)
}

export function CameraCapture({ onCapture, onClose, label, aspectRatio = 4 / 3 }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Start camera when component mounts
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      // Determine which camera to use based on label
      // Selfie uses front camera, ID uses back camera
      const isSelfie = label.toLowerCase().includes('selfie') || label.toLowerCase().includes('liveness')
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isSelfie ? 'user' : 'environment', // Front for selfie, back for ID
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCapturing(true)
      }
    } catch (err: any) {
      console.error('roy: Camera access error:', err)
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found. Please use file upload instead.'
          : 'Failed to access camera. Please use file upload instead.'
      )
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob, then to File
    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const file = new File([blob], `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })

        // Create preview URL
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)

        // Stop camera
        stopCamera()
      },
      'image/jpeg',
      0.95 // Quality
    )
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const confirmCapture = () => {
    if (!canvasRef.current || !capturedImage) return

    canvasRef.current.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })

      onCapture(file)
      stopCamera()
      onClose()
    }, 'image/jpeg', 0.95)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    onCapture(file)
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!capturedImage ? (
            <div className="space-y-4">
              {/* Camera View */}
              {isCapturing && !error && (
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-white/50 rounded-lg pointer-events-none" />
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Instructions:</strong>
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Make sure there's good lighting</li>
                  <li>Keep your face/ID clearly visible</li>
                  <li>Hold steady and click capture</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isCapturing && !error && (
                  <Button
                    onClick={capturePhoto}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Photo
                  </Button>
                )}

                {error && (
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Try Camera Again
                  </Button>
                )}

                {/* File Upload Option */}
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    capture="environment" // Use back camera on mobile if available
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      // Trigger file input
                      const input = document.querySelector('input[type="file"]') as HTMLInputElement
                      input?.click()
                    }}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Upload from Device
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            /* Preview Captured Image */
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                <img
                  src={capturedImage || undefined}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmCapture}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Use This Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

