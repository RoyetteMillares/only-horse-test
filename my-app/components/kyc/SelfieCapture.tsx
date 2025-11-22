'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, RotateCcw, CheckCircle, AlertCircle, Upload, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Web3-style selfie capture with face detection frame guides
// — Royette
interface SelfieCaptureProps {
  onCapture: (file: File) => void
  existingFile?: File
}

export function SelfieCapture({ onCapture, existingFile }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(
    existingFile ? URL.createObjectURL(existingFile) : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isFaceDetected, setIsFaceDetected] = useState(false) // Simulated face detection

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
      // Use front camera for selfies
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      // Simulate face detection after a delay
      setTimeout(() => {
        setIsFaceDetected(true)
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
    setIsFaceDetected(false)
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

      const file = new File([blob], `selfie-${Date.now()}.jpg`, {
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
        <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-900 rounded-full overflow-hidden border-4 border-gray-300">
          <img
            src={capturedImage}
            alt="Captured selfie"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
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
          Retake Selfie
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
      ) : (
        /* Camera View with Face Frame Guide */
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

          <div className="relative w-full aspect-square max-w-md mx-auto bg-black rounded-full overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Face Detection Frame Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-64 h-80 border-4 rounded-full transition-all ${
                isFaceDetected ? 'border-green-500 bg-green-500/10' : 'border-yellow-400 bg-yellow-400/10'
              }`}>
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center w-full">
                  <p className={`text-sm font-medium ${
                    isFaceDetected ? 'text-green-500' : 'text-yellow-400'
                  }`}>
                    {isFaceDetected ? '✓ Face Detected' : 'Position your face in the frame'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={capturePhoto}
            disabled={!isFaceDetected}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isFaceDetected ? 'Capture Selfie' : 'Position Face...'}
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

