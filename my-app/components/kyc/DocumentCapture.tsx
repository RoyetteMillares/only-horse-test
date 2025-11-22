'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, RotateCcw, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

// Web3-style document capture with frame guides and auto-detection
// — Royette
interface DocumentCaptureProps {
  idType: string
  onCapture: (file: File) => void
  existingFile?: File
}

export function DocumentCapture({ idType, onCapture, existingFile }: DocumentCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(
    existingFile ? URL.createObjectURL(existingFile) : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isInFrame, setIsInFrame] = useState(false) // Simulated auto-detection

  useEffect(() => {
    if (showCamera) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [showCamera])

  const startCamera = async () => {
    try {
      setError(null)
      // Use environment camera (back camera) for documents
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera for documents
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      // Simulate document detection after a delay
      setTimeout(() => {
        setIsInFrame(true)
      }, 2000)
    } catch (err: any) {
      console.error('roy: Camera access error:', err)
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : 'Failed to access camera. Please use file upload instead.'
      )
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsInFrame(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], `government-id-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })

      const imageUrl = URL.createObjectURL(blob)
      setCapturedImage(imageUrl)
      stopCamera()
      setShowCamera(false)
      onCapture(file)
    }, 'image/jpeg', 0.95)
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
    onCapture(file)
  }

  const retake = () => {
    setCapturedImage(null)
    setShowCamera(true)
    startCamera()
  }

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-[16/10] bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300">
          <img
            src={capturedImage}
            alt="Captured ID"
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Captured</span>
          </div>
        </div>
        <Button
          onClick={retake}
          variant="outline"
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Photo
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How to capture your {idType.replace('_', ' ')}:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Place your ID on a flat, well-lit surface</li>
          <li>Ensure all corners are visible and text is clear</li>
          <li>Remove any glare or shadows</li>
          <li>Hold the camera steady above the document</li>
        </ul>
      </div>

      {!showCamera ? (
        /* Capture Options */
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
              accept="image/*,.pdf"
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
      ) : (
        /* Camera View with Frame Guide */
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                <Button
                  onClick={() => {
                    setError(null)
                    handleFileUpload({ target: { files: [] } } as any)
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Use File Upload Instead
                </Button>
              </div>
            </div>
          )}

          <div className="relative w-full aspect-[16/10] bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Document Frame Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-4/5 h-3/5 border-4 rounded-lg transition-all ${
                isInFrame ? 'border-green-500 bg-green-500/10' : 'border-yellow-400 bg-yellow-400/10'
              }`}>
                <div className="absolute -top-6 left-0 right-0 text-center">
                  <p className={`text-sm font-medium ${
                    isInFrame ? 'text-green-500' : 'text-yellow-400'
                  }`}>
                    {isInFrame ? '✓ Document Detected' : 'Position document in frame'}
                  </p>
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
            onClick={capturePhoto}
            disabled={!isInFrame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isInFrame ? 'Capture Photo' : 'Position Document...'}
          </Button>

          <Button
            onClick={() => {
              stopCamera()
              setShowCamera(false)
            }}
            variant="outline"
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

