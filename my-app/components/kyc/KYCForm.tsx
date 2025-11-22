'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, CheckCircle, AlertCircle, Camera } from 'lucide-react'
import { CameraCapture } from './CameraCapture'

export function KYCForm({ onSuccess }: { onSuccess?: () => void }) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    idType: 'PASSPORT',
    governmentIdNumber: '',
  })

  const [files, setFiles] = useState<{
    governmentId?: File
    liveness?: File
  }>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [cameraMode, setCameraMode] = useState<'id' | 'selfie' | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setMessage('File size must be less than 5MB')
      return
    }

    setFiles({
      ...files,
      [e.target.name]: file,
    })
  }

  const uploadFile = async (file: File, docType: 'id' | 'selfie') => {
    try {
      // Get upload URL
      const uploadUrlRes = await fetch('/api/kyc/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: file.type,
          docType,
        }),
      })

      if (!uploadUrlRes.ok) throw new Error('Failed to get upload URL')

      const { uploadUrl, fileKey } = await uploadUrlRes.json()

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      return fileKey
    } catch (error: any) {
      throw new Error(`File upload failed: ${error.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      if (!files.governmentId || !files.liveness) {
        throw new Error('All documents are required')
      }

      // Upload files
      const [governmentIdKey, livelinessKey] = await Promise.all([
        uploadFile(files.governmentId, 'id'),
        uploadFile(files.liveness, 'selfie'),
      ])

      // Submit KYC
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          governmentIdKey,
          livelinessKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit KYC')
      }

      setStatus('success')
      setMessage(`KYC submitted successfully! We'll verify within 24-48 hours.`)
      
      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Identity Verification</h2>

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div>
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
            />
            <Input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
            />
          </div>

          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
            className="mt-4"
            required
          />

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              ID Type
            </label>
            <Select
              value={formData.idType}
              onValueChange={(value) =>
                setFormData({ ...formData, idType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="DRIVER_LICENSE">Driver's License</SelectItem>
                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Government ID Number"
            value={formData.governmentIdNumber}
            onChange={(e) =>
              setFormData({ ...formData, governmentIdNumber: e.target.value })
            }
            className="mt-4"
            required
          />
        </div>

        {/* Documents */}
        <div>
          <h3 className="font-semibold mb-4">Documents</h3>

          <div className="space-y-4">
            {/* Government ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.idType}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCameraMode('id')}
                  className="flex items-center justify-center space-x-2 h-auto py-4 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">Open Camera</span>
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    name="governmentId"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center space-x-2 h-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">Upload from Device</span>
                  </div>
                </label>
              </div>
              {files.governmentId && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{files.governmentId.name}</span>
                </div>
              )}
            </div>

            {/* Selfie/Liveness */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Selfie (Liveness Check)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCameraMode('selfie')}
                  className="flex items-center justify-center space-x-2 h-auto py-4 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">Open Camera</span>
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    name="liveness"
                    accept="image/*"
                    onChange={handleFileChange}
                    capture="user"
                    className="hidden"
                  />
                  <div className="flex items-center justify-center space-x-2 h-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">Upload from Device</span>
                  </div>
                </label>
              </div>
              {files.liveness && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{files.liveness.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Camera Capture Modal */}
          {cameraMode && (
            <CameraCapture
              label={cameraMode === 'id' ? `Government ID - ${formData.idType}` : 'Selfie (Liveness Check)'}
              onCapture={(file) => {
                if (cameraMode === 'id') {
                  setFiles({ ...files, governmentId: file })
                } else {
                  setFiles({ ...files, liveness: file })
                }
                setCameraMode(null)
              }}
              onClose={() => setCameraMode(null)}
              aspectRatio={cameraMode === 'id' ? 16 / 9 : 4 / 3}
            />
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting || !files.governmentId || !files.liveness}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
        </Button>

        <p className="text-xs text-gray-600 text-center">
          Your documents are encrypted and stored securely. We verify within 24-48 hours.
        </p>
      </form>
    </div>
  )
}
